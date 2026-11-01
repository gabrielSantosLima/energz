import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BillReportPreview } from '@/components/reports/bill-report-preview';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { ThemeOverride } from '@/contexts/theme-context';
import { useBillReport } from '@/hooks/use-bill-report';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { lightColors, radius, spacing } from '@/theme';

export default function BillsReportScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { report, loading, exporting, exportPdf, exportImage } =
    useBillReport();
  const captureRef = useRef<View>(null);

  const empty = !loading && report?.bills.length === 0;
  const disabled = exporting || !report || empty;

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
          <Text variant="title">{t('reports.billsTitle')}</Text>
          <Text variant="caption" color="textSecondary">
            {t('reports.billsSubtitle')}
          </Text>
        </View>
      </View>

      {loading || !report ? (
        <Skeleton height={320} round={radius.xl} style={styles.preview} />
      ) : empty ? (
        <View
          style={[
            styles.empty,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}>
          <Text variant="body" color="textSecondary">
            {t('reports.billsEmpty')}
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.preview}>
            <BillReportPreview report={report} />
          </View>
          <View style={styles.exportHost} pointerEvents="none">
            <ThemeOverride value={{ isDark: false, colors: lightColors }}>
              <BillReportPreview report={report} captureRef={captureRef} />
            </ThemeOverride>
          </View>
        </>
      )}

      <View style={styles.actions}>
        <Button
          label={t('reports.exportPdf')}
          onPress={exportPdf}
          disabled={disabled}
        />
        <Button
          label={t('reports.exportImage')}
          onPress={() => exportImage(captureRef)}
          disabled={disabled}
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
  preview: {
    marginTop: 0,
  },
  empty: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
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
