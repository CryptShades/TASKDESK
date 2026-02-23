import { SupabaseClient } from '@supabase/supabase-js';
import { revalidateTag } from 'next/cache';
import { processEscalations } from './escalation-processor';
import { Database } from '../../supabase/types';
import {
  SYSTEM_ACTOR_ID,
  TASK_STALE_ASSIGNMENT_HOURS,
  DEPENDENCY_GAP_SOFT_RISK_HOURS,
  TASK_BLOCKED_HARD_RISK_HOURS,
} from '@/lib/constants';
import { logger } from '@/lib/logger';
import { acquireLock, releaseLock, readCursorState, updateCursorState } from '@/lib/worker-lock';

export interface RiskEngineResult {
  processedOrgs: number;
  tasksEvaluated: number;
  riskChanges: number;
  batchSize?: number;
  cursorPosition?: string | null;
}

export interface RiskEngineOptions {
  orgId?: string;
  pageSize?: number;
}

type Task = Database['public']['Tables']['tasks']['Row'];
type TaskEvent = Database['public']['Tables']['task_events']['Row'];
type Campaign = Database['public']['Tables']['campaigns']['Row'];

export function evaluateTaskRisk(task: Task, taskEvents: TaskEvent[], now: Date): 'soft_risk' | 'hard_risk' | null {
  let newRiskFlag = task.risk_flag;

  // Check 1 — Stale assignment (>24h since assigned_at if status = not_started)
  if (task.status === 'not_started' && task.assigned_at) {
    const assignedAt = new Date(task.assigned_at);
    const hoursSinceAssigned = (now.getTime() - assignedAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceAssigned > TASK_STALE_ASSIGNMENT_HOURS && !newRiskFlag) {
      newRiskFlag = 'soft_risk';
    }
  }

  // Check 2 — Dependency gap (>12h since dependency completed)
  if (task.dependency_id && task.status === 'not_started') {
    const depCompletedEvent = taskEvents
      .filter(e => e.task_id === task.dependency_id && e.event_type === 'status_changed' && e.new_value === 'completed')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    
    if (depCompletedEvent) {
      const completedAt = new Date(depCompletedEvent.created_at);
      const gapHours = (now.getTime() - completedAt.getTime()) / (1000 * 60 * 60);
      if (gapHours > DEPENDENCY_GAP_SOFT_RISK_HOURS && newRiskFlag !== 'hard_risk') {
        newRiskFlag = 'soft_risk';
      }
    }
  }

  // Check 3 — Overdue (hard risk)
  if (task.due_date && now > new Date(task.due_date) && task.status !== 'completed') {
    newRiskFlag = 'hard_risk';
  }

  // Check 4 — Blocked duration (>24h)
  if (task.status === 'blocked') {
    const blockedEvent = taskEvents
      .filter(e => e.task_id === task.id && e.event_type === 'status_changed' && e.new_value === 'blocked')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    
    if (blockedEvent) {
      const blockedAt = new Date(blockedEvent.created_at);
      const hoursBlocked = (now.getTime() - blockedAt.getTime()) / (1000 * 60 * 60);
      if (hoursBlocked > TASK_BLOCKED_HARD_RISK_HOURS && newRiskFlag !== 'hard_risk') {
        newRiskFlag = 'hard_risk';
      } else if (hoursBlocked > 0 && !newRiskFlag) { // Assuming soft risk for blocked tasks under hard threshold
        newRiskFlag = 'soft_risk';
      }
    }
  }

  return newRiskFlag;
}

