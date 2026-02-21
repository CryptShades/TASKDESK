import { createClient } from '@/lib/supabase/client';
import type { Database } from '../../supabase/types';

type CampaignRisk = Database['public']['Enums']['campaign_risk'];

export interface DashboardStats {
  totalClients: number;
  totalCampaigns: number;
  activeTasks: number;
  completedTasks: number;
  highRiskTasks: number;
  overdueTasks: number;
  recentTasks: Array<{
    id: string;
    title: string;
    status: string;
    risk_level: string;
    due_date: string;
    campaign_name: string;
  }>;
}

export class DashboardError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'DashboardError';
  }
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new DashboardError('NOT_AUTHENTICATED', 'User not authenticated');
  }

  // Get user's organization
  const { data: userData } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single();

  if (!userData?.org_id) {
    throw new DashboardError('NO_ORG', 'User has no organization');
  }

  const orgId = userData.org_id;

  // Get all stats in parallel
  const [
    { count: totalClients },
    { count: totalCampaigns },
    { count: activeTasks },
    { count: completedTasks },
    { count: highRiskTasks },
    { count: overdueTasks },
    { data: recentTasks },
  ] = await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('org_id', orgId),
    supabase.from('campaigns').select('*', { count: 'exact', head: true }).eq('org_id', orgId),
    supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('org_id', orgId).neq('status', 'completed'),
    supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('org_id', orgId).eq('status', 'completed'),
    supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('org_id', orgId).eq('risk_level', 'high'),
    supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('org_id', orgId).lt('due_date', new Date().toISOString()).neq('status', 'completed'),
    supabase
      .from('tasks')
      .select(`
        id,
        title,
        status,
        risk_level,
        due_date,
        campaigns!inner(name)
      `)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  return {
    totalClients: totalClients || 0,
    totalCampaigns: totalCampaigns || 0,
    activeTasks: activeTasks || 0,
    completedTasks: completedTasks || 0,
    highRiskTasks: highRiskTasks || 0,
    overdueTasks: overdueTasks || 0,
    recentTasks: recentTasks?.map(task => ({
      id: task.id,
      title: task.title,
      status: task.status,
      risk_level: task.risk_level,
      due_date: task.due_date,
      campaign_name: (task.campaigns as any)?.name || 'Unknown Campaign',
    })) || [],
  };
}