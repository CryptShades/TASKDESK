import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { theme } from '../../../src/theme';
import { api } from '../../../src/lib/api';
import { useUserStore } from '../../../src/store';
import { RiskBadge } from '../../../src/components/RiskBadge';
import { LoadingScreen } from '../../../src/components/LoadingScreen';
import { ErrorState } from '../../../src/components/ErrorState';
import { 
  Circle, 
  PlayCircle, 
  CheckCircle2, 
  Slash,
  AlertCircle
} from 'lucide-react-native';

const STATUS_OPTIONS = [
  { id: 'not_started', label: 'Not Started', icon: Circle },
  { id: 'in_progress', label: 'In Progress', icon: PlayCircle },
  { id: 'completed', label: 'Completed', icon: CheckCircle2 },
  { id: 'blocked', label: 'Blocked', icon: Slash },
];

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useUserStore();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [task, setTask] = useState<any>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const isOwner = task?.owner_id === user?.id;
  const isFounderOrManager = user?.role === 'founder' || user?.role === 'manager';
  const hasAccess = isOwner || isFounderOrManager;

  const fetchTask = useCallback(async () => {
    setError(null);
    const { data: result, error: apiError } = await api.get<any>(`/api/tasks/${id}`);
    if (apiError) {
      setError(apiError);
    } else if (result) {
      setTask(result);
      setSelectedStatus(result.status);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    if (id) fetchTask();
  }, [fetchTask]);

  const handleUpdateStatus = async () => {
    if (!selectedStatus || selectedStatus === task.status) return;

    setUpdating(true);
    setUpdateSuccess(false);

    const { data, error: apiError } = await api.patch<any>(`/api/tasks/${id}/status`, {
      status: selectedStatus,
    });

    if (apiError) {
      Alert.alert('Update Failed', apiError);
      setUpdating(false);
    } else {
      setUpdateSuccess(true);
      setTimeout(() => {
        setUpdateSuccess(false);
        setUpdating(false);
        fetchTask();
      }, 1000);
    }
  };

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorState message={error} onRetry={fetchTask} />;
  
  if (!hasAccess) {
    return <ErrorState message="You do not have permission to view this task." />;
  }

  const getRiskVariant = (risk: string) => {
    if (risk === 'hard_risk') return 'hard';
    if (risk === 'soft_risk') return 'soft';
    return null;
  };

  const getDependencyStatusNote = () => {
    if (!task.dependency) return null;
    if (task.dependency.status === 'completed') {
      const completedAt = new Date(task.dependency.updated_at);
      const now = new Date();
      const diffHours = Math.floor((now.getTime() - completedAt.getTime()) / (1000 * 60 * 60));
      return { 
        text: `Completed ${diffHours}h ago`, 
        color: theme.colors.riskNormal 
      };
    }
    return { 
      text: `Requires ${task.dependency.title}`, 
      color: theme.colors.riskSoft 
    };
  };

  const dependencyNote = getDependencyStatusNote();

  const isTransitionDisabled = (statusId: string) => {
    if (statusId === 'in_progress' && task.dependency && task.dependency.status !== 'completed') {
      return true;
    }
    // Logic for other transitions if needed
    return false;
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Task Detail',
          headerBackTitle: 'My Tasks',
        }} 
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Task Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.taskTitle}>{task.title}</Text>
            {task.risk_flag && <RiskBadge variant={getRiskVariant(task.risk_flag) as any} size="sm" />}
          </View>
          <Text style={styles.headerSubtitle}>
            {task.campaign?.name} · Due {new Date(task.due_date).toLocaleDateString()}
          </Text>
        </View>

        {/* Status Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>STATUS</Text>
          {isOwner ? (
            <View style={styles.statusPicker}>
              {STATUS_OPTIONS.map((option) => {
                const isCurrent = task.status === option.id;
                const isSelected = selectedStatus === option.id;
                const isDisabled = isTransitionDisabled(option.id);
                const Icon = option.icon;

                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.statusRow,
                      isSelected && styles.statusRowSelected,
                      isDisabled && styles.statusRowDisabled
                    ]}
                    onPress={() => !isDisabled && setSelectedStatus(option.id)}
                    disabled={isDisabled || updating}
                  >
                    <Icon 
                      size={20} 
                      color={
                        isDisabled ? theme.colors.foregroundMuted : 
                        isSelected ? theme.colors.primary : 
                        theme.colors.foreground
                      } 
                    />
                    <Text style={[
                      styles.statusLabel,
                      isSelected && styles.statusLabelSelected,
                      isDisabled && styles.statusLabelDisabled
                    ]}>
                      {option.label}
                    </Text>
                    {isCurrent && <Text style={styles.currentIndicator}>← current</Text>}
                    {isDisabled && (
                      <Text style={styles.disabledReason}>
                        Complete {task.dependency.title} first.
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                style={[
                  styles.updateButton,
                  (selectedStatus === task.status || updating) && styles.updateButtonDisabled,
                  updateSuccess && styles.updateButtonSuccess
                ]}
                onPress={handleUpdateStatus}
                disabled={selectedStatus === task.status || updating}
              >
                {updating ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.updateButtonText}>
                    {updateSuccess ? 'Status Updated' : 'Update Status'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.readOnlyStatus}>
              <Text style={styles.largeStatusText}>
                {task.status.replace('_', ' ').toUpperCase()}
              </Text>
              <Text style={styles.ownerInfo}>Assigned to {task.owner?.name}</Text>
            </View>
          )}
        </View>

        {/* Dependency Section */}
        {task.dependency && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>DEPENDENCY</Text>
            <View style={styles.dependencyCard}>
              <Text style={styles.dependencyLabel}>Depends on:</Text>
              <View style={styles.dependencyTitleRow}>
                <Text style={styles.dependencyTitle}>{task.dependency.title}</Text>
                <RiskBadge 
                  variant={task.dependency.status === 'completed' ? 'normal' : 'soft'} 
                  size="sm" 
                />
              </View>
              {dependencyNote && (
                <Text style={[styles.dependencyNote, { color: dependencyNote.color }]}>
                  {dependencyNote.text}
                </Text>
              )}
            </View>
          </View>
        )}
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
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    marginBottom: 4,
  },
  taskTitle: {
    ...theme.typography.h2,
    color: theme.colors.foreground,
    flex: 1,
    fontSize: 20,
  },
  headerSubtitle: {
    ...theme.typography.body,
    color: theme.colors.foregroundMuted,
  },
  section: {
    marginBottom: theme.spacing.xxl,
  },
  sectionHeader: {
    ...theme.typography.small,
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.foregroundMuted,
    letterSpacing: 1.5,
    marginBottom: theme.spacing.md,
  },
  statusPicker: {
    gap: theme.spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.md,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: theme.spacing.md,
  },
  statusRowSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  },
  statusRowDisabled: {
    opacity: 0.5,
    backgroundColor: theme.colors.background,
    borderStyle: 'dashed',
    borderColor: theme.colors.border,
  },
  statusLabel: {
    ...theme.typography.body,
    color: theme.colors.foreground,
    flexShrink: 1,
  },
  statusLabelSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  statusLabelDisabled: {
    color: theme.colors.foregroundMuted,
  },
  currentIndicator: {
    ...theme.typography.small,
    color: theme.colors.primary,
    fontStyle: 'italic',
  },
  disabledReason: {
    ...theme.typography.small,
    color: theme.colors.riskSoft,
    fontSize: 10,
    position: 'absolute',
    right: 12,
  },
  updateButton: {
    height: 48,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.roundness.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  updateButtonDisabled: {
    backgroundColor: theme.colors.surfaceRaised,
    opacity: 0.6,
  },
  updateButtonSuccess: {
    backgroundColor: theme.colors.riskNormal,
  },
  updateButtonText: {
    ...theme.typography.body,
    color: 'white',
    fontWeight: '700',
  },
  readOnlyStatus: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xl,
    borderRadius: theme.roundness.md,
    alignItems: 'center',
    gap: 8,
  },
  largeStatusText: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.foreground,
    letterSpacing: 1,
  },
  ownerInfo: {
    ...theme.typography.small,
    color: theme.colors.foregroundMuted,
  },
  dependencyCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.roundness.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  dependencyLabel: {
    ...theme.typography.small,
    color: theme.colors.foregroundMuted,
    marginBottom: 4,
  },
  dependencyTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dependencyTitle: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.foreground,
    flex: 1,
    marginRight: 8,
  },
  dependencyNote: {
    ...theme.typography.small,
    fontWeight: '600',
  },
});
