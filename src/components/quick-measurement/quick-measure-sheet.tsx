import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';

import { Button } from '@/components/ui/button';
import { NumberField } from '@/components/ui/number-field';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { formatNumber, formatShortDate } from '@/lib/format';
import { radius, spacing } from '@/theme';

import { PrototypeStage } from './prototype-stage';
import { QuickMeasureSuccess } from './quick-measure-success';
import { useQuickMeasureMock } from './use-quick-measure-mock';

/**
 * Variant B — floating action button that opens a bottom sheet. The dashboard
 * stays visible behind and the entry happens in a single surface.
 */
export function QuickMeasureSheet() {
  const { colors } = useTheme();
  const { t, locale } = useTranslation();
  const mock = useQuickMeasureMock();
  const [open, setOpen] = useState(false);
  const today = formatShortDate(new Date(), locale);

  const close = () => {
    setOpen(false);
    mock.reset();
  };

  return (
    <PrototypeStage
      overlay={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('dev.quickMeasure.fab')}
          onPress={() => setOpen(true)}
          style={({ pressed }) => [
            styles.fab,
            { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 },
          ]}>
          <SymbolView
            name={{ ios: 'plus', android: 'add', web: 'add' }}
            size={26}
            tintColor={colors.onPrimary}
          />
        </Pressable>
      }>
      <View
        style={[
          styles.hintCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}>
        <Text variant="caption" color="textSecondary">
          {t('dev.quickMeasure.sheetHint')}
        </Text>
      </View>

      <Modal
        visible={open}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={close}>
        <GestureHandlerRootView style={styles.flex}>
        <View style={styles.modal}>
          <Animated.View
            entering={FadeIn.duration(180)}
            style={styles.backdrop}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('dev.quickMeasure.close')}
            onPress={close}
            style={StyleSheet.absoluteFill}
          />

          <Animated.View
            entering={SlideInDown.duration(220)}
            style={[
              styles.sheet,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <View
              style={[styles.handle, { backgroundColor: colors.borderStrong }]}
            />

            {mock.phase === 'saved' ? (
              <QuickMeasureSuccess
                savedAt={mock.savedAt}
                consumption={mock.consumption}
                production={mock.production}
                consumptionDelta={mock.consumptionDelta}
                productionDelta={mock.productionDelta}
                onUndo={mock.undo}
                onReset={close}
              />
            ) : (
              <>
                <View style={styles.sheetHeader}>
                  <View style={styles.sheetHeaderText}>
                    <Text variant="heading">
                      {t('dev.quickMeasure.sheetTitle')}
                    </Text>
                    <Text variant="caption" color="textSecondary">
                      {t('dev.quickMeasure.today', { date: today })}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('dev.quickMeasure.close')}
                    onPress={close}
                    style={[
                      styles.close,
                      { backgroundColor: colors.surfaceMuted },
                    ]}>
                    <SymbolView
                      name={{ ios: 'xmark', android: 'close', web: 'close' }}
                      size={18}
                      tintColor={colors.textSecondary}
                    />
                  </Pressable>
                </View>

                <NumberField
                  label={t('dev.quickMeasure.consumption')}
                  value={mock.consumption}
                  onChange={mock.setConsumption}
                  min={mock.last.consumption}
                  unit="kWh"
                />
                <NumberField
                  label={t('dev.quickMeasure.production')}
                  value={mock.production}
                  onChange={mock.setProduction}
                  min={mock.last.production}
                  unit="kWh"
                />

                <Text variant="caption" color="textTertiary">
                  {t('dev.quickMeasure.delta', {
                    consumption: `+${formatNumber(
                      mock.consumptionDelta,
                      locale,
                    )}`,
                    production: `+${formatNumber(mock.productionDelta, locale)}`,
                  })}
                </Text>

                <Button
                  label={
                    mock.phase === 'saving'
                      ? t('dev.quickMeasure.saving')
                      : t('dev.quickMeasure.save')
                  }
                  onPress={mock.save}
                  disabled={!mock.valid || mock.phase === 'saving'}
                />
                <Button
                  label={t('dev.quickMeasure.notNow')}
                  variant="ghost"
                  onPress={close}
                />
              </>
            )}
          </Animated.View>
        </View>
        </GestureHandlerRootView>
      </Modal>
    </PrototypeStage>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    minHeight: 96,
  },
  modal: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#00000080',
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
    gap: spacing.md,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radius.pill,
    marginBottom: spacing.xs,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  sheetHeaderText: { flex: 1, gap: 2 },
  close: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
