import { FlashList } from '@shopify/flash-list';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Select } from '@/components/ui/select';
import { SelectionHeader } from '@/components/ui/selection-header';
import { SkeletonList } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { useToast } from '@/contexts/toast';
import type { EnergyBill } from '@/domain/entities/energy-bill';
import type { Measurement } from '@/domain/entities/measurement';
import { useAgentSetup } from '@/hooks/use-agent-setup';
import { useCycles } from '@/hooks/use-cycles';
import {
  useEnergyBillActions,
  useEnergyBills,
} from '@/hooks/use-energy-bills';
import { useMeasurementActions, useMeasurements } from '@/hooks/use-measurements';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import {
  formatCurrency,
  formatDate,
  formatEnergy,
  formatShortDate,
} from '@/lib/format';
import { radius, spacing } from '@/theme';

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

type Tab = 'measurements' | 'bills';

export default function MeasurementsScreen() {
  const { colors } = useTheme();
  const { t, locale } = useTranslation();
  const toast = useToast();
  const params = useLocalSearchParams<{ tab?: string }>();
  const requireAgentSetup = useAgentSetup();
  const { measurements, loading, refreshing, error, refresh, reload } =
    useMeasurements();
  const {
    bills,
    loading: billsLoading,
    refreshing: billsRefreshing,
    error: billsError,
    refresh: refreshBills,
    reload: reloadBills,
  } = useEnergyBills();
  const { createMeasurement, deleteMeasurement, deleteMeasurements } =
    useMeasurementActions();
  const { deleteEnergyBills } = useEnergyBillActions();
  const { cycles } = useCycles();

  const tab: Tab = params.tab === 'bills' ? 'bills' : 'measurements';
  const [cycleFilter, setCycleFilter] = useState('all');
  const [endingBillId, setEndingBillId] = useState<string | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const setTab = (next: Tab) => {
    router.setParams({ tab: next });
  };

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
  const visible = useMemo(() => {
    const filtered = selectedCycle
      ? measurements.filter(
          (measurement) =>
            measurement.measuredAt.getTime() >=
              selectedCycle.start.measuredAt.getTime() &&
            measurement.measuredAt.getTime() <=
              selectedCycle.end.measuredAt.getTime(),
        )
      : measurements;

    return [...filtered].sort(
      (a, b) => b.measuredAt.getTime() - a.measuredAt.getTime(),
    );
  }, [measurements, selectedCycle]);

  const openNew = () => router.push('/measurement');
  const openNewBill = () => requireAgentSetup(() => router.push('/bill-scan'));
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

    const deletingBills = tab === 'bills';
    const ids = selectedIds;

    Alert.alert(
      deletingBills
        ? t('bills.deleteConfirmTitle')
        : t('measurements.form.deleteConfirmTitle'),
      deletingBills
        ? t('bills.deleteConfirmMessage')
        : t('measurements.form.deleteConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            const count = ids.length;
            void (async () => {
              if (deletingBills) {
                await deleteEnergyBills(ids);
                await reloadBills();
              } else {
                await deleteMeasurements(ids);
                await reload();
              }
              cancelSelection();
              toast.show(
                count === 1
                  ? t(deletingBills ? 'bills.deleted' : 'measurements.deleted')
                  : t(deletingBills ? 'bills.deletedMany' : 'measurements.deletedMany', {
                      count,
                    }),
                'success',
              );
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

  const endBillCycle = async (bill: EnergyBill) => {
    if (endingBillId) {
      return;
    }

    setEndingBillId(bill.id);
    try {
      const created = await createMeasurement({
        measuredAt: bill.readingDate ?? bill.createdAt,
        consumption: bill.activeKwh,
        production: bill.injectedKwh,
        endsCycle: true,
        restart: false,
      });
      await reload();
      toast.show(t('bills.cycleEnded'), 'success', {
        label: t('common.undo'),
        onPress: () => {
          void (async () => {
            await deleteMeasurement(created.id);
            await reload();
            toast.show(t('bills.cycleUndone'), 'info');
          })();
        },
      });
    } catch (error) {
      toast.show(
        error instanceof Error ? error.message : String(error),
        'error',
      );
    } finally {
      setEndingBillId(null);
    }
  };

  const renderBill = ({ item }: { item: EnergyBill }) => {
    const selected = selectedIds.includes(item.id);
    const billDate = item.readingDate ?? item.createdAt;
    const hasCycleEnd = measurements.some(
      (measurement) =>
        measurement.endsCycle && isSameDay(measurement.measuredAt, billDate),
    );
    const showEndCycle = !selecting && !hasCycleEnd;

    return (
      <View
        style={[
          styles.row,
          {
            backgroundColor: colors.surface,
            borderColor: selected ? colors.primary : colors.border,
          },
        ]}>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            if (selecting) {
              toggle(item.id);
            } else {
              router.push({ pathname: '/bill-review', params: { id: item.id } });
            }
          }}
          onLongPress={() => startSelection(item.id)}
          delayLongPress={250}
          style={styles.billBody}>
          <View style={styles.rowHeader}>
            <Text variant="subtitle">
              {item.readingDate
                ? formatDate(item.readingDate, locale)
                : t('bills.noDate')}
            </Text>
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
            ) : (
              <Text variant="subtitle">
                {formatCurrency(item.amountCents, locale)}
              </Text>
            )}
          </View>

          {item.distributor ? (
            <Text variant="caption" color="textSecondary">
              {item.distributor}
            </Text>
          ) : null}

          <View style={styles.metrics}>
            <View style={styles.metric}>
              <Text variant="caption" color="textTertiary">
                {t('bills.active')}
              </Text>
              <Text variant="bodyStrong">
                {formatEnergy(item.activeKwh, locale)}
              </Text>
            </View>
            <View style={styles.metric}>
              <Text variant="caption" color="textTertiary">
                {t('bills.injected')}
              </Text>
              <Text variant="bodyStrong">
                {formatEnergy(item.injectedKwh, locale)}
              </Text>
            </View>
          </View>
        </Pressable>

        {showEndCycle ? (
          <Button
            label={t('bills.endCycle')}
            variant="secondary"
            onPress={() => endBillCycle(item)}
            disabled={endingBillId === item.id}
          />
        ) : null}
      </View>
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
          <View style={styles.headerActions}>
            {tab === 'bills' ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('bills.addManual')}
                onPress={() =>
                  router.push({
                    pathname: '/bill-review',
                    params: { manual: '1' },
                  })
                }
                style={[
                  styles.addButton,
                  { backgroundColor: colors.surfaceMuted },
                ]}>
                <SymbolView
                  name={{ ios: 'plus', android: 'add', web: 'add' }}
                  size={22}
                  tintColor={colors.primary}
                />
              </Pressable>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                tab === 'bills' ? t('bills.scan') : t('measurements.add')
              }
              onPress={tab === 'bills' ? openNewBill : openNew}
              style={[styles.addButton, { backgroundColor: colors.primary }]}>
              <SymbolView
                name={
                  tab === 'bills'
                    ? {
                        ios: 'doc.viewfinder',
                        android: 'document_scanner',
                        web: 'document_scanner',
                      }
                    : { ios: 'plus', android: 'add', web: 'add' }
                }
                size={22}
                tintColor={colors.onPrimary}
              />
            </Pressable>
          </View>
        </View>
      )}

      {!selecting ? (
        <View style={styles.tabs}>
          <SegmentedControl
            value={tab}
            onChange={setTab}
            options={[
              {
                value: 'measurements',
                label: t('measurements.tabs.measurements'),
              },
              { value: 'bills', label: t('measurements.tabs.bills') },
            ]}
          />
        </View>
      ) : null}

      {tab === 'measurements' ? (
        <>
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
              <Text
                variant="body"
                color="textSecondary"
                style={styles.centerText}>
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
        </>
      ) : billsLoading ? (
        <SkeletonList />
      ) : billsError ? (
        <View style={styles.center}>
          <Text variant="body" color="danger">
            {billsError}
          </Text>
        </View>
      ) : bills.length === 0 ? (
        <View style={styles.center}>
          <Text variant="heading">{t('bills.empty')}</Text>
          <Text variant="body" color="textSecondary" style={styles.centerText}>
            {t('bills.emptyHint')}
          </Text>
          <Button label={t('bills.scan')} onPress={openNewBill} />
        </View>
      ) : (
        <FlashList
          data={bills}
          keyExtractor={(item) => item.id}
          renderItem={renderBill}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          refreshing={billsRefreshing}
          onRefresh={refreshBills}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabs: {
    marginBottom: spacing.lg,
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
  billBody: { gap: spacing.md },
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
