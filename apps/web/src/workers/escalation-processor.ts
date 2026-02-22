import { SupabaseClient } from '@supabase/supabase-js';
import { createNotification } from '@/services/notification.service';
import { Database } from '../../supabase/types';
import {
  SYSTEM_ACTOR_ID,
  ESCALATION_STAGE_1_COOLDOWN_HOURS,
  ESCALATION_STAGE_2_COOLDOWN_HOURS,
  ESCALATION_STAGE_3_COOLDOWN_HOURS,
} from '@/lib/constants';

type Task = Database['public']['Tables']['tasks']['Row'];
type TaskEvent = Database['public']['Tables']['task_events']['Row'];

export function determineEscalationStage(task: Task, taskEvents: TaskEvent[], now: Date): 1 | 2 | 3 | null {
  // No escalation for tasks without risk flags or completed tasks
  if (!task.risk_flag || task.status === 'completed') {
    return null;
  }

  const lastStage1 = taskEvents.find(e => e.event_type === 'escalation_stage_1');
  const lastStage2 = taskEvents.find(e => e.event_type === 'escalation_stage_2');
  const lastStage3 = taskEvents.find(e => e.event_type === 'escalation_stage_3');

  // Check for Stage 3 first (highest priority)
  if (lastStage1 && (now.getTime() - new Date(lastStage1.created_at).getTime()) > ESCALATION_STAGE_3_COOLDOWN_HOURS * 60 * 60 * 1000) {
    if (!lastStage3 || (now.getTime() - new Date(lastStage3.created_at).getTime()) > ESCALATION_STAGE_3_COOLDOWN_HOURS * 60 * 60 * 1000) {
      return 3;
    }
  }

  // Check for Stage 2
  if (lastStage1 && (now.getTime() - new Date(lastStage1.created_at).getTime()) > ESCALATION_STAGE_2_COOLDOWN_HOURS * 60 * 60 * 1000) {
    if (!lastStage2 || (now.getTime() - new Date(lastStage2.created_at).getTime()) > ESCALATION_STAGE_2_COOLDOWN_HOURS * 60 * 60 * 1000) {
      return 2;
    }
  }

  // Check for Stage 1
  if (!lastStage1 || (now.getTime() - new Date(lastStage1.created_at).getTime()) > ESCALATION_STAGE_1_COOLDOWN_HOURS * 60 * 60 * 1000) {
    return 1;
  }

  return null;
}

export async function processEscalations(supabase: SupabaseClient, orgId: string) {
  console.log(JSON.stringify({ event: 'escalation_process_start', orgId }));

  try {
    // Fetch all tasks with risk_flag and not completed in this org
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select(`
        *,
        owner:users(id, name),
        campaign:campaigns(name)
      `)
      .not('risk_flag', 'is', null)
      .not('status', 'eq', 'completed')
      .eq('org_id', orgId);

    if (error) throw error;

    for (const task of tasks) {
      // Fetch escalation history for this task
      const { data: events } = await supabase
        .from('task_events')
        .select('*')
        .eq('task_id', task.id)
        .in('event_type', ['escalation_stage_1', 'escalation_stage_2', 'escalation_stage_3'])
        .order('created_at', { ascending: false });

      const now = new Date();
      const stage = determineEscalationStage(task, events || [], now);

      if (stage === 1) {
        await notifyAndLog(supabase, task, 'escalation_stage_1', task.owner_id, 
          `Action needed: ${task.title} has been flagged at-risk in ${task.campaign?.name}`);
      } else if (stage === 2) {
        // Get managers
        const { data: managers } = await supabase
          .from('users')
          .select('id')
          .eq('org_id', task.org_id)
          .eq('role', 'manager');

        if (managers) {
          for (const manager of managers) {
            await notifyAndLog(supabase, task, 'escalation_stage_2', manager.id,
              `${task.campaign?.name} — ${task.title} is stalled. Owner has not resolved.`);
          }
        }
      } else if (stage === 3) {
        // Get founders
        const { data: founders } = await supabase
          .from('users')
          .select('id')
          .eq('org_id', task.org_id)
          .eq('role', 'founder');

        if (founders) {
          for (const founder of founders) {
            await notifyAndLog(supabase, task, 'escalation_stage_3', founder.id,
              `Founder alert: ${task.title} in ${task.campaign?.name} has been at risk for 48h. Owner: ${task.owner?.name}.`);
          }
        }
      }
    }
  } catch (error) {
    console.error(JSON.stringify({ event: 'escalation_process_error', error }));
  }
}

async function notifyAndLog(
  supabase: SupabaseClient, 
  task: any, 
  eventType: string, 
  userId: string, 
  message: string
) {
  // Log task_event
  const { error: eventError } = await supabase.from('task_events').insert({
    task_id: task.id,
    org_id: task.org_id,
    actor_id: SYSTEM_ACTOR_ID,
    event_type: eventType,
    new_value: message.substring(0, 255),
  });
  if (eventError) {
    console.error(JSON.stringify({ event: 'escalation_event_insert_error', taskId: task.id, error: eventError }));
  }

  // Create notification
  await createNotification({
    org_id: task.org_id,
    user_id: userId,
    task_id: task.id,
    campaign_id: task.campaign_id,
    type: 'escalation',
    message: message,
  });
}
