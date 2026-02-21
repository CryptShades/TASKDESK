import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { theme } from '../theme';

const { width } = Dimensions.get('window');

export function LoadingScreen() {
  const shimmerValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerValue, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerValue, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const translateX = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  const SkeletonRow = ({ height = 80, marginBottom = 16 }: { height?: number; marginBottom?: number }) => (
    <View style={[styles.skeletonRow, { height, marginBottom }]}>
      <Animated.View
        style={[
          styles.shimmerEffect,
          {
            transform: [{ translateX }],
          },
        ]}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header Skeleton */}
      <View style={styles.header}>
        <View style={styles.titleSkeleton} />
        <View style={styles.subtitleSkeleton} />
      </View>

      {/* Grid Skeleton */}
      <View style={styles.grid}>
        <View style={styles.gridItem} />
        <View style={styles.gridItem} />
        <View style={styles.gridItem} />
        <View style={styles.gridItem} />
      </View>

      {/* List Skeletons */}
      <SkeletonRow />
      <SkeletonRow />
      <SkeletonRow />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  header: {
    marginBottom: theme.spacing.xl,
    gap: 8,
  },
  titleSkeleton: {
    height: 32,
    width: '60%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.sm,
  },
  subtitleSkeleton: {
    height: 16,
    width: '40%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  gridItem: {
    width: '47%',
    height: 80,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.md,
  },
  skeletonRow: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.md,
    overflow: 'hidden',
  },
  shimmerEffect: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
});
