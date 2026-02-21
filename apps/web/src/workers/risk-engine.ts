import { SupabaseClient } from '@supabase/supabase-js';
import { processEscalations } from './escalation-processor';
import { Database } from '../../supabase/types';

export interface RiskEngineResult {
  processedOrgs: number;
  tasksEvaluated: number;
  riskChanges: number;
}

export async function runRiskEngine(supabase: SupabaseClient, orgId?: string): Promise<RiskEngineResult> {
  const startTime = new Date().toISOString();
  console.log(JSON.stringify({ event: 'risk_engine_start', startTime, orgId }));

  let processedOrgs = 0;
  let tasksEvaluated = 0;
  let riskChanges = 0;

  try {
    const targetOrgIds: string[] = [];

    if (orgId) {
      targetOrgIds.push(orgId);
    } else {
      // Cron mode: fetch all unique org_ids with active tasks
      const { data: orgs } = await supabase.from('organizations').select('id');
      if (orgs) targetOrgIds.push(...orgs.map(o => o.id));
    }

    for (const id of targetOrgIds) {
      const result = await processOrg(supabase, id);
      processedOrgs++;
      tasksEvaluated += result.tasksEvaluated;
      riskChanges += result.riskChanges;
      
      // Run escalation processor after risk scoring
      await processEscalations(supabase, id);
    }

  } catch (error) {
    console.error(JSON.stringify({ event: 'risk_engine_error', error }));
  }

  const endTime = new Date().toISOString();
  console.log(JSON.stringify({ 
    event: 'risk_engine_end', 
    endTime, 
    processedOrgs, 
    tasksEvaluated, 
    riskChanges 
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

  for (const task of tasks) {
    tasksEvaluated++;
    let newRiskFlag = task.risk_flag;

    // Check 1 — Stale assignment (>24h since assigned_at if status = not_started)
    if (task.status === 'not_started' && task.assigned_at) {
      const assignedAt = new Date(task.assigned_at);
      const hoursSinceAssigned = (now.getTime() - assignedAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceAssigned > 24 && !newRiskFlag) {
        newRiskFlag = 'soft_risk';
      }
    }

    // Check 2 — Dependency gap (>12h since dependency completed)
    if (task.dependency_id && task.status === 'not_started') {
      const { data: depEvent } = await supabase
        .from('task_events')
        .select('created_at')
        .eq('task_id', task.dependency_id)
        .eq('event_type', 'status_changed')
        .eq('new_value', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (depEvent) {
        const completedAt = new Date(depEvent.created_at);
        const gapHours = (now.getTime() - completedAt.getTime()) / (1000 * 60 * 60);
        if (gapHours > 12 && newRiskFlag !== 'hard_risk') {
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
      const { data: blockEvent } = await supabase
        .from('task_events')
        .select('created_at')
        .eq('task_id', task.id)
        .eq('new_value', 'blocked')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (blockEvent) {
        const blockedAt = new Date(blockEvent.created_at);
        const hoursBlocked = (now.getTime() - blockedAt.getTime()) / (1000 * 60 * 60);
        if (hoursBlocked > 24 && newRiskFlag !== 'hard_risk') {
          newRiskFlag = 'hard_risk';
        }
      }
    }

    // Apply task risk update if changed
    if (newRiskFlag !== task.risk_flag) {
      riskChanges++;
      await supabase.from('tasks').update({ risk_flag: newRiskFlag }).eq('id', task.id);
      await supabase.from('task_events').insert({
        task_id: task.id,
        org_id: orgId,
        event_type: 'risk_flag_set',
        new_value: newRiskFlag as string,
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
      const hardRiskCount = tasksInCampaign.filter((t: Database['public']['Tables']['tasks']['Row']) => t.risk_flag === 'hard_risk').length;
      const softRiskCount = tasksInCampaign.filter((t: Database['public']['Tables']['tasks']['Row']) => t.risk_flag === 'soft_risk').length;
      const pendingTasksCount = tasksInCampaign.filter((t: Database['public']['Tables']['tasks']['Row']) => t.status !== 'completed').length;
      
      const launchDate = new Date(campaign.launch_date);
      const hoursToLaunch = (launchDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      let newRisk: Database['public']['Enums']['campaign_risk'] = 'normal';

      if (now > launchDate || hardRiskCount >= 3) {
        newRisk = 'high_risk';
      } else if (hardRiskCount + softRiskCount >= 2 || (hoursToLaunch <= 48 && pendingTasksCount > 0)) {
        newRisk = 'at_risk';
      }

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
