import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { SelectionHeader } from '@/components/ui/selection-header';
import { SkeletonList } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { useToast } from '@/contexts/toast';
import type { Cycle } from '@/domain/entities/cycle';
import { useCycles } from '@/hooks/use-cycles';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { formatDate, formatEnergy } from '@/lib/format';
import { radius, spacing } from '@/theme';

export default function CyclesScreen() {
  const { colors } = useTheme();
  const { t, locale } = useTranslation();
  const toast = useToast();
  const { cycles, loading, refreshing, error, refresh, deleteCycles } =
    useCycles();

  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const ordered = [...cycles].reverse();

  const openCycle = (id: string) =>
    router.push({ pathname: '/cycle', params: { id } });

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
      t('cycles.deleteConfirmTitle'),
      t('cycles.deleteConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            const count = selectedIds.length;
            void (async () => {
              await deleteCycles(selectedIds);
              cancelSelection();
              toast.show(
                count === 1
                  ? t('cycles.deleted')
                  : t('cycles.deletedMany', { count }),
                'success',
              );
            })();
          },
        },
      ],
    );
  };

  const renderCycle = (item: Cycle) => {
    const selected = selectedIds.includes(item.id);
    const balanceColor = item.balance >= 0 ? colors.success : colors.danger;

    return (
      <Pressable
        key={item.id}
        accessibilityRole="button"
        onPress={() => (selecting ? toggle(item.id) : openCycle(item.id))}
        onLongPress={() => startSelection(item.id)}
        delayLongPress={250}
        style={[
          styles.row,
          {
            backgroundColor: colors.surface,
            borderColor: selected ? colors.primary : colors.border,
          },
        ]}>
        <View
          style={[
            styles.badge,
            styles.badgeCorner,
            {
              backgroundColor: selecting
                ? selected
                  ? colors.primary
                  : 'transparent'
                : item.closed
                  ? colors.surfaceMuted
                  : colors.primarySoft,
              borderColor: selecting ? colors.primary : 'transparent',
            },
          ]}>
          {selecting ? (
            selected ? (
              <SymbolView
                name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                size={14}
                tintColor={colors.onPrimary}
              />
            ) : null
          ) : (
            <Text
              variant="caption"
              color={item.closed ? 'textSecondary' : 'primary'}>
              {item.closed ? t('cycles.closed') : t('cycles.current')}
            </Text>
          )}
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
      {selecting ? (
        <SelectionHeader
          count={selectedIds.length}
          onCancel={cancelSelection}
          onDelete={confirmDelete}
        />
      ) : (
        <View style={styles.header}>
          <Text variant="title">{t('cycles.title')}</Text>
        </View>
      )}

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
    minWidth: 28,
    minHeight: 28,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
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
