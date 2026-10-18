import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Select } from '@/components/ui/select';
import { SelectionHeader } from '@/components/ui/selection-header';
import { SkeletonList } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import type { Measurement } from '@/domain/entities/measurement';
import { useCycles } from '@/hooks/use-cycles';
import { useMeasurementActions, useMeasurements } from '@/hooks/use-measurements';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { formatDate, formatEnergy, formatShortDate } from '@/lib/format';
import { radius, spacing } from '@/theme';

export default function MeasurementsScreen() {
  const { colors } = useTheme();
  const { t, locale } = useTranslation();
  const { measurements, loading, refreshing, error, refresh, reload } =
    useMeasurements();
  const { deleteMeasurements } = useMeasurementActions();
  const { cycles } = useCycles();

  const [cycleFilter, setCycleFilter] = useState('all');
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const cycleOptions = useMemo(
    () => [
      { value: 'all', label: t('measurements.allCycles') },
      ...cycles.map((cycle, index) => ({
        value: cycle.id,
        label: cycle.closed
          ? t('cycles.tag', {
              n: index + 1,
              date: formatShortDate(cycle.end.measuredAt, locale),
            })
          : t('cycles.currentChip'),
      })),
    ],
    [cycles, t, locale],
  );

  const selectedCycle = cycles.find((cycle) => cycle.id === cycleFilter) ?? null;
  const visible = selectedCycle
    ? measurements.filter(
        (measurement) =>
          measurement.measuredAt.getTime() >=
            selectedCycle.start.measuredAt.getTime() &&
          measurement.measuredAt.getTime() <=
            selectedCycle.end.measuredAt.getTime(),
      )
    : measurements;

  const openNew = () => router.push('/measurement');
  const openMeasurement = (id: string) =>
    router.push({ pathname: '/measurement', params: { id } });

  const toggle = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );

  const startSelection = (id: string) => {
    setSelecting(true);
    setSelectedIds([id]);
  };

  const cancelSelection = () => {
    setSelecting(false);
    setSelectedIds([]);
  };

  const confirmDelete = () => {
    if (selectedIds.length === 0) {
      return;
    }
    Alert.alert(
      t('measurements.form.deleteConfirmTitle'),
      t('measurements.form.deleteConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            void (async () => {
              await deleteMeasurements(selectedIds);
              await reload();
              cancelSelection();
            })();
          },
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: Measurement }) => {
    const selected = selectedIds.includes(item.id);

    return (
      <Pressable
        accessibilityRole="button"
        onPress={() => (selecting ? toggle(item.id) : openMeasurement(item.id))}
        onLongPress={() => startSelection(item.id)}
        delayLongPress={250}
        style={[
          styles.row,
          {
            backgroundColor: colors.surface,
            borderColor: selected ? colors.primary : colors.border,
          },
        ]}>
        <View style={styles.rowHeader}>
          <Text variant="subtitle">{formatDate(item.measuredAt, locale)}</Text>
          {selecting ? (
            <View
              style={[
                styles.check,
                {
                  borderColor: selected ? colors.primary : colors.border,
                  backgroundColor: selected ? colors.primary : 'transparent',
                },
              ]}>
              {selected ? (
                <SymbolView
                  name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                  size={14}
                  tintColor={colors.onPrimary}
                />
              ) : null}
            </View>
          ) : item.endsCycle ? (
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
            <Text variant="bodyStrong">
              {formatEnergy(item.consumption, locale)}
            </Text>
          </View>
          <View style={styles.metric}>
            <Text variant="caption" color="textTertiary">
              {t('measurements.production')}
            </Text>
            <Text variant="bodyStrong">
              {formatEnergy(item.production, locale)}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <Screen>
      {selecting ? (
        <SelectionHeader
          count={selectedIds.length}
          onCancel={cancelSelection}
          onDelete={confirmDelete}
        />
      ) : (
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
      )}

      {cycles.length > 0 && !selecting ? (
        <View style={styles.filter}>
          <Select
            options={cycleOptions}
            value={cycleFilter}
            onChange={setCycleFilter}
          />
        </View>
      ) : null}

      {loading ? (
        <SkeletonList />
      ) : error ? (
        <View style={styles.center}>
          <Text variant="body" color="danger">
            {error}
          </Text>
        </View>
      ) : visible.length === 0 ? (
        <View style={styles.center}>
          <Text variant="heading">{t('measurements.empty')}</Text>
          <Text variant="body" color="textSecondary" style={styles.centerText}>
            {t('measurements.emptyHint')}
          </Text>
          <Button label={t('measurements.add')} onPress={openNew} />
        </View>
      ) : (
        <FlashList
          data={visible}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          extraData={selectedIds}
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
  filter: {
    marginBottom: spacing.lg,
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
  check: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
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
