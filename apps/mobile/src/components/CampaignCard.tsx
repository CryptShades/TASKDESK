import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../theme';
import { RiskBadge, RiskVariant } from './RiskBadge';
import { useRouter } from 'expo-router';

interface CampaignCardProps {
  id: string;
  name: string;
  clientName: string;
  riskStatus: any; // Using any for loosely typed risk statuses from backend
  launchDate: string;
  overdueCount: number;
  blockedCount: number;
}

export function CampaignCard({
  id,
  name,
  clientName,
  riskStatus,
  launchDate,
  overdueCount,
  blockedCount,
}: CampaignCardProps) {
  const router = useRouter();

  const getRiskVariant = (status: string): any => {
    switch (status) {
      case 'high_risk': return 'hard';
      case 'at_risk': return 'soft';
      case 'normal': return 'normal';
      case 'blocked': return 'blocked';
      default: return 'normal';
    }
  };

  const getRiskColor = () => {
    const variant = getRiskVariant(riskStatus);
    switch (variant) {
      case 'hard': return theme.colors.riskHard;
      case 'soft': return theme.colors.riskSoft;
      case 'normal': return theme.colors.riskNormal;
      case 'blocked': return theme.colors.riskBlocked;
      default: return theme.colors.border;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Launched';
    if (diffDays === 0) return 'Launching Today';
    return `L-${diffDays}d`;
  };

  return (
    <TouchableOpacity 
      style={[styles.card, { borderColor: getRiskColor() }]}
      onPress={() => router.push(`/(tabs)/campaigns/${id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.topRow}>
        <RiskBadge variant={getRiskVariant(riskStatus)} />
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
      </View>
      
      <Text style={styles.clientInfo} numberOfLines={1}>
        {clientName} · Launch {formatDate(launchDate)}
      </Text>

      <View style={styles.statsRow}>
        <Text style={[styles.stat, overdueCount > 0 && styles.overdue]}>
          {overdueCount} overdue
        </Text>
        <Text style={styles.statDivider}>·</Text>
        <Text style={[styles.stat, blockedCount > 0 && styles.blocked]}>
          {blockedCount} blocked
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.roundness.lg,
    borderWidth: 1,
    marginBottom: theme.spacing.md,
    minHeight: 96,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: 4,
  },
  name: {
    ...theme.typography.h3,
    fontWeight: '600',
    color: theme.colors.foreground,
    flex: 1,
  },
  clientInfo: {
    ...theme.typography.label,
    color: theme.colors.foregroundMuted,
    marginBottom: theme.spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  stat: {
    ...theme.typography.label,
    color: theme.colors.foregroundMuted,
  },
  statDivider: {
    color: theme.colors.foregroundMuted,
    fontSize: 12,
  },
  overdue: {
    color: theme.colors.riskHard,
    fontWeight: '600',
  },
  blocked: {
    color: theme.colors.riskBlocked,
    fontWeight: '600',
  },
});
