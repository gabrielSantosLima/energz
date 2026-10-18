import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import type { Measurement } from '@/domain/entities/measurement';
import { useMeasurements } from '@/hooks/use-measurements';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { formatDate, formatEnergy } from '@/lib/format';
import { radius, spacing } from '@/theme';

export default function MeasurementsScreen() {
  const { colors } = useTheme();
  const { t, locale } = useTranslation();
  const { measurements, loading, refreshing, error, refresh } = useMeasurements();

  const openNew = () => router.push('/measurement');
  const openMeasurement = (id: string) =>
    router.push({ pathname: '/measurement', params: { id } });

  const renderItem = ({ item }: { item: Measurement }) => (
    <Pressable
      accessibilityRole="button"
      onPress={() => openMeasurement(item.id)}
      style={[
        styles.row,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}>
      <View style={styles.rowHeader}>
        <Text variant="subtitle">{formatDate(item.measuredAt, locale)}</Text>
        {item.endsCycle ? (
          <View style={[styles.badge, { backgroundColor: colors.accentSoft }]}>
            <Text variant="caption" color="warning">
              {t('measurements.cycleEnd')}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.metrics}>
        <View style={styles.metric}>
          <Text variant="caption" color="textTertiary">
            {t('measurements.consumption')}
          </Text>
          <Text variant="bodyStrong">{formatEnergy(item.consumption, locale)}</Text>
        </View>
        <View style={styles.metric}>
          <Text variant="caption" color="textTertiary">
            {t('measurements.production')}
          </Text>
          <Text variant="bodyStrong">{formatEnergy(item.production, locale)}</Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="title">{t('measurements.title')}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('measurements.add')}
          onPress={openNew}
          style={[styles.addButton, { backgroundColor: colors.primary }]}>
          <SymbolView
            name={{ ios: 'plus', android: 'add', web: 'add' }}
            size={22}
            tintColor={colors.onPrimary}
          />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text variant="body" color="danger">
            {error}
          </Text>
        </View>
      ) : measurements.length === 0 ? (
        <View style={styles.center}>
          <Text variant="heading">{t('measurements.empty')}</Text>
          <Text variant="body" color="textSecondary" style={styles.centerText}>
            {t('measurements.emptyHint')}
          </Text>
          <Button label={t('measurements.add')} onPress={openNew} />
        </View>
      ) : (
        <FlashList
          data={measurements}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={refresh}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { flex: 1 },
  listContent: { paddingBottom: spacing.lg },
  separator: { height: spacing.sm },
  row: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  metrics: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  metric: { gap: spacing.xs },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  centerText: { textAlign: 'center' },
});
