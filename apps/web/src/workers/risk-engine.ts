import { SupabaseClient } from '@supabase/supabase-js';
import { processEscalations } from './escalation-processor';
import { Database } from '../../supabase/types';
import {
  SYSTEM_ACTOR_ID,
  TASK_STALE_ASSIGNMENT_HOURS,
  DEPENDENCY_GAP_SOFT_RISK_HOURS,
  TASK_BLOCKED_HARD_RISK_HOURS,
} from '@/lib/constants';
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
    console.log(JSON.stringify({ event: 'risk_engine_skipped', reason: 'lock_held', startTime }));
    return { processedOrgs, tasksEvaluated, riskChanges };
  }

  try {
    const targetOrgIds: string[] = [];
    let cursorPosition: string | null = null;

    if (options?.orgId) {
      // Event-triggered mode: process only this org, ignore pagination
      targetOrgIds.push(options.orgId);
      console.log(JSON.stringify({
        event: 'risk_engine_start',
        startTime,
        mode: 'event_triggered',
        orgId: options.orgId,
      }));
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

      console.log(JSON.stringify({
        event: 'risk_engine_start',
        startTime,
        mode: 'cron',
        batchSize: targetOrgIds.length,
        cursorPosition: lastProcessedOrgId,
      }));
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
            console.error(JSON.stringify({
              event: 'risk_engine_escalation_error',
              orgId,
              error,
            }));
          });
        } else {
          // Log rejected org process but continue with others
          console.error(JSON.stringify({
            event: 'risk_engine_org_process_failed',
            orgId,
            reason: result.reason,
          }));
        }
      }

      // Update cursor position if not in event-triggered mode
      if (!options?.orgId && cursorPosition !== undefined) {
        await updateCursorState(supabase, lockName, cursorPosition);
      }
    }

  } catch (error) {
    console.error(JSON.stringify({ event: 'risk_engine_error', error }));
  } finally {
    await releaseLock(supabase, lockName);
  }

  const durationMs = Date.now() - wallStart;
  console.log(JSON.stringify({
    event: 'risk_engine_end',
    durationMs,
    processedOrgs,
    tasksEvaluated,
    riskChanges,
  }));

  return { processedOrgs, tasksEvaluated, riskChanges };
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

  for (const task of tasks) {
    tasksEvaluated++;
    const relevantEvents = taskEvents.filter(e => e.task_id === task.id || (task.dependency_id && e.task_id === task.dependency_id));
    const newRiskFlag = evaluateTaskRisk(task, relevantEvents, now);

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
        console.error(JSON.stringify({ event: 'risk_engine_event_insert_error', taskId: task.id, error: eventError }));
      }
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
        await supabase
          .from('campaigns')
          .update({ risk_status: newRisk })
          .eq('id', campaign.id);
      }
    }
  }

  return { tasksEvaluated, riskChanges };
}
