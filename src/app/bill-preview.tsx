import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { BillImageProcessor } from '@/domain/services/bill-image-processor';
import { useInjection } from '@/hooks/use-injection';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { useBillScanStore } from '@/store/bill-scan-store';
import { useDevStore } from '@/store/dev-store';
import { radius, spacing } from '@/theme';

export default function BillPreviewScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const processor = useInjection(BillImageProcessor);
  const scan = useBillScanStore((state) => state.scan);
  const setScan = useBillScanStore((state) => state.setScan);
  const devMode = useDevStore((state) => state.devMode);
  const [processing, setProcessing] = useState(false);

  const proceed = async () => {
    if (!scan.processedUri || processing) {
      return;
    }
    setProcessing(true);
    setScan({ error: null });
    try {
      const startedAt = Date.now();
      const text = await processor.recognizeText(scan.processedUri);
      setScan({ rawText: text, ocrMs: Date.now() - startedAt });
      router.push(devMode ? '/dev' : '/bill-review');
    } catch (error) {
      setScan({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      setProcessing(false);
    }
  };

  if (!scan.processedUri) {
    return (
      <View
        style={[
          styles.flex,
          styles.center,
          { backgroundColor: colors.background },
        ]}>
        <Text variant="body" color="textSecondary" style={styles.centerText}>
          {t('billPreview.missing')}
        </Text>
        <Button
          label={t('billPreview.backToCamera')}
          onPress={() => router.replace('/bill-scan')}
        />
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Image
        source={{ uri: scan.processedUri }}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('common.back')}
        onPress={() => router.back()}
        style={[styles.back, { top: insets.top + spacing.sm }]}>
        <SymbolView
          name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
          size={22}
          tintColor="#FFFFFF"
        />
      </Pressable>

      <View
        style={[
          styles.actions,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}>
        {scan.error ? (
          <Text variant="caption" color="danger">
            {scan.error}
          </Text>
        ) : null}
        <Button
          label={t('billPreview.retake')}
          variant="secondary"
          onPress={() => router.back()}
        />
        <Button label={t('billPreview.usePhoto')} onPress={proceed} />
      </View>

      {processing ? (
        <View style={styles.overlay}>
          <ActivityIndicator color="#FFFFFF" />
          <Text variant="caption" style={styles.whiteText}>
            {t('billPreview.processing')}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  centerText: { textAlign: 'center' },
  back: {
    position: 'absolute',
    left: spacing.lg,
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  actions: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  whiteText: { color: '#FFFFFF' },
});
