import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { theme } from '../theme';
import { Bell, AlertTriangle, AlertOctagon, Info, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface NotificationBannerProps {
  notification: any;
  onClose: () => void;
}

const { width } = Dimensions.get('window');

export function NotificationBanner({ notification, onClose }: NotificationBannerProps) {
  const [translateY] = useState(new Animated.Value(-100));
  const router = useRouter();

  useEffect(() => {
    // Slide in
    Animated.spring(translateY, {
      toValue: 20,
      useNativeDriver: true,
      tension: 40,
      friction: 8,
    }).start();

    // Auto-dismiss after 4s
    const timer = setTimeout(() => {
      handleClose();
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    Animated.timing(translateY, {
      toValue: -150,
      duration: 300,
      useNativeDriver: true,
    }).start(() => onClose());
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
        { transform: [{ translateY }], borderLeftColor: getBorderColor() }
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
    ...theme.typography.small,
    fontWeight: '700',
    color: theme.colors.foreground,
  },
  message: {
    ...theme.typography.small,
    color: theme.colors.foregroundMuted,
    fontSize: 12,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
});
