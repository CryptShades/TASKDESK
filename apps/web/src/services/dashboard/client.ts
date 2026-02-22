import { createClient } from '@/lib/supabase/client';
import type { Database } from '../../../supabase/types';
import { ErrorCode } from '@taskdesk/types';

// ─── Schema reference (prevents future field name drift) ──────────────────────
//
// Table: campaigns
//   Columns: id, org_id, client_id, name, launch_date, created_by, created_at, updated_at
//   Column:  risk_status  →  campaign_risk enum: 'normal' | 'at_risk' | 'high_risk'
//   NOTE: campaigns has NO 'status' column. Use risk_status to classify campaign health.
//
// Table: tasks
//   Columns: id, campaign_id, org_id, title, owner_id, due_date, dependency_id,
//            assigned_at, created_at, updated_at
//   Column:  status    →  task_status enum: 'not_started' | 'in_progress' | 'completed' | 'blocked'
//   Column:  risk_flag →  task_risk_flag enum: 'soft_risk' | 'hard_risk'  (nullable)
//   NOTE: tasks has NO 'risk_level' column. The correct column is risk_flag.
//
// ─────────────────────────────────────────────────────────────────────────────

type CampaignRisk = Database['public']['Enums']['campaign_risk'];
type TaskRiskFlag = Database['public']['Enums']['task_risk_flag'];

export interface DashboardStats {
  // Campaign counts
  totalCampaigns: number;       // campaigns table: all rows for org
  activeCampaigns: number;      // campaigns table: risk_status = 'normal'
  atRiskCampaigns: number;      // campaigns table: risk_status = 'at_risk'
  highRiskCampaigns: number;    // campaigns table: risk_status = 'high_risk'

  // Task counts
  totalClients: number;         // clients table: all rows for org
  activeTasks: number;          // tasks table: status != 'completed'
  completedTasks: number;       // tasks table: status = 'completed'
  highRiskTasks: number;        // tasks table: risk_flag = 'hard_risk'
  stalledTasks: number;         // tasks table: status != 'completed' AND updated_at < now-24h
  overdueTasks: number;         // tasks table: due_date < now AND status != 'completed'

  // Recent task feed
  recentTasks: Array<{
    id: string;
    title: string;
    status: string;
    risk_flag: TaskRiskFlag | null;   // tasks.risk_flag — NOT risk_level
    due_date: string;
    campaign_name: string;
  }>;
}

export class DashboardError extends Error {
  constructor(public code: ErrorCode, message: string) {
    super(message);
    this.name = 'DashboardError';
  }
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new DashboardError(ErrorCode.NOT_AUTHENTICATED, 'User not authenticated');
  }

  // Get user's organization
  // Table: users  Column: org_id
  const { data: userData } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single();

  if (!userData?.org_id) {
    throw new DashboardError(ErrorCode.NO_ORG, 'User has no organization');
  }

  const orgId = userData.org_id;

  // Cutoff timestamp for stalled task detection (24 hours ago)
  const stalledCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Run all stat queries in parallel
  const [
    { count: totalClients },
    { count: totalCampaigns },
    { count: activeCampaigns },       // campaigns.risk_status = 'normal'
    { count: atRiskCampaigns },       // campaigns.risk_status = 'at_risk'
    { count: highRiskCampaigns },     // campaigns.risk_status = 'high_risk'
    { count: activeTasks },
    { count: completedTasks },
    { count: highRiskTasks },         // tasks.risk_flag = 'hard_risk'
    { count: stalledTasks },          // tasks.status != 'completed' AND updated_at < stalledCutoff
    { count: overdueTasks },          // tasks.due_date < now AND tasks.status != 'completed'
    { data: recentTasks },
  ] = await Promise.all([
    // clients table — org_id filter
    supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId),

    // campaigns table — total count for org
    supabase
      .from('campaigns')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId),

    // campaigns table — risk_status = 'normal' (healthy / on-track campaigns)
    supabase
      .from('campaigns')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('risk_status', 'normal' satisfies CampaignRisk),

    // campaigns table — risk_status = 'at_risk'
    supabase
      .from('campaigns')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('risk_status', 'at_risk' satisfies CampaignRisk),

    // campaigns table — risk_status = 'high_risk'
    supabase
      .from('campaigns')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('risk_status', 'high_risk' satisfies CampaignRisk),

    // tasks table — active (not yet completed)
    supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .neq('status', 'completed'),

    // tasks table — completed
    supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('status', 'completed'),

    // tasks table — risk_flag = 'hard_risk'
    // PREVIOUSLY BROKEN: was .eq('risk_level', 'high') — column does not exist
    // FIXED: tasks column is risk_flag, hard risk value is 'hard_risk'
    supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('risk_flag', 'hard_risk' satisfies TaskRiskFlag),

    // tasks table — stalled: incomplete tasks with no activity in last 24 hours
    // Filter: status != 'completed' AND updated_at < (now - 24h)
    supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .neq('status', 'completed')
      .lt('updated_at', stalledCutoff),

    // tasks table — overdue: past due date and not completed
    // Filter: due_date < now AND status != 'completed'
    supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .lt('due_date', new Date().toISOString())
      .neq('status', 'completed'),

    // tasks table — recent activity feed, joined to campaigns for name
    // Select: id, title, status, risk_flag, due_date  (NOT risk_level — that column does not exist)
    // Join: campaigns!inner(name)
    supabase
      .from('tasks')
      .select(`
        id,
        title,
        status,
        risk_flag,
        due_date,
        campaigns!inner(name)
      `)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  return {
    totalClients: totalClients ?? 0,
    totalCampaigns: totalCampaigns ?? 0,
    activeCampaigns: activeCampaigns ?? 0,
    atRiskCampaigns: atRiskCampaigns ?? 0,
    highRiskCampaigns: highRiskCampaigns ?? 0,
    activeTasks: activeTasks ?? 0,
    completedTasks: completedTasks ?? 0,
    highRiskTasks: highRiskTasks ?? 0,
    stalledTasks: stalledTasks ?? 0,
    overdueTasks: overdueTasks ?? 0,
    recentTasks: recentTasks?.map(task => ({
      id: task.id,
      title: task.title,
      status: task.status,
      risk_flag: task.risk_flag,                                    // tasks.risk_flag (was: risk_level — incorrect)
      due_date: task.due_date,
      campaign_name: (task.campaigns as any)?.name ?? 'Unknown Campaign',
    })) ?? [],
  };
}
