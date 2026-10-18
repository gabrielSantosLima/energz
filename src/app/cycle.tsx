import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { useCycleDetail } from '@/hooks/use-cycles';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { formatDate, formatEnergy } from '@/lib/format';
import { radius, spacing, tabularNums } from '@/theme';

type StatProps = {
  label: string;
  value: string;
  accent: string;
};

function Stat({ label, value, accent }: StatProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.stat,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}>
      <View style={styles.statLabel}>
        <View style={[styles.dot, { backgroundColor: accent }]} />
        <Text variant="caption" color="textSecondary">
          {label}
        </Text>
      </View>
      <Text variant="title" style={tabularNums}>
        {value}
      </Text>
    </View>
  );
}

type ReadingProps = {
  label: string;
  date: Date;
  consumption: number;
  production: number;
};

function ReadingRow({ label, date, consumption, production }: ReadingProps) {
  const { colors } = useTheme();
  const { t, locale } = useTranslation();

  return (
    <View style={styles.reading}>
      <View style={styles.readingHeader}>
        <Text variant="label" color="textSecondary">
          {label}
        </Text>
        <Text variant="label" color="textPrimary">
          {formatDate(date, locale)}
        </Text>
      </View>
      <View style={styles.readingValues}>
        <Text variant="caption" color="textTertiary">
          {`${t('cycles.consumption')}: `}
          <Text variant="caption" color="textPrimary">
            {formatEnergy(consumption, locale)}
          </Text>
        </Text>
        <Text variant="caption" color="textTertiary">
          {`${t('cycles.production')}: `}
          <Text variant="caption" color="textPrimary">
            {formatEnergy(production, locale)}
          </Text>
        </Text>
      </View>
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
    </View>
  );
}

export default function CycleDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const { colors } = useTheme();
  const { t, locale } = useTranslation();
  const { cycle, loading } = useCycleDetail(params.id);

  const balanceColor =
    cycle && cycle.balance < 0 ? colors.danger : colors.success;

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          onPress={() => router.back()}
          style={styles.back}>
          <SymbolView
            name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
            size={22}
            tintColor={colors.textPrimary}
          />
        </Pressable>
        <Text variant="heading">{t('cycles.title')}</Text>
      </View>

      {loading ? (
        <View style={styles.skeleton}>
          <Skeleton height={128} round={radius.xl} />
          <View style={styles.statsRow}>
            <Skeleton height={88} round={radius.xl} style={styles.flex} />
            <Skeleton height={88} round={radius.xl} style={styles.flex} />
          </View>
          <Skeleton height={160} round={radius.xl} />
        </View>
      ) : !cycle ? (
        <View style={styles.center}>
          <Text variant="body" color="textSecondary">
            {t('cycles.empty')}
          </Text>
        </View>
      ) : (
        <>
          <View
            style={[
              styles.hero,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <Text variant="caption" color="textSecondary">
              {t('cycles.balance')}
            </Text>
            <Text
              variant="display"
              style={[tabularNums, { color: balanceColor }]}>
              {formatEnergy(cycle.balance, locale)}
            </Text>
            <Text variant="caption" color="textTertiary">
              {`${formatDate(cycle.start.measuredAt, locale)} — ${formatDate(cycle.end.measuredAt, locale)}`}
            </Text>
          </View>

          <View style={styles.statsRow}>
            <Stat
              label={t('cycles.production')}
              value={formatEnergy(cycle.production, locale)}
              accent={colors.accent}
            />
            <Stat
              label={t('cycles.consumption')}
              value={formatEnergy(cycle.consumption, locale)}
              accent={colors.primary}
            />
          </View>

          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <Text variant="label" color="textSecondary">
              {t('cycles.readings')}
            </Text>
            <ReadingRow
              label={t('cycles.start')}
              date={cycle.start.measuredAt}
              consumption={cycle.start.consumption}
              production={cycle.start.production}
            />
            <ReadingRow
              label={t('cycles.end')}
              date={cycle.end.measuredAt}
              consumption={cycle.end.consumption}
              production={cycle.end.production}
            />
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  stat: {
    flex: 1,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  statLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
  },
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  reading: {
    gap: spacing.xs,
  },
  readingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  readingValues: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginTop: spacing.md,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
  },
  skeleton: {
    gap: spacing.lg,
  },
  flex: { flex: 1 },
});
