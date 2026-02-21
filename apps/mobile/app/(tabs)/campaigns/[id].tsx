import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { theme } from '../../../src/theme';
import { api } from '../../../src/lib/api';
import { RiskBadge } from '../../../src/components/RiskBadge';
import { LoadingScreen } from '../../../src/components/LoadingScreen';
import { ErrorState } from '../../../src/components/ErrorState';
import { EmptyState } from '../../../src/components/EmptyState';
import { 
  CheckCircle2, 
  PlayCircle, 
  AlertTriangle, 
  Circle, 
  Slash
} from 'lucide-react-native';

export default function CampaignDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<any>(null);

  useEffect(() => {
    if (id) fetchCampaign();
  }, [id]);

  const fetchCampaign = async () => {
    setError(null);
    const { data: result, error: apiError } = await api.get<any>(`/api/campaigns/${id}`);
    if (apiError) {
      setError(apiError);
    } else if (result) {
      setCampaign(result);
    }
    setLoading(false);
  };

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorState message={error} onRetry={fetchCampaign} />;
  if (!campaign) return <EmptyState message="Campaign not found." />;

  const getStatusIcon = (status: string, risk?: string) => {
    if (status === 'completed') return <CheckCircle2 size={20} color={theme.colors.riskNormal} />;
    if (status === 'blocked') return <Slash size={20} color={theme.colors.riskBlocked} />;
    if (risk === 'hard_risk' || risk === 'soft_risk') return <AlertTriangle size={20} color={theme.colors.riskSoft} />;
    if (status === 'in_progress') return <PlayCircle size={20} color={theme.colors.primary} />;
    return <Circle size={20} color={theme.colors.foregroundMuted} />;
  };

  const getRiskVariant = (status: string) => {
    switch (status) {
      case 'high_risk': return 'hard';
      case 'at_risk': return 'soft';
      case 'normal': return 'normal';
      case 'blocked': return 'blocked';
      default: return 'normal';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDaysCountdown = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days}d left` : 'Launched';
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: campaign.name,
          headerBackTitle: 'Campaigns',
        }} 
      />
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.name}>{campaign.name}</Text>
            <RiskBadge variant={getRiskVariant(campaign.risk_status)} />
          </View>
          <Text style={styles.subtitle}>
            {campaign.client?.name} · {formatDate(campaign.launch_date)} ({getDaysCountdown(campaign.launch_date)})
          </Text>
        </View>

        {/* Dependency Alerts Section */}
        {campaign.dependency_alerts?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DEPENDENCY ALERTS</Text>
            {campaign.dependency_alerts.map((alert: any) => (
              <View key={alert.id} style={styles.alertCard}>
                <AlertTriangle size={20} color={theme.colors.riskSoft} />
                <Text style={styles.alertText}>
                  {alert.dependency_gap_hours}h gap on {alert.title}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TASKS</Text>
          {campaign.tasks?.map((task: any) => (
            <TouchableOpacity 
              key={task.id} 
              style={[
                styles.taskItem,
                new Date(task.due_date) < new Date() && task.status !== 'completed' && styles.overdueItem,
                task.status === 'blocked' && styles.blockedItem
              ]}
              onPress={() => router.push(`/(tabs)/tasks/${task.id}`)}
            >
              <View style={styles.taskIcon}>
                {getStatusIcon(task.status, task.risk_flag)}
              </View>
              <View style={styles.taskInfo}>
                <Text style={styles.taskTitle} numberOfLines={1}>{task.title}</Text>
                <Text style={styles.taskOwner}>{task.owner?.name || 'Unassigned'}</Text>
              </View>
              <View style={styles.taskStatus}>
                <Text style={styles.statusLabel}>
                  {task.status.replace('_', ' ')}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: 4,
  },
  name: {
    ...theme.typography.h2,
    color: theme.colors.foreground,
    flexShrink: 1,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.foregroundMuted,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    ...theme.typography.small,
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.foregroundMuted,
    letterSpacing: 1.5,
    marginBottom: theme.spacing.md,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: 'rgba(245, 166, 35, 0.1)',
    padding: theme.spacing.md,
    borderRadius: theme.roundness.md,
    borderWidth: 1,
    borderColor: theme.colors.riskSoft,
  },
  alertText: {
    ...theme.typography.body,
    color: theme.colors.riskSoft,
    fontWeight: '600',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.roundness.md,
    marginBottom: theme.spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  overdueItem: {
    borderLeftColor: theme.colors.riskHard,
  },
  blockedItem: {
    borderLeftColor: theme.colors.riskBlocked,
  },
  taskIcon: {
    marginRight: theme.spacing.md,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.foreground,
  },
  taskOwner: {
    ...theme.typography.small,
    color: theme.colors.foregroundMuted,
  },
  taskStatus: {
    alignItems: 'flex-end',
  },
  statusLabel: {
    ...theme.typography.small,
    color: theme.colors.foregroundMuted,
    textTransform: 'capitalize',
  },
});
