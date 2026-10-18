import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { SkeletonList } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import type { Cycle } from '@/domain/entities/cycle';
import { useCycles } from '@/hooks/use-cycles';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { formatDate, formatEnergy } from '@/lib/format';
import { radius, spacing } from '@/theme';

export default function CyclesScreen() {
  const { colors } = useTheme();
  const { t, locale } = useTranslation();
  const { cycles, loading, refreshing, error, refresh } = useCycles();

  const ordered = [...cycles].reverse();

  const openCycle = (id: string) =>
    router.push({ pathname: '/cycle', params: { id } });

  const renderCycle = (item: Cycle) => {
    const balanceColor = item.balance >= 0 ? colors.success : colors.danger;

    return (
      <Pressable
        key={item.id}
        accessibilityRole="button"
        onPress={() => openCycle(item.id)}
        style={[
          styles.row,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}>
        <View
          style={[
            styles.badge,
            styles.badgeCorner,
            {
              backgroundColor: item.closed
                ? colors.surfaceMuted
                : colors.primarySoft,
            },
          ]}>
          <Text
            variant="caption"
            color={item.closed ? 'textSecondary' : 'primary'}>
            {item.closed ? t('cycles.closed') : t('cycles.current')}
          </Text>
        </View>

        <Text variant="subtitle" style={styles.range}>
          {`${formatDate(item.start.measuredAt, locale)} — ${formatDate(item.end.measuredAt, locale)}`}
        </Text>

        <View style={styles.metrics}>
          <View style={styles.metric}>
            <Text variant="caption" color="textTertiary">
              {t('cycles.production')}
            </Text>
            <Text variant="bodyStrong">
              {formatEnergy(item.production, locale)}
            </Text>
          </View>
          <View style={styles.metric}>
            <Text variant="caption" color="textTertiary">
              {t('cycles.consumption')}
            </Text>
            <Text variant="bodyStrong">
              {formatEnergy(item.consumption, locale)}
            </Text>
          </View>
          <View style={styles.metric}>
            <Text variant="caption" color="textTertiary">
              {t('cycles.balance')}
            </Text>
            <Text variant="bodyStrong" style={{ color: balanceColor }}>
              {formatEnergy(item.balance, locale)}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <Screen scroll refreshing={refreshing} onRefresh={refresh}>
      <View style={styles.header}>
        <Text variant="title">{t('cycles.title')}</Text>
      </View>

      {error ? (
        <Text variant="body" color="danger">
          {error}
        </Text>
      ) : loading && cycles.length === 0 ? (
        <SkeletonList />
      ) : cycles.length === 0 ? (
        <View style={styles.center}>
          <Text variant="heading">{t('cycles.empty')}</Text>
          <Text variant="body" color="textSecondary" style={styles.centerText}>
            {t('cycles.emptyHint')}
          </Text>
          <Button
            label={t('measurements.add')}
            onPress={() => router.push('/measurement')}
          />
        </View>
      ) : (
        <View style={styles.list}>{ordered.map(renderCycle)}</View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.lg,
  },
  list: {
    gap: spacing.sm,
  },
  row: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  range: {
    paddingRight: spacing['4xl'] * 2,
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  badgeCorner: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
  },
  metrics: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  metric: { flex: 1, gap: spacing.xs },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing['3xl'],
  },
  centerText: { textAlign: 'center' },
});
