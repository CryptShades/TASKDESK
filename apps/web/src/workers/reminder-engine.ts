import { SupabaseClient } from '@supabase/supabase-js';
import { createNotification } from '@/services/notification.service';
import { Database } from '../../supabase/types';
import {
  SYSTEM_ACTOR_ID,
  REMINDER_24H_WINDOW_LOWER,
  REMINDER_24H_WINDOW_UPPER,
} from '@/lib/constants';
import { acquireLock, releaseLock, readCursorState, updateCursorState } from '@/lib/worker-lock';

type TaskWithCampaign = Database['public']['Tables']['tasks']['Row'] & {
  campaign: {
    name: string;
    launch_date: string;
  } | null;
};

type Task = Database['public']['Tables']['tasks']['Row'];
type TaskEvent = Database['public']['Tables']['task_events']['Row'];

export interface ReminderEngineResult {
  processed: number;
  notified: number;
  batchSize?: number;
  cursorPosition?: string | null;
}

export interface ReminderEngineOptions {
  pageSize?: number;
}

export function shouldSendReminder(task: Task, taskEvents: TaskEvent[], now: Date): 'reminder_24h' | 'reminder_due_today' | 'overdue' | null {
  // No reminders for completed tasks
  if (task.status === 'completed') {
    return null;
  }

  const dueDate = new Date(task.due_date);
  const diffMs = dueDate.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  // Rule C — Overdue (check first)
  if (now > dueDate) {
    return 'overdue';
  }

  // Rule A — 24-hour reminder (REMINDER_24H_WINDOW_LOWER–REMINDER_24H_WINDOW_UPPER hour window)
  if (diffHours >= REMINDER_24H_WINDOW_LOWER && diffHours <= REMINDER_24H_WINDOW_UPPER) {
    const alreadySent = taskEvents.some(e => 
      e.event_type === 'reminder_sent' && 
      e.new_value === '24h' && 
      (now.getTime() - new Date(e.created_at).getTime()) < 22 * 60 * 60 * 1000
    );
    if (!alreadySent) {
      return 'reminder_24h';
    }
  }

  // Rule B — Due date morning (07:00-09:00 UTC)
  const isSameDay = now.getUTCFullYear() === dueDate.getUTCFullYear() &&
                    now.getUTCMonth() === dueDate.getUTCMonth() &&
                    now.getUTCDate() === dueDate.getUTCDate();

  const currentHourUTC = now.getUTCHours();

  if (isSameDay && currentHourUTC >= 7 && currentHourUTC <= 9) {
    const alreadySent = taskEvents.some(e => 
      e.event_type === 'reminder_sent' && 
      e.new_value === 'due_today' && 
      (now.getTime() - new Date(e.created_at).getTime()) < 12 * 60 * 60 * 1000
    );
    if (!alreadySent) {
      return 'reminder_due_today';
    }
  }

  return null;
}

