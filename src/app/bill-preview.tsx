import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { BillImageProcessor } from '@/domain/services/bill-image-processor';
import { useBillParser } from '@/hooks/use-bill-parser';
import { useInjection } from '@/hooks/use-injection';
import { useSafeNavigation } from '@/hooks/use-safe-navigation';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { useBillDraftStore } from '@/store/bill-draft-store';
import { useBillScanStore } from '@/store/bill-scan-store';
import { useDevStore } from '@/store/dev-store';
import { radius, spacing } from '@/theme';

const SLOW_REQUEST_MS = 30_000;

export default function BillPreviewScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const processor = useInjection(BillImageProcessor);
  const navigate = useSafeNavigation();
  const { parse } = useBillParser();
  const resetDraft = useBillDraftStore((state) => state.resetDraft);
  const draft = useBillDraftStore((state) => state.draft);
  const scan = useBillScanStore((state) => state.scan);
  const setScan = useBillScanStore((state) => state.setScan);
  const devMode = useDevStore((state) => state.devMode);
  const [processing, setProcessing] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [slow, setSlow] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const slowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSlowTimer = () => {
    if (slowTimerRef.current) {
      clearTimeout(slowTimerRef.current);
      slowTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearSlowTimer();
      abortRef.current?.abort();
    };
  }, []);

  const rotate = async (degrees: number) => {
    if (!scan.processedUri || rotating || processing) {
      return;
    }

    setRotating(true);
    setScan({ error: null });

    try {
      const uri = await processor.rotate(scan.processedUri, degrees);
      setScan({ processedUri: uri });
    } catch (error) {
      setScan({
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setRotating(false);
    }
  };

  const proceed = async () => {
    if (!scan.processedUri || processing || rotating) {
      return;
    }

    const processedUri = scan.processedUri;

    // The same photo was already processed: keep the previous result instead
    // of running OCR and the AI request again.
    if (scan.parsedUri === processedUri && (devMode || draft)) {
      navigate(devMode ? '/dev' : '/bill-review');
      return;
    }

    setProcessing(true);
    setSlow(false);
    setScan({ error: null });
    resetDraft();

    const controller = new AbortController();
    abortRef.current = controller;
    slowTimerRef.current = setTimeout(
      () => setSlow(true),
      SLOW_REQUEST_MS,
    );

    try {
      const startedAt = Date.now();
      const text = await processor.recognizeText(processedUri);

      if (controller.signal.aborted) {
        return;
      }

      setScan({ rawText: text, ocrMs: Date.now() - startedAt });

      if (!devMode) {
        const result = await parse(
          text,
          processedUri,
          controller.signal,
        );

        if (controller.signal.aborted) {
          return;
        }

        if (result) {
          setScan({ parsedUri: processedUri });
        }
      } else {
        setScan({ parsedUri: processedUri });
      }

      navigate(devMode ? '/dev' : '/bill-review');
    } catch (error) {
      if (!controller.signal.aborted) {
        setScan({
          error: error instanceof Error ? error.message : String(error),
        });
      }
    } finally {
      // Ignore the cleanup of a canceled attempt that was already replaced by a
      // newer one.
      if (abortRef.current === controller) {
        clearSlowTimer();
        abortRef.current = null;
        setSlow(false);
        setProcessing(false);
      }
    }
  };

  const cancel = () => {
    abortRef.current?.abort();
    clearSlowTimer();
    setSlow(false);
    setProcessing(false);
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
        <View style={styles.rotateRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('billPreview.rotateLeft')}
            disabled={rotating || processing}
            onPress={() => void rotate(-90)}
            style={({ pressed }) => [
              styles.rotateButton,
              { opacity: pressed ? 0.8 : 1 },
            ]}>
            <SymbolView
              name={{
                ios: 'rotate.left',
                android: 'rotate_left',
                web: 'rotate_left',
              }}
              size={22}
              tintColor="#FFFFFF"
            />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('billPreview.rotateRight')}
            disabled={rotating || processing}
            onPress={() => void rotate(90)}
            style={({ pressed }) => [
              styles.rotateButton,
              { opacity: pressed ? 0.8 : 1 },
            ]}>
            <SymbolView
              name={{
                ios: 'rotate.right',
                android: 'rotate_right',
                web: 'rotate_right',
              }}
              size={22}
              tintColor="#FFFFFF"
            />
          </Pressable>
        </View>

        <Button
          label={t('billPreview.retake')}
          variant="secondary"
          onPress={() => router.back()}
        />
        <Button
          label={t('billPreview.usePhoto')}
          onPress={proceed}
          disabled={rotating}
        />
      </View>

      {processing || rotating ? (
        <View style={styles.overlay}>
          <ActivityIndicator color="#FFFFFF" />
          <Text variant="caption" style={styles.whiteText}>
            {rotating
              ? t('billPreview.rotating')
              : t('billPreview.processing')}
          </Text>

          {slow && processing ? (
            <View style={styles.slowBlock}>
              <Text variant="caption" style={styles.whiteText}>
                {t('billPreview.slow')}
              </Text>
              <Button
                label={t('billPreview.cancel')}
                variant="secondary"
                onPress={cancel}
                style={styles.cancelButton}
              />
            </View>
          ) : null}
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
  rotateRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
  },
  rotateButton: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
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
  slowBlock: {
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  cancelButton: {
    minWidth: 200,
  },
});