export function calculateCampaignRisk(campaign: Campaign, tasks: Task[], now: Date): 'normal' | 'at_risk' | 'high_risk' {
  const hardRiskCount = tasks.filter(t => t.risk_flag === 'hard_risk').length;
  const softRiskCount = tasks.filter(t => t.risk_flag === 'soft_risk').length;
  const pendingTasksCount = tasks.filter(t => t.status !== 'completed').length;
  
  const launchDate = new Date(campaign.launch_date);
  const hoursToLaunch = (launchDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  let newRisk: 'normal' | 'at_risk' | 'high_risk' = 'normal';

  if (now > launchDate || hardRiskCount >= 3) {
    newRisk = 'high_risk';
  } else if (hardRiskCount + softRiskCount >= 2 || (hoursToLaunch <= 48 && pendingTasksCount > 0)) {
    newRisk = 'at_risk';
  }

  return newRisk;
}

export async function runRiskEngine(supabase: SupabaseClient, options?: RiskEngineOptions): Promise<RiskEngineResult> {
  const wallStart = Date.now();
  const startTime = new Date().toISOString();

  let processedOrgs = 0;
  let tasksEvaluated = 0;
  let riskChanges = 0;

  // TTL = 55 min — slightly shorter than the 60-min cron interval so a crashed
  // run does not block the next scheduled invocation.
  const lockName = 'risk_engine';
  const acquired = await acquireLock(supabase, lockName, 55);
  if (!acquired) {
    logger.info('Risk engine skipped — lock held by another instance', {
      event: 'risk_engine_skipped',
      reason: 'lock_held',
      startTime,
    });
    return { processedOrgs, tasksEvaluated, riskChanges };
  }

  try {
    const targetOrgIds: string[] = [];
    let cursorPosition: string | null = null;

    if (options?.orgId) {
      // Event-triggered mode: process only this org, ignore pagination
      targetOrgIds.push(options.orgId);
      logger.info('Risk engine start', {
        event: 'risk_engine_start',
        startTime,
        mode: 'event_triggered',
        org_id: options.orgId,
      });
    } else {
      // Cron mode: fetch orgs in pages using cursor
      const { lastProcessedOrgId, pageSize } = await readCursorState(supabase, lockName);
      const effectivePageSize = options?.pageSize || pageSize;

      // Build query: fetch next page of orgs after the cursor
      let query = supabase
        .from('organizations')
        .select('id')
        .order('id', { ascending: true })
        .limit(effectivePageSize);

      // If cursor exists, fetch orgs after that ID
      if (lastProcessedOrgId) {
        query = query.gt('id', lastProcessedOrgId);
      }

      const { data: orgs, error } = await query;

      if (error) throw error;

      if (orgs && orgs.length > 0) {
        targetOrgIds.push(...orgs.map(o => o.id));
        cursorPosition = orgs[orgs.length - 1].id;

        // If fewer orgs than pageSize, we've wrapped around — reset cursor
        const isWrapped = orgs.length < effectivePageSize;
        if (isWrapped) {
          cursorPosition = null;
        }
      } else {
        // No orgs found after cursor — wrap around to beginning
        cursorPosition = null;
      }

      logger.info('Risk engine start', {
        event: 'risk_engine_start',
        startTime,
        mode: 'cron',
        batchSize: targetOrgIds.length,
        cursorPosition: lastProcessedOrgId,
      });
    }

    // Process orgs in parallel within this page using Promise.allSettled()
    if (targetOrgIds.length > 0) {
      const orgProcesses = targetOrgIds.map(id => processOrg(supabase, id));
      const results = await Promise.allSettled(orgProcesses);

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const orgId = targetOrgIds[i];

        if (result.status === 'fulfilled') {
          processedOrgs++;
          tasksEvaluated += result.value.tasksEvaluated;
          riskChanges += result.value.riskChanges;

          // Run escalation processor after risk scoring
          await processEscalations(supabase, orgId).catch((error) => {
            logger.error('Risk engine escalation processor failed', {
              event: 'risk_engine_escalation_error',
              org_id: orgId,
              error: error instanceof Error ? error.message : String(error),
            });
          });
        } else {
          // Log rejected org process but continue with others
          logger.error('Risk engine org processing failed', {
            event: 'risk_engine_org_process_failed',
            org_id: orgId,
            error: result.reason instanceof Error ? result.reason.message : String(result.reason),
          });
        }
      }

      // Update cursor position if not in event-triggered mode
      if (!options?.orgId && cursorPosition !== undefined) {
        await updateCursorState(supabase, lockName, cursorPosition);
      }
    }

  } catch (error) {
    logger.error('Risk engine unexpected error', {
      event: 'risk_engine_error',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
  } finally {
    await releaseLock(supabase, lockName);
  }

  const durationMs = Date.now() - wallStart;
  logger.info('Risk engine end', {
    event: 'risk_engine_end',
    durationMs,
    processedOrgs,
    tasksEvaluated,
    riskChanges,
  });

  return { processedOrgs, tasksEvaluated, riskChanges };
}

/**
 * Walk the dependency chain for a task and return the ID of the first
 * upstream task that has hard_risk, or null if none exist.
 * Uses effectiveRiskMap so flags updated earlier in the same run are seen.
 */
function findHardRiskUpstream(
  task: Task,
  taskById: Map<string, Task>,
  effectiveRiskMap: Map<string, 'soft_risk' | 'hard_risk' | null>,
): string | null {
  const visited = new Set<string>();
  let currentId = task.dependency_id;

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    if (effectiveRiskMap.get(currentId) === 'hard_risk') {
      return currentId;
    }
    const upstream = taskById.get(currentId);
    if (!upstream) break;
    currentId = upstream.dependency_id;
  }

  return null;
}

async function processOrg(supabase: SupabaseClient, orgId: string) {
  let tasksEvaluated = 0;
  let riskChanges = 0;

  // Step 1 — Task-level risk evaluation
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .eq('org_id', orgId)
    .not('status', 'eq', 'completed');

  if (tasksError) throw tasksError;

  const now = new Date();

  // Fetch all task events for the tasks and their dependencies
  const taskIds = tasks.map(t => t.id);
  const dependencyIds = tasks
    .filter(t => t.dependency_id)
    .map(t => t.dependency_id as string);
  const allIds = [...new Set([...taskIds, ...dependencyIds])];

  const { data: taskEvents } = await supabase
    .from('task_events')
    .select('*')
    .in('task_id', allIds)
    .order('created_at', { ascending: false });

  if (!taskEvents) throw new Error('Failed to fetch task events');

  // Build lookup structures used for both individual evaluation and propagation
  const taskById = new Map<string, Task>(tasks.map(t => [t.id, t]));
  // Tracks the post-evaluation risk flag for each task (updated in-place below)
  const effectiveRiskMap = new Map<string, 'soft_risk' | 'hard_risk' | null>(
    tasks.map(t => [t.id, t.risk_flag]),
  );

  for (const task of tasks) {
    tasksEvaluated++;
    const relevantEvents = taskEvents.filter(
      e => e.task_id === task.id || (task.dependency_id && e.task_id === task.dependency_id),
    );
    const newRiskFlag = evaluateTaskRisk(task, relevantEvents, now);

    // Keep effective map in sync so propagation sees up-to-date values
    effectiveRiskMap.set(task.id, newRiskFlag);

    // Apply task risk update if changed
    if (newRiskFlag !== task.risk_flag) {
      riskChanges++;
      await supabase.from('tasks').update({ risk_flag: newRiskFlag }).eq('id', task.id);
      const { error: eventError } = await supabase.from('task_events').insert({
        task_id: task.id,
        org_id: orgId,
        actor_id: SYSTEM_ACTOR_ID,
        event_type: 'risk_flag_set',
        new_value: newRiskFlag as string,
      });
      if (eventError) {
        logger.error('Risk engine task event insert failed', {
          event: 'risk_engine_event_insert_error',
          task_id: task.id,
          org_id: orgId,
          error: eventError.message,
        });
      }
    }
  }

  // Step 1b — Transitive dependency risk propagation
  // If any upstream task in a chain has hard_risk, downstream not_started
  // tasks inherit at least soft_risk so founders see the full blast radius.
  for (const task of tasks) {
    if (task.status !== 'not_started') continue;

    const originTaskId = findHardRiskUpstream(task, taskById, effectiveRiskMap);
    if (!originTaskId) continue;

    const currentRisk = effectiveRiskMap.get(task.id);
    if (currentRisk === 'hard_risk' || currentRisk === 'soft_risk') continue;

    effectiveRiskMap.set(task.id, 'soft_risk');
    riskChanges++;

    await supabase.from('tasks').update({ risk_flag: 'soft_risk' }).eq('id', task.id);

    const { error: propEventError } = await supabase.from('task_events').insert({
      task_id: task.id,
      org_id: orgId,
      actor_id: SYSTEM_ACTOR_ID,
      event_type: 'risk_propagated',
      new_value: originTaskId,
    });
    if (propEventError) {
      logger.error('Risk engine propagation event insert failed', {
        event: 'risk_engine_propagation_event_error',
        task_id: task.id,
        origin_task_id: originTaskId,
        org_id: orgId,
        error: propEventError.message,
      });
    }
  }

  // Step 2 — Campaign-level risk scoring
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*, tasks(*)')
    .eq('org_id', orgId);

  if (campaigns) {
    for (const campaign of campaigns) {
      const tasksInCampaign = (campaign as any).tasks || [];
      const newRisk = calculateCampaignRisk(campaign, tasksInCampaign, now);

      if (newRisk !== campaign.risk_status) {
        // Guard against the campaign being deleted between the fetch and the update
        const { data: updated } = await supabase
          .from('campaigns')
          .update({ risk_status: newRisk })
          .eq('id', campaign.id)
          .select('id');

        if (!updated || updated.length === 0) {
          logger.warn('Risk engine: campaign not found during scoring — may have been deleted', {
            event: 'risk_engine_campaign_not_found',
            campaign_id: campaign.id,
            org_id: orgId,
          });
          continue;
        }

        // Bust the founder dashboard cache immediately — risk metrics changed.
        revalidateTag(`dashboard-${orgId}`);
      }
    }
  }

  return { tasksEvaluated, riskChanges };
}
