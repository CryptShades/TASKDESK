import { createClient } from '@/lib/supabase/server';
import { revalidateTag } from 'next/cache';
import type { Database } from '../../supabase/types';
import { createNotification } from './notification.service';
import { runRiskEngine } from '@/workers/risk-engine';
import { ErrorCode } from '@taskdesk/types';

type TaskStatus = Database['public']['Enums']['task_status'];
type TaskRiskFlag = Database['public']['Enums']['task_risk_flag'];

export interface CreateTaskData {
  title: string;
  owner_id: string;
  due_date: string;
  dependency_id?: string;
  risk_flag?: TaskRiskFlag;
}

export interface UpdateTaskData {
  title?: string;
  due_date?: string;
  risk_flag?: TaskRiskFlag;
}

export class TaskError extends Error {
  constructor(public code: ErrorCode, message: string) {
    super(message);
    this.name = 'TaskError';
  }
}

// Status transition validation
const ALLOWED_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  not_started: ['in_progress'],
  in_progress: ['completed', 'blocked'],
  completed: [], // Terminal state
  blocked: ['in_progress'], // Can be unblocked
};

export async function getTasksByCampaign(campaignId: string, orgId: string) {
  const supabase = createClient();

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select(`
      *,
      owner:users(id, name),
      dependency:tasks(id, title, status)
    `)
    .eq('campaign_id', campaignId)
    .eq('org_id', orgId)
    .order('due_date', { ascending: true })
    .limit(200); // 200 tasks per campaign ceiling; orgs at this scale use the full API

  if (error) {
    throw new TaskError(ErrorCode.TASKS_FETCH_FAILED, 'Failed to fetch tasks');
  }

  return tasks;
}

export async function getTaskById(taskId: string, orgId: string) {
  const supabase = createClient();

  const { data: task, error } = await supabase
    .from('tasks')
    .select(`
      *,
      owner:users(id, name, email),
      campaign:campaigns(id, name),
      dependency:tasks(id, title, status, due_date, updated_at),
      task_events(
        *,
        actor:users(id, name)
      )
    `)
    .eq('id', taskId)
    .eq('org_id', orgId)
    .order('created_at', { ascending: false, referencedTable: 'task_events' })
    .limit(100, { referencedTable: 'task_events' }) // Newest 100 events cover any realistic audit view
    .single();

  if (error) {
    throw new TaskError(ErrorCode.TASK_NOT_FOUND, 'Task not found');
  }

  return task;
}

export async function getMyTasks(userId: string, orgId: string) {
  const supabase = createClient();

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select(`
      *,
      campaign:campaigns(id, name, client:clients(id, name)),
      dependency:tasks(id, title, status)
    `)
    .eq('owner_id', userId)
    .eq('org_id', orgId)
    .order('due_date', { ascending: true })
    .limit(200); // 200 active tasks per user is a practical ceiling

  if (error) {
    throw new TaskError(ErrorCode.TASKS_FETCH_FAILED, 'Failed to fetch your tasks');
  }

  return tasks;
}

export async function createTask(data: CreateTaskData, campaignId: string, orgId: string, actorId: string) {
  const supabase = createClient();

  // Validate dependency exists and is in same campaign if provided
  if (data.dependency_id) {
    const { data: dependency } = await supabase
      .from('tasks')
      .select('campaign_id')
      .eq('id', data.dependency_id)
      .single();

    if (!dependency || dependency.campaign_id !== campaignId) {
      throw new TaskError(ErrorCode.INVALID_DEPENDENCY, 'Dependency task must exist in the same campaign');
    }
  }

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      ...data,
      campaign_id: campaignId,
      org_id: orgId,
    })
    .select()
    .single();

  if (error) {
    throw new TaskError(ErrorCode.TASK_CREATE_FAILED, 'Failed to create task');
  }

  // Log task creation event
  await supabase.from('task_events').insert({
    task_id: task.id,
    org_id: orgId,
    actor_id: actorId,
    event_type: 'task_created',
    new_value: task.title,
  });

  // Create notification for task owner
  await createNotification({
    org_id: orgId,
    user_id: data.owner_id,
    task_id: task.id,
    type: 'task_assigned',
    message: `You have been assigned a new task: ${task.title}`,
  });

  return task;
}

