import { createClient } from '@/lib/supabase/server';
import { unstable_cache } from 'next/cache';
import type { Database } from '../../../supabase/types';
import { ErrorCode } from '@taskdesk/types';

type CampaignRisk = Database['public']['Enums']['campaign_risk'];

export interface FounderDashboardData {
  metrics: {
    active_count: number;
    at_risk_count: number;
    high_risk_count: number;
    stalled_tasks_count: number;
  };
  campaigns: Array<{
    id: string;
    name: string;
    risk_status: CampaignRisk;
    client: { id: string; name: string };
    launch_date: string;
    task_counts: {
      total: number;
      overdue: number;
      blocked: number;
    };
  }>;
  dependency_alerts: Array<{
    id: string;
    title: string;
    campaign: { id: string; name: string };
    dependency_gap_hours: number;
  }>;
}

export interface DependencyAlert {
  id: string;
  title: string;
  campaign: { id: string; name: string };
  dependency: { id: string; title: string; completed_at: string };
  dependency_gap_hours: number;
}

export class DashboardError extends Error {
  constructor(public code: ErrorCode, message: string) {
    super(message);
    this.name = 'DashboardError';
  }
}

async function _getFounderDashboard(orgId: string): Promise<FounderDashboardData> {
  // Get metrics in one query
  const metrics = await getDashboardMetrics(orgId);

  // Get campaigns with task counts
  const campaigns = await getCampaignsWithTaskCounts(orgId);

  // Get dependency alerts
  const dependencyAlerts = await getDependencyAlerts(orgId);

  return {
    metrics,
    campaigns,
    dependency_alerts: dependencyAlerts,
  };
}

/**
 * Cached founder dashboard — 5-minute TTL keyed per org.
 * Tag `dashboard-${orgId}` allows on-demand invalidation when risk changes.
 * A founder refreshing the page 10× in one hour pays for 1 aggregate query,
 * not 10.
 */
export async function getFounderDashboard(orgId: string): Promise<FounderDashboardData> {
  return unstable_cache(
    _getFounderDashboard,
    ['dashboard-stats', orgId],
    { revalidate: 300, tags: [`dashboard-${orgId}`] },
  )(orgId);
}

async function getDashboardMetrics(orgId: string) {
  const supabase = createClient();

  // Campaign risk counts
  const { data: campaigns, error: campaignsError } = await supabase
    .from('campaigns')
    .select('risk_status')
    .eq('org_id', orgId)
    .limit(100); // A founder with 100+ active campaigns has bigger problems

  if (campaignsError) {
    throw new DashboardError(ErrorCode.METRICS_FETCH_FAILED, 'Failed to fetch dashboard metrics');
  }

  const riskCounts = campaigns.reduce(
    (acc, campaign) => {
      if (campaign.risk_status === 'normal') acc.active_count++;
      else if (campaign.risk_status === 'at_risk') acc.at_risk_count++;
      else if (campaign.risk_status === 'high_risk') acc.high_risk_count++;
      return acc;
    },
    { active_count: 0, at_risk_count: 0, high_risk_count: 0 }
  );

  // Stalled tasks count (blocked or overdue)
  const { count: stalledCount, error: stalledError } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .or('status.eq.blocked,and(due_date.lt.' + new Date().toISOString() + ',status.neq.completed)');

  if (stalledError) {
    throw new DashboardError(ErrorCode.METRICS_FETCH_FAILED, 'Failed to fetch stalled tasks count');
  }

  return {
    ...riskCounts,
    stalled_tasks_count: stalledCount || 0,
  };
}

async function getCampaignsWithTaskCounts(orgId: string) {
  const supabase = createClient();

  // Get campaigns with client info
  const { data: campaigns, error: campaignsError } = await supabase
    .from('campaigns')
    .select(`
      id,
      name,
      risk_status,
      launch_date,
      client:clients(id, name)
    `)
    .eq('org_id', orgId)
    .order('launch_date', { ascending: true })
    .limit(100); // A founder with 100+ active campaigns has bigger problems

  if (campaignsError) {
    throw new DashboardError(ErrorCode.CAMPAIGNS_FETCH_FAILED, 'Failed to fetch campaigns');
  }

  // Get task counts for all campaigns
  const campaignIds = campaigns.map(c => c.id);
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('campaign_id, status, due_date')
    .in('campaign_id', campaignIds)
    .limit(200); // 200 tasks per campaign ceiling; orgs at this scale use the full API

  if (tasksError) {
    throw new DashboardError(ErrorCode.TASKS_FETCH_FAILED, 'Failed to fetch task counts');
  }

  // Calculate task counts per campaign
  const taskCountsByCampaign = tasks.reduce((acc, task) => {
    if (!acc[task.campaign_id]) {
      acc[task.campaign_id] = { total: 0, overdue: 0, blocked: 0 };
    }
    acc[task.campaign_id].total++;
    if (task.status === 'blocked') {
      acc[task.campaign_id].blocked++;
    }
    if (new Date(task.due_date) < new Date() && task.status !== 'completed') {
      acc[task.campaign_id].overdue++;
    }
    return acc;
  }, {} as Record<string, { total: number; overdue: number; blocked: number }>);

  return (campaigns as any[]).map(campaign => ({
    ...campaign,
    task_counts: taskCountsByCampaign[campaign.id] || { total: 0, overdue: 0, blocked: 0 },
  }));
}

export async function getDependencyAlerts(orgId: string): Promise<DependencyAlert[]> {
  const supabase = createClient();

  // Find tasks with dependencies that have been completed more than 12 hours ago
  // but the dependent task is still not started
  const { data: alerts, error } = await supabase
    .rpc('get_dependency_alerts', {
      p_org_id: orgId,
      p_gap_hours: 12
    })
    .limit(8); // Dashboard alert feed shows at most 8 entries per design spec

  if (error) {
    // Fallback to manual query if RPC doesn't exist
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select(`
        id,
        title,
        status,
        created_at,
        campaign:campaigns(id, name),
        dependency:tasks!dependency_id(
          id,
          title,
          status,
          updated_at
        )
      `)
      .eq('org_id', orgId)
      .eq('status', 'not_started')
      .not('dependency_id', 'is', null)
      .limit(8); // Dashboard alert feed shows at most 8 entries per design spec

    if (tasksError) {
      throw new DashboardError(ErrorCode.ALERTS_FETCH_FAILED, 'Failed to fetch dependency alerts');
    }

    const alerts = (tasks as any[])
      .filter(task => {
        if (!task.dependency || task.dependency.status !== 'completed') return false;

        const dependencyCompletedAt = new Date(task.dependency.updated_at);
        const now = new Date();
        const gapHours = (now.getTime() - dependencyCompletedAt.getTime()) / (1000 * 60 * 60);

        return gapHours > 12;
      })
      .map(task => ({
        id: task.id,
        title: task.title,
        campaign: task.campaign,
        dependency: {
          id: task.dependency.id,
          title: task.dependency.title,
          completed_at: task.dependency.updated_at,
        },
        dependency_gap_hours: Math.round(
          (new Date().getTime() - new Date(task.dependency.updated_at).getTime()) / (1000 * 60 * 60)
        ),
      }));

    return alerts;
  }

  return alerts || [];
}