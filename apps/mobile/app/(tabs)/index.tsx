import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { theme } from '../../src/theme';
import { useUserStore } from '../../src/store';
import { api } from '../../src/lib/api';
import { CampaignCard } from '../../src/components/CampaignCard';
import { CheckCircle2 } from 'lucide-react-native';
import { RiskBadge } from '../../src/components/RiskBadge';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { ErrorState } from '../../src/components/ErrorState';
import { EmptyState } from '../../src/components/EmptyState';

export default function DashboardScreen() {
  const { user } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const isFounderOrManager = user?.role === 'founder' || user?.role === 'manager';

  const fetchData = useCallback(async () => {
    setError(null);
    const endpoint = isFounderOrManager ? '/api/dashboard' : '/api/tasks/mine';
    const { data: result, error: apiError } = await api.get<any>(endpoint);
    
    if (apiError) {
      setError(apiError);
    } else if (result) {
      setData(result);
    }
    setLoading(false);
    setRefreshing(false);
  }, [isFounderOrManager]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  };

  const formatDate = () => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  };

  if (loading && !refreshing) return <LoadingScreen />;
  if (error && !refreshing) return <ErrorState message={error} onRetry={fetchData} />;

  const getRiskVariant = (status: string) => {
    switch (status) {
      case 'high_risk': return 'hard';
      case 'at_risk': return 'soft';
      case 'normal': return 'normal';
      case 'blocked': return 'blocked';
      default: return 'normal';
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Good {getTimeGreeting()}, {user?.name?.split(' ')[0] || 'there'}
        </Text>
        <Text style={styles.date}>{formatDate()}</Text>
      </View>

      {isFounderOrManager ? (
        <FounderDashboard data={data} getRiskVariant={getRiskVariant} />
      ) : (
        <MemberDashboard data={data} getRiskVariant={getRiskVariant} />
      )}
    </ScrollView>
  );
}

function FounderDashboard({ data, getRiskVariant }: { data: any, getRiskVariant: (s: string) => any }) {
  if (!data) return <EmptyState message="No data available." />;

  const { metrics, campaigns } = data;
  const highRiskCampaigns = campaigns?.filter((c: any) => c.risk_status === 'high_risk') || [];

  return (
    <>
      <View style={styles.grid}>
        <MetricCard
          label="HIGH RISK"
          value={metrics?.high_risk_count || 0}
          color={theme.colors.riskHard}
          isUrgent={metrics?.high_risk_count > 0}
        />
        <MetricCard
          label="AT RISK"
          value={metrics?.at_risk_count || 0}
          color={theme.colors.riskSoft}
          isUrgent={metrics?.at_risk_count > 0}
        />
        <MetricCard
          label="ON TRACK"
          value={metrics?.active_count || 0}
          color={theme.colors.riskNormal}
        />
        <MetricCard
          label="STALLED"
          value={metrics?.stalled_tasks_count || 0}
          color={theme.colors.riskSoft}
        />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>HIGH RISK CAMPAIGNS</Text>
      </View>

      {highRiskCampaigns.length > 0 ? (
        <>
          {highRiskCampaigns.slice(0, 3).map((campaign: any) => (
            <CampaignCard
              key={campaign.id}
              id={campaign.id}
              name={campaign.name}
              clientName={campaign.client?.name || 'Unknown Client'}
              riskStatus={campaign.risk_status}
              launchDate={campaign.launch_date}
              overdueCount={campaign.task_counts?.overdue || 0}
              blockedCount={campaign.task_counts?.blocked || 0}
            />
          ))}
          {highRiskCampaigns.length > 3 && (
            <TouchableOpacity style={styles.viewMoreButton}>
              <Text style={styles.viewMoreText}>View {highRiskCampaigns.length - 3} more</Text>
            </TouchableOpacity>
          )}
        </>
      ) : (
        <View style={styles.emptyCard}>
          <CheckCircle2 color={theme.colors.riskNormal} size={24} />
          <Text style={styles.emptyText}>All campaigns on track</Text>
        </View>
      )}

      <TouchableOpacity style={styles.viewAllFooter}>
        <Text style={styles.viewAllText}>[View All Campaigns →]</Text>
      </TouchableOpacity>
    </>
  );
}

