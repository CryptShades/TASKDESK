import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { theme } from '../../../src/theme';
import { api } from '../../../src/lib/api';
import { RiskBadge } from '../../../src/components/RiskBadge';
import { useRouter } from 'expo-router';
import { LoadingScreen } from '../../../src/components/LoadingScreen';
import { ErrorState } from '../../../src/components/ErrorState';
import { EmptyState } from '../../../src/components/EmptyState';

export default function MyTasksScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setError(null);
    const { data: result, error: apiError } = await api.get<any[]>('/api/tasks/mine');
    if (apiError) {
      setError(apiError);
    } else if (result) {
      setTasks(result);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTasks();
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

  const sections = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const overdue = tasks.filter(t => new Date(t.due_date) < today && t.status !== 'completed');
    const thisWeek = tasks.filter(t => {
      const due = new Date(t.due_date);
      return due >= today && due < nextWeek && t.status !== 'completed';
    });
    const upcoming = tasks.filter(t => {
      const due = new Date(t.due_date);
      return due >= nextWeek || (due >= today && t.status === 'completed');
    });

    const result = [];
    if (overdue.length > 0) result.push({ title: 'OVERDUE', data: overdue, type: 'overdue' });
    if (thisWeek.length > 0) result.push({ title: 'DUE THIS WEEK', data: thisWeek, type: 'thisWeek' });
    if (upcoming.length > 0) result.push({ title: 'UPCOMING', data: upcoming, type: 'upcoming' });

    return result;
  }, [tasks]);

  if (loading && !refreshing) return <LoadingScreen />;
  if (error && !refreshing) return <ErrorState message={error} onRetry={fetchTasks} />;

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section: { title, type } }) => (
          <View style={[styles.sectionHeader, styles[`${type}Header` as keyof typeof styles]]}>
            <Text style={[styles.sectionTitle, styles[`${type}Title` as keyof typeof styles]]}>{title}</Text>
          </View>
        )}
        renderItem={({ item, section }) => (
          <TouchableOpacity 
            style={[
              styles.taskCard,
              section.type === 'overdue' && styles.overdueCard
            ]}
            onPress={() => router.push(`/(tabs)/tasks/${item.id}`)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.taskTitle}>{item.title}</Text>
              <RiskBadge variant={getRiskVariant(item.risk_flag || 'normal')} />
            </View>
            <Text style={styles.campaignName}>{item.campaign?.name}</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.dueDate}>Due {new Date(item.due_date).toLocaleDateString()}</Text>
              <Text style={styles.statusText}>{item.status.replace('_', ' ')}</Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
        ListEmptyComponent={
          <EmptyState message="No tasks assigned to you." />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContent: {
    paddingBottom: theme.spacing.xl,
  },
  sectionHeader: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.background,
  },
  sectionTitle: {
    ...theme.typography.small,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  overdueHeader: {},
  overdueTitle: {
    color: theme.colors.riskHard,
  },
  thisWeekHeader: {},
  thisWeekTitle: {
    color: theme.colors.riskSoft,
  },
  upcomingHeader: {},
  upcomingTitle: {
    color: theme.colors.foregroundMuted,
  },
  taskCard: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    marginVertical: 4,
    padding: theme.spacing.md,
    borderRadius: theme.roundness.md,
    gap: 4,
  },
  overdueCard: {
    backgroundColor: 'rgba(229, 57, 53, 0.05)',
    borderColor: 'rgba(229, 57, 53, 0.2)',
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  taskTitle: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.foreground,
    flex: 1,
    marginRight: 8,
  },
  campaignName: {
    ...theme.typography.small,
    color: theme.colors.foregroundMuted,
    fontSize: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    alignItems: 'center',
  },
  dueDate: {
    ...theme.typography.small,
    color: theme.colors.foregroundMuted,
  },
  statusText: {
    ...theme.typography.small,
    color: theme.colors.foregroundMuted,
    textTransform: 'capitalize',
  },
});
