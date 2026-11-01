import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useMemo, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ReportPreview } from '@/components/reports/report-preview';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { ThemeOverride } from '@/contexts/theme-context';
import { useReport } from '@/hooks/use-report';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { formatShortDate } from '@/lib/format';
import { lightColors, radius, spacing } from '@/theme';

export default function MeasurementsReportScreen() {
  const { colors } = useTheme();
  const { t, locale } = useTranslation();
  const {
    cycles,
    cycleId,
    setCycleId,
    report,
    loading,
    exporting,
    exportPdf,
    exportImage,
  } = useReport();
  const captureRef = useRef<View>(null);

  const options = useMemo(
    () =>
      cycles.map((cycle, index) => ({
        value: cycle.id,
        label: cycle.closed
          ? t('cycles.tag', {
              n: index + 1,
              date: formatShortDate(cycle.end.measuredAt, locale),
            })
          : t('cycles.currentChip'),
      })),
    [cycles, t, locale],
  );

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          onPress={() => router.back()}
          style={[styles.back, { backgroundColor: colors.surfaceMuted }]}>
          <SymbolView
            name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
            size={20}
            tintColor={colors.textPrimary}
          />
        </Pressable>
        <View style={styles.headerText}>
          <Text variant="title">{t('reports.measurementsTitle')}</Text>
          <Text variant="caption" color="textSecondary">
            {t('reports.measurementsSubtitle')}
          </Text>
        </View>
      </View>

      {cycles.length > 0 ? (
        <View style={styles.filter}>
          <Select
            options={options}
            value={cycleId ?? ''}
            onChange={setCycleId}
          />
        </View>
      ) : null}

      {loading || !report ? (
        <Skeleton height={360} round={radius.xl} style={styles.preview} />
      ) : (
        <>
          <View style={styles.preview}>
            <ReportPreview report={report} />
          </View>
          <View style={styles.exportHost} pointerEvents="none">
            <ThemeOverride value={{ isDark: false, colors: lightColors }}>
              <ReportPreview report={report} captureRef={captureRef} />
            </ThemeOverride>
          </View>
        </>
      )}

      <View style={styles.actions}>
        <Button
          label={t('reports.exportPdf')}
          onPress={exportPdf}
          disabled={exporting || !report}
        />
        <Button
          label={t('reports.exportImage')}
          onPress={() => exportImage(captureRef)}
          disabled={exporting || !report}
          variant="secondary"
        />
      </View>
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
  headerText: {
    flex: 1,
    gap: spacing.xs,
  },
  filter: {
    marginTop: 0,
  },
  preview: {
    marginTop: spacing.lg,
  },
  exportHost: {
    position: 'absolute',
    left: -10000,
    top: 0,
    width: '100%',
  },
  actions: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
});
