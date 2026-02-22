// ─── Enums (as union types — preferred over TypeScript enums) ────────────────

export type UserRole = 'founder' | 'manager' | 'member';

export type CampaignRiskStatus = 'normal' | 'at_risk' | 'high_risk';

export type TaskStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked';

export type TaskRiskFlag = 'soft_risk' | 'hard_risk';

export type NotificationType =
  | 'reminder'
  | 'escalation_stage_1'
  | 'escalation_stage_2'
  | 'escalation_stage_3'
  | 'risk_alert'
  | 'overdue';

export type EscalationStage = 1 | 2 | 3;

// ─── Base Interfaces (match Supabase table columns exactly) ──────────────────

export interface Organization {
  id: string;
  name: string;
  created_at: string;
}

export interface User {
  id: string;
  org_id: string;
  name: string;
  email: string;
  role: UserRole;
  expo_push_token: string | null;
  created_at: string;
}

export interface Client {
  id: string;
  org_id: string;
  name: string;
  created_at: string;
}

export interface Campaign {
  id: string;
  org_id: string;
  client_id: string;
  name: string;
  launch_date: string;
  risk_status: CampaignRiskStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  campaign_id: string;
  org_id: string;
  title: string;
  owner_id: string;
  due_date: string;
  dependency_id: string | null;
  status: TaskStatus;
  risk_flag: TaskRiskFlag | null;
  assigned_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskEvent {
  id: string;
  task_id: string;
  org_id: string;
  actor_id: string;
  event_type: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  org_id: string;
  user_id: string;
  task_id: string | null;
  campaign_id: string | null;
  type: NotificationType;
  message: string;
  read: boolean;
  delivered_push: boolean;
  created_at: string;
}

// ─── Joined / Extended Types ─────────────────────────────────────────────────

export type CampaignWithClient = Campaign & {
  client: Client;
};

export type CampaignWithStats = CampaignWithClient & {
  total_tasks: number;
  overdue_count: number;
  blocked_count: number;
};

export type TaskWithOwner = Task & {
  owner: User;
};

export type TaskWithDependency = TaskWithOwner & {
  dependency: Task | null;
};

// ─── Error Codes ──────────────────────────────────────────────────────────────

export { ErrorCode } from './errors';
