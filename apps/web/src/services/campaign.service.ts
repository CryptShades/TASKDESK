import { createClient } from '@/lib/supabase/server';
import type { Database } from '../../supabase/types';
import { ErrorCode } from '@taskdesk/types';

type CampaignRisk = Database['public']['Enums']['campaign_risk'];

export interface CreateCampaignData {
  client_id: string;
  name: string;
  launch_date: string;
}

export interface UpdateCampaignData {
  client_id?: string;
  name?: string;
  launch_date?: string;
  risk_status?: CampaignRisk;
}

export interface CampaignWithStats {
  id: string;
  org_id: string;
  client_id: string;
  name: string;
  launch_date: string;
  risk_status: CampaignRisk;
  created_by: string;
  created_at: string;
  updated_at: string;
  client: {
    id: string;
    name: string;
  };
  task_stats: {
    total: number;
    overdue: number;
    blocked: number;
  };
}

export interface DashboardStats {
  active_count: number;
  at_risk_count: number;
  high_risk_count: number;
  stalled_tasks_count: number;
}

export class CampaignError extends Error {
  constructor(public code: ErrorCode, message: string) {
    super(message);
    this.name = 'CampaignError';
  }
}

export async function getCampaigns(orgId: string): Promise<CampaignWithStats[]> {
  const supabase = createClient();

  // Get campaigns with client join
  const { data: campaigns, error: campaignsError } = await supabase
    .from('campaigns')
    .select(`
      *,
      client:clients(id, name)
    `)
    .eq('org_id', orgId)
    .order('launch_date', { ascending: true });

  if (campaignsError) {
    throw new CampaignError(ErrorCode.CAMPAIGNS_FETCH_FAILED, 'Failed to fetch campaigns');
  }

  // Get task stats for each campaign
  const campaignIds = campaigns.map(c => c.id);
  const { data: taskStats, error: statsError } = await supabase
    .from('tasks')
    .select(`
      campaign_id,
      status,
      due_date
    `)
    .in('campaign_id', campaignIds);

  if (statsError) {
    throw new CampaignError(ErrorCode.STATS_FETCH_FAILED, 'Failed to fetch task statistics');
  }

  // Calculate stats per campaign
  const statsByCampaign = taskStats.reduce((acc, task) => {
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

  return campaigns.map(campaign => ({
    ...campaign,
    task_stats: statsByCampaign[campaign.id] || { total: 0, overdue: 0, blocked: 0 },
  }));
}

export async function getCampaignById(id: string, orgId: string) {
  const supabase = createClient();

  const { data: campaign, error } = await supabase
    .from('campaigns')
    .select(`
      *,
      client:clients(id, name),
      tasks(*, owner:users(id, name))
    `)
    .eq('id', id)
    .eq('org_id', orgId)
    .single();

  if (error) {
    throw new CampaignError(ErrorCode.CAMPAIGN_NOT_FOUND, 'Campaign not found');
  }

  return campaign;
}

export async function createCampaign(data: CreateCampaignData, orgId: string, actorId: string) {
  const supabase = createClient();

  // Validate launch_date is in the future
  if (new Date(data.launch_date) <= new Date()) {
    throw new CampaignError(ErrorCode.INVALID_LAUNCH_DATE, 'Launch date must be in the future');
  }

  const { data: campaign, error } = await supabase
    .from('campaigns')
    .insert({
      ...data,
      org_id: orgId,
      created_by: actorId,
    })
    .select()
    .single();

  if (error) {
    throw new CampaignError(ErrorCode.CAMPAIGN_CREATE_FAILED, 'Failed to create campaign');
  }

  return campaign;
}

export async function updateCampaign(id: string, data: UpdateCampaignData, orgId: string, actorId: string) {
  const supabase = createClient();

  // Validate launch_date if provided
  if (data.launch_date && new Date(data.launch_date) <= new Date()) {
    throw new CampaignError(ErrorCode.INVALID_LAUNCH_DATE, 'Launch date must be in the future');
  }

  const { data: campaign, error } = await supabase
    .from('campaigns')
    .update(data)
    .eq('id', id)
    .eq('org_id', orgId)
    .select()
    .single();

  if (error) {
    throw new CampaignError(ErrorCode.CAMPAIGN_UPDATE_FAILED, 'Failed to update campaign');
  }

  return campaign;
}

export async function deleteCampaign(id: string, orgId: string, actorId: string) {
  const supabase = createClient();

  // Verify actor is founder
  const { data: actor } = await supabase
    .from('users')
    .select('role')
    .eq('id', actorId)
    .single();

  if (!actor || actor.role !== 'founder') {
    throw new CampaignError(ErrorCode.INSUFFICIENT_PERMISSIONS, 'Only founders can delete campaigns');
  }

  const { error } = await supabase
    .from('campaigns')
    .delete()
    .eq('id', id)
    .eq('org_id', orgId);

  if (error) {
    throw new CampaignError(ErrorCode.CAMPAIGN_DELETE_FAILED, 'Failed to delete campaign');
  }

  return { success: true };
}

export async function getDashboardStats(orgId: string): Promise<DashboardStats> {
  const supabase = createClient();

  // Get campaign risk counts
  const { data: campaigns, error: campaignsError } = await supabase
    .from('campaigns')
    .select('risk_status')
    .eq('org_id', orgId);

  if (campaignsError) {
    throw new CampaignError(ErrorCode.STATS_FETCH_FAILED, 'Failed to fetch dashboard statistics');
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

  // Get stalled tasks count (blocked or overdue)
  const { count: stalledCount, error: stalledError } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .or('status.eq.blocked,and(due_date.lt.' + new Date().toISOString() + ',status.neq.completed)');

  if (stalledError) {
    throw new CampaignError(ErrorCode.STATS_FETCH_FAILED, 'Failed to fetch stalled tasks count');
  }

  return {
    ...riskCounts,
    stalled_tasks_count: stalledCount || 0,
  };
}