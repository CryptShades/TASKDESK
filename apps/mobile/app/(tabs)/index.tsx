import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../src/theme';
import { useUserStore } from '../../src/store';
import { api } from '../../src/lib/api';
import { CampaignCard } from '../../src/components/CampaignCard';
import { AlertOctagon, CheckCircle2 } from 'lucide-react-native';
import { RiskBadge } from '../../src/components/RiskBadge';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { ErrorState } from '../../src/components/ErrorState';
import { EmptyState } from '../../src/components/EmptyState';

export default function DashboardScreen() {
  const { user } = useUserStore();
  const router = useRouter();
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
        <Text style={styles.greeting}>Risk Command Center</Text>
        <Text style={styles.date}>Updated {formatDate()}</Text>
      </View>

      {isFounderOrManager ? (
        <FounderDashboard data={data} getRiskVariant={getRiskVariant} router={router} />
      ) : (
        <MemberDashboard data={data} getRiskVariant={getRiskVariant} />
      )}
    </ScrollView>
  );
}

function FounderDashboard({
  data,
  getRiskVariant,
  router,
}: {
  data: any;
  getRiskVariant: (s: string) => any;
  router: ReturnType<typeof useRouter>;
}) {
  if (!data) return <EmptyState message="No data available." />;

  const { metrics, campaigns = [], dependency_alerts = [] } = data;
  const sortedCampaigns = [...campaigns].sort((a: any, b: any) => {
    const priority: Record<string, number> = { high_risk: 0, at_risk: 1, normal: 2 };
    const riskDiff = (priority[a.risk_status] ?? 3) - (priority[b.risk_status] ?? 3);
    if (riskDiff !== 0) return riskDiff;
    return (b.task_counts?.blocked ?? 0) - (a.task_counts?.blocked ?? 0);
  });

  const urgentAlerts = dependency_alerts
    .filter((alert: any) => (alert.dependency_gap_hours ?? 0) >= 24)
    .slice(0, 4);

  return (
    <>
      <View style={styles.grid}>
        <MetricCard label="High Risk" value={metrics?.high_risk_count || 0} color={theme.colors.riskHard} />
        <MetricCard label="At Risk" value={metrics?.at_risk_count || 0} color={theme.colors.riskSoft} />
        <MetricCard label="Normal" value={metrics?.active_count || 0} color={theme.colors.riskNormal} />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>CAMPAIGN RISK</Text>
      </View>

      {sortedCampaigns.length > 0 ? (
        <>
          {sortedCampaigns.slice(0, 5).map((campaign: any) => (
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
          {sortedCampaigns.length > 5 && (
            <TouchableOpacity style={styles.viewMoreButton} onPress={() => router.push('/(tabs)/campaigns')}>
              <Text style={styles.viewMoreText}>View all campaigns</Text>
            </TouchableOpacity>
          )}
        </>
      ) : (
        <View style={styles.emptyCard}>
          <CheckCircle2 color={theme.colors.riskNormal} size={24} />
          <Text style={styles.emptyText}>No active campaigns.</Text>
          <Text style={styles.emptyTextSub}>Create a campaign to begin monitoring execution risk.</Text>
        </View>
      )}

      <View style={[styles.sectionHeader, { marginTop: theme.spacing.lg }]}>
        <Text style={styles.sectionLabel}>URGENT TASKS</Text>
      </View>

      {urgentAlerts.length === 0 ? (
        <View style={styles.emptyCard}>
          <CheckCircle2 color={theme.colors.riskNormal} size={24} />
          <Text style={styles.emptyText}>No urgent escalations.</Text>
        </View>
      ) : (
        urgentAlerts.map((alert: any) => (
          <TouchableOpacity
            key={alert.id}
            style={styles.urgentRow}
            onPress={() => router.push(`/(tabs)/campaigns/${alert.campaign.id}`)}
          >
            <AlertOctagon color={theme.colors.riskHard} size={16} />
            <View style={styles.urgentContent}>
              <Text style={styles.urgentCampaign}>{alert.campaign.name}</Text>
              <Text style={styles.urgentTask} numberOfLines={1}>
                {alert.title}
              </Text>
            </View>
            <Text style={styles.urgentGap}>{alert.dependency_gap_hours}h</Text>
          </TouchableOpacity>
        ))
      )}
    </>
  );
}

function MetricCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[styles.metricCard, { borderColor: color }]}>
      <Text style={[styles.metricValue, value > 0 ? { color } : null]}>{value}</Text>
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
            <View style={styles.taskCardBottom}>
              <Text style={styles.dueInfo}>Due {new Date(task.due_date).toLocaleDateString()}</Text>
              <TouchableOpacity style={styles.updateButton}>
                <Text style={styles.updateButtonText}>Update →</Text>
              </TouchableOpacity>
            </View>
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
    marginBottom: theme.spacing.lg,
  },
  greeting: {
    ...theme.typography.h1,
    color: theme.colors.foreground,
  },
  date: {
    ...theme.typography.label,
    color: theme.colors.foregroundMuted,
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  metricCard: {
    width: '31%',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.roundness.lg,
    borderWidth: 1,
    alignItems: 'flex-start',
    gap: 4,
  },
  metricValue: {
    fontSize: 26,
    fontWeight: '600',
    color: theme.colors.foreground,
    ...theme.typography.numbers,
  },
  metricLabel: {
    ...theme.typography.label,
    color: theme.colors.foregroundMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  sectionHeader: {
    marginBottom: theme.spacing.md,
  },
  sectionLabel: {
    ...theme.typography.label,
    color: theme.colors.foregroundMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  viewMoreButton: {
    paddingVertical: theme.spacing.sm,
    alignItems: 'flex-start',
  },
  viewMoreText: {
    ...theme.typography.label,
    color: theme.colors.primary,
    fontWeight: '600',
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
    borderRadius: theme.roundness.lg,
    alignItems: 'center',
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.foreground,
  },
  emptyTextSub: {
    ...theme.typography.label,
    color: theme.colors.foregroundMuted,
    textAlign: 'center',
  },
  urgentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.roundness.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  urgentContent: {
    flex: 1,
  },
  urgentCampaign: {
    ...theme.typography.h3,
    color: theme.colors.foreground,
  },
  urgentTask: {
    ...theme.typography.body,
    color: theme.colors.foregroundMuted,
    marginTop: 2,
  },
  urgentGap: {
    ...theme.typography.label,
    color: theme.colors.riskHard,
    fontWeight: '600',
  },
});
