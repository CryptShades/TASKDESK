import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

export type RiskVariant = 'normal' | 'soft' | 'hard' | 'blocked';

interface RiskBadgeProps {
  variant: RiskVariant;
  size?: 'sm' | 'md';
}

export function RiskBadge({ variant, size = 'sm' }: RiskBadgeProps) {
  const styles = getStyles(variant, size);

  const labels: Record<RiskVariant, string> = {
    hard: 'High Risk',
    soft: 'At Risk',
    normal: 'Normal',
    blocked: 'Blocked',
  };

  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{labels[variant]}</Text>
    </View>
  );
}

function getStyles(variant: RiskVariant, size: 'sm' | 'md') {
  const colors: Record<RiskVariant, string> = {
    hard: theme.colors.riskHard,
    soft: theme.colors.riskSoft,
    normal: theme.colors.riskNormal,
    blocked: theme.colors.riskBlocked,
  };

  const bgColors: Record<RiskVariant, string> = {
    hard: 'rgba(229, 57, 53, 0.1)',
    soft: 'rgba(245, 166, 35, 0.1)',
    normal: 'rgba(45, 158, 96, 0.1)',
    blocked: 'rgba(156, 111, 228, 0.1)',
  };

  return StyleSheet.create({
    badge: {
      backgroundColor: bgColors[variant],
      borderColor: colors[variant],
      borderWidth: 1,
      borderRadius: theme.roundness.full,
      paddingHorizontal: size === 'sm' ? 8 : 12,
      paddingVertical: size === 'sm' ? 2 : 4,
      alignSelf: 'flex-start',
    },
    text: {
      color: colors[variant],
      fontSize: size === 'sm' ? 10 : 12,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
  });
}
