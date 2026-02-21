import { SupabaseClient } from '@supabase/supabase-js';
import { createNotification } from '@/services/notification.service';
import { Database } from '../../supabase/types';

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

      const lastStage1 = events?.find(e => e.event_type === 'escalation_stage_1');
      const lastStage2 = events?.find(e => e.event_type === 'escalation_stage_2');
      const lastStage3 = events?.find(e => e.event_type === 'escalation_stage_3');

      const now = new Date();

      // Stage 1 check (cooldown: 12h)
      if (!lastStage1 || (now.getTime() - new Date(lastStage1.created_at).getTime()) > 12 * 60 * 60 * 1000) {
        await notifyAndLog(supabase, task, 'escalation_stage_1', task.owner_id, 
          `Action needed: ${task.title} has been flagged at-risk in ${task.campaign?.name}`);
      }

      // Stage 2 check (trigger: 24h after stage 1, cooldown: 24h)
      if (lastStage1 && (now.getTime() - new Date(lastStage1.created_at).getTime()) > 24 * 60 * 60 * 1000) {
        if (!lastStage2 || (now.getTime() - new Date(lastStage2.created_at).getTime()) > 24 * 60 * 60 * 1000) {
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
        }
      }

      // Stage 3 check (trigger: 48h after stage 1, cooldown: 48h)
      if (lastStage1 && (now.getTime() - new Date(lastStage1.created_at).getTime()) > 48 * 60 * 60 * 1000) {
        if (!lastStage3 || (now.getTime() - new Date(lastStage3.created_at).getTime()) > 48 * 60 * 60 * 1000) {
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
  await supabase.from('task_events').insert({
    task_id: task.id,
    org_id: task.org_id,
    event_type: eventType,
    new_value: message.substring(0, 255),
  });

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