function MetricCard({ label, value, color, isUrgent }: any) {
  return (
    <View style={[styles.metricCard, { borderTopColor: color }]}>
      <Text style={[styles.metricValue, isUrgent && { color }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function MemberDashboard({ data, getRiskVariant }: { data: any[], getRiskVariant: (s: string) => any }) {
  if (!data || data.length === 0) return <EmptyState message="No tasks assigned to you." />;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const next7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  const tasksToday = data.filter(t => {
    const due = new Date(t.due_date);
    return due <= today && t.status !== 'completed';
  });

  const upcomingTasks = data.filter(t => {
    const due = new Date(t.due_date);
    return due > today && due <= next7Days && t.status !== 'completed';
  });

  return (
    <>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>YOUR TASKS TODAY</Text>
      </View>

      {tasksToday.length > 0 ? (
        tasksToday.map(task => (
          <View key={task.id} style={styles.taskCard}>
            <View style={styles.taskCardTop}>
              <Text style={styles.taskName}>{task.title}</Text>
              <RiskBadge variant={getRiskVariant(task.risk_flag || 'normal')} />
            </View>
            <Text style={styles.campaignName}>{task.campaign?.name}</Text>
            <div style={styles.taskCardBottom as any}>
              <Text style={styles.dueInfo}>Due {new Date(task.due_date).toLocaleDateString()}</Text>
              <TouchableOpacity style={styles.updateButton}>
                <Text style={styles.updateButtonText}>Update →</Text>
              </TouchableOpacity>
            </div>
          </View>
        ))
      ) : (
        <View style={styles.emptyCard}>
          <CheckCircle2 color={theme.colors.riskNormal} size={24} />
          <Text style={styles.emptyText}>No tasks due today</Text>
        </View>
      )}

      <View style={[styles.sectionHeader, { marginTop: theme.spacing.xl }]}>
        <Text style={styles.sectionLabel}>UPCOMING (NEXT 7 DAYS)</Text>
      </View>

      {upcomingTasks.length > 0 ? (
        <View style={styles.upcomingList}>
          {upcomingTasks.map(task => (
            <View key={task.id} style={styles.upcomingItem}>
              <Text style={styles.upcomingDot}>○</Text>
              <Text style={styles.upcomingContent}>
                <Text style={styles.upcomingTaskName}>{task.title}</Text>
                <Text style={styles.upcomingDate}> — {new Date(task.due_date).toLocaleDateString()}</Text>
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.emptyTextSub}>No upcoming tasks</Text>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  greeting: {
    ...theme.typography.h2,
    color: theme.colors.foreground,
    fontSize: 24,
  },
  date: {
    ...theme.typography.caption,
    color: theme.colors.foregroundMuted,
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  metricCard: {
    width: '47%',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.roundness.md,
    borderTopWidth: 2,
    alignItems: 'flex-start',
    gap: 4,
  },
  metricValue: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.foreground,
    ...theme.typography.numbers,
  },
  metricLabel: {
    ...theme.typography.small,
    fontSize: 10,
    color: theme.colors.foregroundMuted,
    letterSpacing: 0.5,
  },
  sectionHeader: {
    marginBottom: theme.spacing.md,
  },
  sectionLabel: {
    ...theme.typography.small,
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.foregroundMuted,
    letterSpacing: 1.5,
  },
  viewMoreButton: {
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  viewMoreText: {
    ...theme.typography.small,
    color: theme.colors.primary,
  },
  viewAllFooter: {
    marginTop: theme.spacing.lg,
    alignItems: 'center',
  },
  viewAllText: {
    ...theme.typography.body,
    color: theme.colors.foregroundMuted,
  },
  taskCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.roundness.md,
    marginBottom: theme.spacing.md,
    gap: 8,
  },
  taskCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  taskName: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.foreground,
    flex: 1,
    marginRight: 8,
  },
  campaignName: {
    ...theme.typography.small,
    color: theme.colors.foregroundMuted,
  },
  taskCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  dueInfo: {
    ...theme.typography.small,
    color: theme.colors.riskHard,
    fontWeight: '500',
  },
  updateButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  updateButtonText: {
    ...theme.typography.small,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  upcomingList: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.md,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  upcomingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  upcomingDot: {
    color: theme.colors.foregroundMuted,
    fontSize: 16,
  },
  upcomingContent: {
    flex: 1,
  },
  upcomingTaskName: {
    ...theme.typography.body,
    color: theme.colors.foreground,
  },
  upcomingDate: {
    color: theme.colors.foregroundMuted,
  },
  emptyCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xl,
    borderRadius: theme.roundness.md,
    alignItems: 'center',
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.foregroundMuted,
  },
  emptyTextSub: {
    ...theme.typography.small,
    color: theme.colors.foregroundMuted,
    textAlign: 'center',
  },
});