export async function runReminderEngine(supabase: SupabaseClient, options?: ReminderEngineOptions): Promise<ReminderEngineResult> {
  const wallStart = Date.now();
  const startTime = new Date().toISOString();

  let processedCount = 0;
  let notifiedCount = 0;

  // TTL = 25 min — slightly shorter than the 30-min gap to the next invocation.
  const lockName = 'reminders';
  const acquired = await acquireLock(supabase, lockName, 25);
  if (!acquired) {
    console.log(JSON.stringify({ event: 'reminder_engine_skipped', reason: 'lock_held', startTime }));
    return { processed: processedCount, notified: notifiedCount };
  }

  try {
    const { lastProcessedOrgId, pageSize } = await readCursorState(supabase, lockName);
    const effectivePageSize = options?.pageSize || pageSize;

    // Fetch a page of orgs in pagination order
    let query = supabase
      .from('organizations')
      .select('id')
      .order('id', { ascending: true })
      .limit(effectivePageSize);

    if (lastProcessedOrgId) {
      query = query.gt('id', lastProcessedOrgId);
    }

    const { data: orgs, error: orgsError } = await query;

    if (orgsError) throw orgsError;

    let cursorPosition: string | null = null;
    if (orgs && orgs.length > 0) {
      cursorPosition = orgs[orgs.length - 1].id;
      
      // If fewer orgs than pageSize, we've wrapped — reset cursor
      const isWrapped = orgs.length < effectivePageSize;
      if (isWrapped) {
        cursorPosition = null;
      }
    } else {
      // No orgs in this page — wrap around
      cursorPosition = null;
    }

    console.log(JSON.stringify({
      event: 'reminder_engine_start',
      startTime,
      batchSize: orgs?.length ?? 0,
      cursorPosition: lastProcessedOrgId,
    }));

    if (orgs && orgs.length > 0) {
      const orgIds = orgs.map(o => o.id);

      // Fetch tasks for the orgs in this batch
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          *,
          campaign:campaigns(name, launch_date)
        `)
        .in('org_id', orgIds)
        .not('status', 'eq', 'completed')
        .not('due_date', 'is', null);

      if (tasksError) throw tasksError;

      // Fetch all reminder events for these tasks
      const taskIds = tasks?.map(t => t.id) || [];
      const { data: taskEvents } = await supabase
        .from('task_events')
        .select('*')
        .in('task_id', taskIds)
        .eq('event_type', 'reminder_sent')
        .order('created_at', { ascending: false });

      if (!taskEvents) throw new Error('Failed to fetch task events');

      const now = new Date();

      // Process all tasks in parallel using Promise.allSettled()
      if (tasks && tasks.length > 0) {
        const taskProcesses = (tasks as TaskWithCampaign[]).map(task => 
          processTask(supabase, task, taskEvents, now)
        );

        const results = await Promise.allSettled(taskProcesses);

        for (let i = 0; i < results.length; i++) {
          const result = results[i];
          const task = (tasks as TaskWithCampaign[])[i];

          if (result.status === 'fulfilled') {
            processedCount++;
            if (result.value.notified) {
              notifiedCount++;
            }
          } else {
            // Log rejected task process but continue with others
            console.error(JSON.stringify({
              event: 'reminder_engine_task_process_failed',
              taskId: task.id,
              reason: result.reason,
            }));
          }
        }
      }

      // Update cursor position
      await updateCursorState(supabase, lockName, cursorPosition);
    }

  } catch (error) {
    console.error(JSON.stringify({ event: 'reminder_engine_error', error }));
  } finally {
    await releaseLock(supabase, lockName);
  }

  const durationMs = Date.now() - wallStart;
  console.log(JSON.stringify({
    event: 'reminder_engine_end',
    durationMs,
    tasksProcessed: processedCount,
    notified: notifiedCount,
  }));

  return { processed: processedCount, notified: notifiedCount };
}

/**
 * Process a single task for reminder eligibility.
 * Returns an object with whether the task was notified.
 */
async function processTask(
  supabase: SupabaseClient,
  task: TaskWithCampaign,
  taskEvents: TaskEvent[],
  now: Date
): Promise<{ notified: boolean }> {
  const relevantEvents = taskEvents.filter(e => e.task_id === task.id);
  const reminderType = shouldSendReminder(task, relevantEvents, now);

  if (reminderType) {
    let message = '';
    if (reminderType === 'reminder_24h') {
      message = `Due tomorrow: ${task.title} in ${task.campaign?.name}`;
    } else if (reminderType === 'reminder_due_today') {
      message = `Due today: ${task.title} — please update your status`;
    } else if (reminderType === 'overdue') {
      const overdueHours = Math.floor(
        Math.abs((new Date(task.due_date).getTime() - now.getTime()) / (1000 * 60 * 60))
      );

      // Check if task already has risk_flag = 'hard_risk'
      if (task.risk_flag !== 'hard_risk') {
        // Update task to hard_risk
        await supabase
          .from('tasks')
          .update({ risk_flag: 'hard_risk' })
          .eq('id', task.id);

        // Log risk_flag_set event
        const { error: riskEventError } = await supabase.from('task_events').insert({
          task_id: task.id,
          org_id: task.org_id,
          actor_id: SYSTEM_ACTOR_ID,
          event_type: 'risk_flag_set',
          new_value: 'hard_risk',
        });
        if (riskEventError) {
          console.error(
            JSON.stringify({
              event: 'reminder_engine_event_insert_error',
              taskId: task.id,
              error: riskEventError,
            })
          );
        }
      }

      message = `OVERDUE: ${task.title} — overdue by ${overdueHours}h. Update your status now.`;
    }

    await createReminderNotification(supabase, task, reminderType, message);
    return { notified: true };
  }

  return { notified: false };
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
  const { error: eventError } = await supabase.from('task_events').insert({
    task_id: task.id,
    org_id: task.org_id,
    actor_id: SYSTEM_ACTOR_ID,
    event_type: 'reminder_sent',
    new_value: type,
  });
  if (eventError) {
    console.error(JSON.stringify({ event: 'reminder_engine_event_insert_error', taskId: task.id, error: eventError }));
  }

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
