import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@/components/ui/skeleton';
import { useTheme } from '@/hooks/use-theme';
import { radius, spacing } from '@/theme';

export function MetricCardSkeleton() {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}>
      <Skeleton width="70%" height={12} />
      <Skeleton width="60%" height={24} />
      <Skeleton width="45%" height={12} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
});
