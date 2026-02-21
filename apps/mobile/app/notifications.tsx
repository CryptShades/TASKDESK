import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { theme } from '../src/theme';
import { api } from '../src/lib/api';
import { Stack, useRouter } from 'expo-router';
import { CheckCircle, BellOff } from 'lucide-react-native';
import { LoadingScreen } from '../src/components/LoadingScreen';
import { ErrorState } from '../src/components/ErrorState';
import { EmptyState } from '../src/components/EmptyState';

export default function NotificationsScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const router = useRouter();

  const fetchNotifications = async () => {
    setError(null);
    const { data: result, error: apiError } = await api.get<any[]>('/api/notifications');
    if (apiError) {
      setError(apiError);
    } else if (result) {
      setNotifications(result);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllAsRead = async () => {
    const { error: apiError } = await api.patch('/api/notifications/read-all', {});
    if (!apiError) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  const handleNotificationPress = async (notification: any) => {
    if (!notification.read) {
      await api.patch(`/api/notifications/${notification.id}/read`, {});
      setNotifications(prev => prev.map(n => 
        n.id === notification.id ? { ...n, read: true } : n
      ));
    }

    if (notification.type.includes('task') && notification.task_id) {
      router.push(`/(tabs)/tasks/${notification.task_id}`);
    } else if (notification.campaign_id) {
      router.push(`/(tabs)/campaigns/${notification.campaign_id}`);
    }
  };

  const getTypeColor = (type: string, read: boolean) => {
    if (read) return theme.colors.foregroundMuted;
    if (type.includes('escalation')) return theme.colors.riskHard;
    if (type.includes('risk')) return theme.colors.riskSoft;
    if (type.includes('reminder')) return theme.colors.primary;
    return theme.colors.foreground;
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorState message={error} onRetry={fetchNotifications} />;

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Notifications',
          headerRight: () => (
            <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.headerAction}>
              <CheckCircle size={20} color={theme.colors.primary} />
            </TouchableOpacity>
          ),
        }} 
      />

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.notificationRow, !item.read && styles.unreadRow]}
            onPress={() => handleNotificationPress(item)}
            activeOpacity={0.7}
          >
            <View style={[styles.dot, { backgroundColor: getTypeColor(item.type, item.read) }]} />
            <View style={styles.content}>
              <Text style={[styles.message, !item.read && styles.unreadMessage]}>
                {item.message}
              </Text>
              <Text style={styles.timestamp}>{formatTime(item.created_at)}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <EmptyState message="No notifications." />
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
  headerAction: {
    marginRight: theme.spacing.lg,
  },
  listContent: {
    paddingBottom: theme.spacing.xxl,
  },
  notificationRow: {
    flexDirection: 'row',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  unreadRow: {
    backgroundColor: theme.colors.surface,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  message: {
    ...theme.typography.body,
    color: theme.colors.foreground,
    fontSize: 14,
  },
  unreadMessage: {
    fontWeight: '600',
  },
  timestamp: {
    ...theme.typography.small,
    color: theme.colors.foregroundMuted,
    fontSize: 11,
  },
});
