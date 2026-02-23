import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { theme } from '../theme';
import { Bell, AlertTriangle, AlertOctagon, Info, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface NotificationBannerProps {
  notification: any;
  onClose: () => void;
}

export function NotificationBanner({ notification, onClose }: NotificationBannerProps) {
  const [translateY] = useState(new Animated.Value(-100));
  const [opacity] = useState(new Animated.Value(0));
  const router = useRouter();

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: 12,
      duration: 180,
      useNativeDriver: true,
    }).start();

    Animated.timing(opacity, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();

    // Auto-dismiss after 4s
    const timer = setTimeout(() => {
      handleClose();
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -40,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  const handlePress = () => {
    handleClose();
    if (notification.type.includes('task') && notification.task_id) {
      router.push(`/(tabs)/tasks/${notification.task_id}`);
    } else if (notification.campaign_id) {
      router.push(`/(tabs)/campaigns/${notification.campaign_id}`);
    } else {
      router.push('/notifications');
    }
  };

  const getIcon = () => {
    if (notification.type.includes('escalation')) return <AlertOctagon size={20} color={theme.colors.riskHard} />;
    if (notification.type.includes('risk')) return <AlertTriangle size={20} color={theme.colors.riskSoft} />;
    if (notification.type.includes('reminder')) return <Bell size={20} color={theme.colors.primary} />;
    return <Info size={20} color={theme.colors.foreground} />;
  };

  const getBorderColor = () => {
    if (notification.type.includes('escalation')) return theme.colors.riskHard;
    if (notification.type.includes('risk')) return theme.colors.riskSoft;
    if (notification.type.includes('reminder')) return theme.colors.primary;
    return theme.colors.border;
  };

  return (
    <Animated.View 
      style={[
        styles.container, 
        { transform: [{ translateY }], opacity, borderLeftColor: getBorderColor() }
      ]}
    >
      <TouchableOpacity 
        style={styles.content} 
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <View style={styles.iconContainer}>
          {getIcon()}
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>New Notification</Text>
          <Text style={styles.message} numberOfLines={2}>{notification.message}</Text>
        </View>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <X size={16} color={theme.colors.foregroundMuted} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 40, // Below status bar
    left: 16,
    right: 16,
    zIndex: 9999,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.lg,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...theme.typography.label,
    fontWeight: '600',
    color: theme.colors.foreground,
  },
  message: {
    ...theme.typography.label,
    color: theme.colors.foregroundMuted,
    fontSize: 12,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
});
