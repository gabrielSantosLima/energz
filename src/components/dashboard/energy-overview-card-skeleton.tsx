import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@/components/ui/skeleton';
import { useTheme } from '@/hooks/use-theme';
import { radius, spacing } from '@/theme';

function MetricSkeleton() {
  return (
    <View style={styles.metric}>
      <Skeleton width={90} height={12} />
      <Skeleton width={140} height={24} />
      <View style={styles.interval}>
        <Skeleton width={140} height={12} />
        <Skeleton width={60} height={12} />
      </View>
      <Skeleton width={70} height={12} />
    </View>
  );
}

export function EnergyOverviewCardSkeleton() {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}>
      <MetricSkeleton />
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      <MetricSkeleton />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.lg,
  },
  metric: {
    gap: spacing.sm,
  },
  interval: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
});
