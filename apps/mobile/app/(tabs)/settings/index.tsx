import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { theme } from '../../../src/theme';
import { useUserStore } from '../../../src/store';
import { signOut } from '../../../src/lib/auth';
import { useRouter } from 'expo-router';
import { 
  ChevronRight, 
  User, 
  Bell, 
  LogOut, 
  Shield 
} from 'lucide-react-native';

export default function SettingsScreen() {
  const { user, organization, clear } = useUserStore();
  const router = useRouter();

  const handleLogout = async () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Log Out', 
          style: 'destructive',
          onPress: async () => {
            await signOut();
            clear();
            router.replace('/(auth)/login');
          }
        },
      ]
    );
  };

  const getUserInitials = () => {
    if (!user?.name) return '??';
    const names = user.name.split(' ');
    if (names.length >= 2) return (names[0][0] + names[1][0]).toUpperCase();
    return names[0].substring(0, 2).toUpperCase();
  };

  const SettingItem = ({ 
    icon: Icon, 
    label, 
    onPress, 
    isDestructive = false, 
    showChevron = true 
  }: any) => (
    <TouchableOpacity 
      style={styles.menuItem} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemLeft}>
        <View style={[styles.iconContainer, isDestructive && styles.destructiveIcon]}>
          <Icon size={20} color={isDestructive ? theme.colors.riskHard : theme.colors.foreground} />
        </View>
        <Text style={[styles.menuItemLabel, isDestructive && styles.destructiveLabel]}>
          {label}
        </Text>
      </View>
      {showChevron && <ChevronRight size={20} color={theme.colors.foregroundMuted} />}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getUserInitials()}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.userName}>{user?.name}</Text>
          <View style={styles.roleTag}>
            <Shield size={12} color={theme.colors.primary} />
            <Text style={styles.roleText}>{user?.role?.toUpperCase()}</Text>
          </View>
          <Text style={styles.orgName}>{organization?.name || 'Taskdesk Org'}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.menuSection}>
        <SettingItem 
          icon={User} 
          label="Profile" 
          onPress={() => router.push('/settings/profile')} 
        />
        <SettingItem 
          icon={Bell} 
          label="Push Notifications" 
          onPress={() => Alert.alert('Notifications', 'Preferences screen coming soon.')} 
        />
      </View>

      <View style={styles.divider} />

      <View style={styles.menuSection}>
        <SettingItem 
          icon={LogOut} 
          label="Log Out" 
          onPress={handleLogout} 
          isDestructive={true}
          showChevron={false}
        />
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.versionText}>Taskdesk Mobile v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.surfaceRaised,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  userName: {
    ...theme.typography.h2,
    color: theme.colors.foreground,
    fontSize: 20,
  },
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.primary,
    letterSpacing: 0.5,
  },
  orgName: {
    ...theme.typography.small,
    color: theme.colors.foregroundMuted,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.lg,
  },
  menuSection: {
    padding: theme.spacing.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  destructiveIcon: {
    backgroundColor: 'rgba(229, 57, 53, 0.1)',
  },
  menuItemLabel: {
    ...theme.typography.body,
    color: theme.colors.foreground,
    fontWeight: '500',
  },
  destructiveLabel: {
    color: theme.colors.riskHard,
  },
  footer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  versionText: {
    ...theme.typography.small,
    color: theme.colors.foregroundMuted,
    fontSize: 10,
  },
});
