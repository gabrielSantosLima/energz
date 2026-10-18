import { useEffect } from 'react';
import {
  StyleSheet,
  View,
  type DimensionValue,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/hooks/use-theme';
import { radius, spacing } from '@/theme';

type SkeletonProps = {
  width?: DimensionValue;
  height?: number;
  round?: number;
  style?: ViewStyle;
};

export function Skeleton({
  width = '100%',
  height = 16,
  round = radius.md,
  style,
}: SkeletonProps) {
  const { colors } = useTheme();
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 700 }), -1, true);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: round, backgroundColor: colors.surfaceMuted },
        animatedStyle,
        style,
      ]}
    />
  );
}

export function SkeletonCard() {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}>
      <Skeleton width="55%" height={18} />
      <View style={styles.metrics}>
        <Skeleton width={88} height={14} />
        <Skeleton width={88} height={14} />
      </View>
    </View>
  );
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }, (_, index) => (
        <SkeletonCard key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  metrics: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  list: {
    gap: spacing.sm,
  },
});
