import { useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { ReportPreview } from '@/components/reports/report-preview';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { ThemeOverride } from '@/contexts/theme-context';
import { useReport } from '@/hooks/use-report';
import { useTranslation } from '@/hooks/use-translation';
import { formatShortDate } from '@/lib/format';
import { lightColors, radius, spacing } from '@/theme';

export default function ReportsScreen() {
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
      <Text variant="title">{t('reports.title')}</Text>

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
  filter: {
    marginTop: spacing.lg,
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
