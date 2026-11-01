import { StyleSheet, View } from 'react-native';

import { NumberField } from '@/components/ui/number-field';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { formatNumber, formatShortDate } from '@/lib/format';
import { radius, spacing } from '@/theme';

import { PrototypeStage } from './prototype-stage';
import { QuickMeasureSuccess } from './quick-measure-success';
import { useQuickMeasureMock } from './use-quick-measure-mock';

/**
 * Variant A — inline card. The user fills the two values right on the
 * dashboard, without leaving or opening anything.
 */
export function QuickMeasureInline() {
  const { colors } = useTheme();
  const { t, locale } = useTranslation();
  const mock = useQuickMeasureMock();
  const today = formatShortDate(new Date(), locale);

  return (
    <PrototypeStage>
      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}>
        {mock.phase === 'saved' ? (
          <QuickMeasureSuccess
            savedAt={mock.savedAt}
            consumption={mock.consumption}
            production={mock.production}
            consumptionDelta={mock.consumptionDelta}
            productionDelta={mock.productionDelta}
            onUndo={mock.undo}
            onReset={mock.reset}
          />
        ) : (
          <>
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text variant="subtitle">
                  {t('dev.quickMeasure.inlineTitle')}
                </Text>
                <Text variant="caption" color="textSecondary">
                  {t('dev.quickMeasure.inlineHint')}
                </Text>
              </View>
              <View
                style={[
                  styles.dateChip,
                  { backgroundColor: colors.surfaceMuted },
                ]}>
                <Text variant="caption" color="textSecondary">
                  {t('dev.quickMeasure.today', { date: today })}
                </Text>
              </View>
            </View>

            <View style={styles.inputs}>
              <View style={styles.inputCell}>
                <NumberField
                  label={t('dev.quickMeasure.consumption')}
                  value={mock.consumption}
                  onChange={mock.setConsumption}
                  min={mock.last.consumption}
                  unit="kWh"
                />
              </View>
              <View style={styles.inputCell}>
                <NumberField
                  label={t('dev.quickMeasure.production')}
                  value={mock.production}
                  onChange={mock.setProduction}
                  min={mock.last.production}
                  unit="kWh"
                />
              </View>
            </View>

            <Text variant="caption" color="textTertiary">
              {t('dev.quickMeasure.lastReading', {
                consumption: formatNumber(mock.last.consumption, locale),
                production: formatNumber(mock.last.production, locale),
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
          </>
        )}
      </View>
    </PrototypeStage>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  headerText: { flex: 1, gap: 2 },
  dateChip: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  inputs: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  inputCell: { flex: 1 },
});
