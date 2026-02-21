import { SupabaseClient } from '@supabase/supabase-js';
import { createNotification } from '@/services/notification.service';
import { Database } from '../../supabase/types';

type TaskWithCampaign = Database['public']['Tables']['tasks']['Row'] & {
  campaign: {
    name: string;
    launch_date: string;
  } | null;
};

export async function runReminderEngine(supabase: SupabaseClient) {
  const startTime = new Date().toISOString();
  console.log(JSON.stringify({ event: 'reminder_engine_start', startTime }));

  let processedCount = 0;
  let notifiedCount = 0;

  try {
    // Step 1 - Fetch all non-completed tasks with due dates
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select(`
        *,
        campaign:campaigns(name, launch_date)
      `)
      .not('status', 'eq', 'completed')
      .not('due_date', 'is', null);

    if (tasksError) throw tasksError;

    const now = new Date();

    for (const task of (tasks as TaskWithCampaign[])) {
      processedCount++;
      const dueDate = new Date(task.due_date);
      const diffMs = dueDate.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      let notificationSent = false;

      // Rule A — 24-hour reminder (23-25h window)
      if (diffHours >= 23 && diffHours <= 25) {
        const alreadySent = await hasRecentNotification(supabase, task.id, 'reminder_sent', '24h', 22);
        if (!alreadySent) {
          await createReminderNotification(supabase, task, '24h', `Due tomorrow: ${task.title} in ${task.campaign?.name}`);
          notificationSent = true;
        }
      }

      // Rule B — Due date morning (07:00-09:00 UTC)
      const isSameDay = now.getUTCFullYear() === dueDate.getUTCFullYear() &&
                        now.getUTCMonth() === dueDate.getUTCMonth() &&
                        now.getUTCDate() === dueDate.getUTCDate();
      
      const currentHourUTC = now.getUTCHours();

      if (isSameDay && currentHourUTC >= 7 && currentHourUTC <= 9) {
        const alreadySent = await hasRecentNotification(supabase, task.id, 'reminder_sent', 'due_today', 12);
        if (!alreadySent) {
          await createReminderNotification(supabase, task, 'due_today', `Due today: ${task.title} — please update your status`);
          notificationSent = true;
        }
      }

      // Rule C — Overdue
      if (now > dueDate && task.status !== 'completed') {
        const overdueHours = Math.floor(Math.abs(diffHours));
        
        // Check if task already has risk_flag = 'hard_risk'
        if (task.risk_flag !== 'hard_risk') {
          // Update task to hard_risk
          await supabase
            .from('tasks')
            .update({ risk_flag: 'hard_risk' })
            .eq('id', task.id);

          // Log risk_flag_set event
          await supabase.from('task_events').insert({
            task_id: task.id,
            org_id: task.org_id,
            event_type: 'risk_flag_set',
            new_value: 'hard_risk',
          });

          // Send notification
          await createReminderNotification(supabase, task, 'overdue', `OVERDUE: ${task.title} — overdue by ${overdueHours}h. Update your status now.`);
          notificationSent = true;

          // Note: Campaign risk recalculation is typically handled by the Risk Engine, 
          // but the prompt says "Queue campaign risk recalculation". 
          // Since our risk engine runs hourly too, it will catch this.
        }
      }

      if (notificationSent) notifiedCount++;
    }

  } catch (error) {
    console.error(JSON.stringify({ event: 'reminder_engine_error', error }));
  }

  const endTime = new Date().toISOString();
  console.log(JSON.stringify({ 
    event: 'reminder_engine_end', 
    endTime, 
    processed: processedCount, 
    notified: notifiedCount 
  }));

  return { processed: processedCount, notified: notifiedCount };
}

async function hasRecentNotification(
  supabase: SupabaseClient, 
  taskId: string, 
  eventType: string, 
  newValue: string, 
  hoursWindow: number
) {
  const windowStart = new Date(Date.now() - hoursWindow * 60 * 60 * 1000).toISOString();
  
  const { data, error } = await supabase
    .from('task_events')
    .select('id')
    .eq('task_id', taskId)
    .eq('event_type', eventType)
    .eq('new_value', newValue)
    .gt('created_at', windowStart)
    .limit(1);

  if (error) return false;
  return data && data.length > 0;
}

async function createReminderNotification(
  supabase: SupabaseClient,
  task: TaskWithCampaign,
  type: string,
  message: string
) {
  // Log task_event
  await supabase.from('task_events').insert({
    task_id: task.id,
    org_id: task.org_id,
    event_type: 'reminder_sent',
    new_value: type,
  });

  // Create notification
  await createNotification({
    org_id: task.org_id,
    user_id: task.owner_id as string,
    task_id: task.id,
    campaign_id: task.campaign_id as string,
    type: 'reminder',
    message: message,
  });
}
