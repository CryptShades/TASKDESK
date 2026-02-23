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
  const stylesByVariant: Record<RiskVariant, { backgroundColor: string; borderColor: string; color: string }> = {
    hard: {
      backgroundColor: theme.colors.riskHard,
      borderColor: theme.colors.riskHard,
      color: theme.colors.white,
    },
    soft: {
      backgroundColor: theme.colors.riskSoft,
      borderColor: theme.colors.riskSoft,
      color: '#1C1E23',
    },
    normal: {
      backgroundColor: theme.colors.transparent,
      borderColor: theme.colors.riskNormal,
      color: theme.colors.riskNormal,
    },
    blocked: {
      backgroundColor: theme.colors.transparent,
      borderColor: theme.colors.riskBlocked,
      color: theme.colors.riskBlocked,
    },
  };

  return StyleSheet.create({
    badge: {
      backgroundColor: stylesByVariant[variant].backgroundColor,
      borderColor: stylesByVariant[variant].borderColor,
      borderWidth: 1,
      borderRadius: theme.roundness.full,
      paddingHorizontal: size === 'sm' ? 10 : 12,
      paddingVertical: size === 'sm' ? 4 : 6,
      alignSelf: 'flex-start',
    },
    text: {
      ...theme.typography.badge,
      color: stylesByVariant[variant].color,
      fontSize: size === 'sm' ? 11 : 12,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
  });
}
