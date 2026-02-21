import { createClient } from '@/lib/supabase/server';

export interface EscalationEvent {
  id: string;
  task_id: string;
  org_id: string;
  actor_id: string;
  event_type: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
  task: {
    id: string;
    title: string;
    status: string;
    due_date: string;
    risk_flag: string | null;
    owner: { id: string; name: string };
  };
  campaign: {
    id: string;
    name: string;
    risk_status: string;
    launch_date: string;
  };
}

export class EscalationError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'EscalationError';
  }
}

export async function getEscalations(orgId: string, stage?: string): Promise<EscalationEvent[]> {
  const supabase = createClient();

  let query = supabase
    .from('task_events')
    .select(`
      *,
      task:tasks(
        id,
        title,
        status,
        due_date,
        risk_flag,
        owner:users(id, name)
      ),
      campaign:campaigns(
        id,
        name,
        risk_status,
        launch_date
      )
    `)
    .eq('org_id', orgId)
    .in('event_type', ['escalation_stage_1', 'escalation_stage_2', 'escalation_stage_3'])
    .order('created_at', { ascending: false })
    .limit(50);

  if (stage) {
    query = query.eq('event_type', `escalation_stage_${stage}`);
  }

  const { data: escalations, error } = await query;

  if (error) {
    throw new EscalationError('ESCALATIONS_FETCH_FAILED', 'Failed to fetch escalations');
  }

  return escalations;
}

export async function getEscalationsByTask(taskId: string): Promise<EscalationEvent[]> {
  const supabase = createClient();

  const { data: escalations, error } = await supabase
    .from('task_events')
    .select(`
      *,
      task:tasks(
        id,
        title,
        status,
        owner:users(id, name)
      ),
      campaign:campaigns(id, name)
    `)
    .eq('task_id', taskId)
    .in('event_type', ['escalation_stage_1', 'escalation_stage_2', 'escalation_stage_3'])
    .order('created_at', { ascending: false });

  if (error) {
    throw new EscalationError('ESCALATIONS_FETCH_FAILED', 'Failed to fetch task escalations');
  }

  return escalations;
}