export async function updateTaskStatus(taskId: string, newStatus: TaskStatus, actorId: string, orgId: string) {
  const supabase = createClient();

  // Get current task
  const { data: task, error: fetchError } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .eq('org_id', orgId)
    .single();

  if (fetchError || !task) {
    throw new TaskError(ErrorCode.TASK_NOT_FOUND, 'Task not found');
  }

  // Validate actor is task owner
  if (task.owner_id !== actorId) {
    throw new TaskError(ErrorCode.INSUFFICIENT_PERMISSIONS, 'Only task owners can update task status');
  }

  // Validate status transition
  const currentStatus = task.status as TaskStatus;
  const allowedNextStatuses = ALLOWED_TRANSITIONS[currentStatus];
  if (!allowedNextStatuses.includes(newStatus)) {
    throw new TaskError(ErrorCode.INVALID_TRANSITION, `Cannot change status from ${task.status} to ${newStatus}`);
  }

  // If moving to in_progress and has dependency, check dependency is completed
  if (newStatus === 'in_progress' && task.dependency_id) {
    const { data: dependency } = await supabase
      .from('tasks')
      .select('status')
      .eq('id', task.dependency_id)
      .single();

    if (!dependency || dependency.status !== 'completed') {
      throw new TaskError(ErrorCode.DEPENDENCY_NOT_MET, 'Cannot start task until dependency is completed');
    }
  }

  // Update task
  const { data: updatedTask, error: updateError } = await supabase
    .from('tasks')
    .update({ status: newStatus })
    .eq('id', taskId)
    .select()
    .single();

  if (updateError) {
    throw new TaskError(ErrorCode.TASK_UPDATE_FAILED, 'Failed to update task status');
  }

  // Log status change event
  await supabase.from('task_events').insert({
    task_id: taskId,
    org_id: orgId,
    actor_id: actorId,
    event_type: 'status_changed',
    old_value: task.status,
    new_value: newStatus,
  });

  // Bust the dashboard cache for this org — stalled-task count and risk metrics
  // just changed. Fires synchronously before the response so the next page load
  // gets fresh data even if the risk engine hasn't re-scored campaigns yet.
  revalidateTag(`dashboard-${orgId}`);

  // Trigger risk engine fire-and-forget (event-triggered mode)
  runRiskEngine(supabase, { orgId }).catch(err =>
    console.error('Event-triggered Risk Engine failed:', err)
  );

  return updatedTask;
}

export async function updateTask(taskId: string, data: UpdateTaskData, orgId: string, actorId: string) {
  const supabase = createClient();

  // Verify actor has permission (owner, manager, or founder)
  const { data: actor } = await supabase
    .from('users')
    .select('role')
    .eq('id', actorId)
    .single();

  const { data: task } = await supabase
    .from('tasks')
    .select('owner_id')
    .eq('id', taskId)
    .eq('org_id', orgId)
    .single();

  if (!task) {
    throw new TaskError(ErrorCode.TASK_NOT_FOUND, 'Task not found');
  }

  const isOwner = task.owner_id === actorId;
  const isManagerOrFounder = actor && ['manager', 'founder'].includes(actor.role);

  if (!isOwner && !isManagerOrFounder) {
    throw new TaskError(ErrorCode.INSUFFICIENT_PERMISSIONS, 'Only task owners, managers, or founders can update tasks');
  }

  const { data: updatedTask, error } = await supabase
    .from('tasks')
    .update(data)
    .eq('id', taskId)
    .eq('org_id', orgId)
    .select()
    .single();

  if (error) {
    throw new TaskError(ErrorCode.TASK_UPDATE_FAILED, 'Failed to update task');
  }

  return updatedTask;
}

export async function deleteTask(taskId: string, orgId: string, actorId: string) {
  const supabase = createClient();

  // Verify actor has permission (manager or founder)
  const { data: actor } = await supabase
    .from('users')
    .select('role')
    .eq('id', actorId)
    .single();

  if (!actor || !['manager', 'founder'].includes(actor.role)) {
    throw new TaskError(ErrorCode.INSUFFICIENT_PERMISSIONS, 'Only managers and founders can delete tasks');
  }

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .eq('org_id', orgId);

  if (error) {
    throw new TaskError(ErrorCode.TASK_DELETE_FAILED, 'Failed to delete task');
  }

  return { success: true };
}
