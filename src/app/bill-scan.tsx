import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OcrWebView } from '@/components/bill/ocr-webview';
import { Text } from '@/components/ui/text';
import { BillImageProcessor } from '@/domain/services/bill-image-processor';
import { useInjection } from '@/hooks/use-injection';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { mapGuideToPhoto, getContainRect } from '@/lib/photo-crop';
import { useDevStore } from '@/store/dev-store';
import { radius, spacing } from '@/theme';

const PREVIEW_ASPECT = 3 / 4;
const OCR_LANG = 'por';

export default function BillScanScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const processor = useInjection(BillImageProcessor);
  const cameraRef = useRef<CameraView>(null);
  const ocrStartedAt = useRef(0);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [ocrBase64, setOcrBase64] = useState<string | null>(null);
  const [viewSize, setViewSize] = useState({ width: 0, height: 0 });
  const [guideRect, setGuideRect] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const previewRect = getContainRect(viewSize, PREVIEW_ASPECT);
  const guideLayout =
    previewRect.width > 0
      ? {
          position: 'absolute' as const,
          left: previewRect.x + previewRect.width * 0.05,
          top: previewRect.y + previewRect.height * 0.06,
          width: previewRect.width * 0.9,
          height: previewRect.height * 0.88,
        }
      : null;
  const setScan = useDevStore((state) => state.setScan);
  const resetScan = useDevStore((state) => state.resetScan);

  const onViewLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setViewSize({ width, height });
  };

  const onGuideLayout = (event: LayoutChangeEvent) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    setGuideRect({ x, y, width, height });
  };

  const capture = async () => {
    if (!cameraRef.current || !cameraReady || processing) {
      return;
    }
    setProcessing(true);
    resetScan();
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.9 });
      if (!photo) {
        throw new Error('Could not capture the photo.');
      }
      const crop = mapGuideToPhoto(
        guideRect,
        viewSize,
        { width: photo.width, height: photo.height },
      );
      setScan({ originalUri: photo.uri });
      const startedAt = Date.now();
      const processed = await processor.enhance(photo.uri, crop);
      setScan({
        processedUri: processed.uri,
        processMs: Date.now() - startedAt,
        detected: processed.detected,
      });
      ocrStartedAt.current = Date.now();
      setOcrBase64(processed.base64);
    } catch (error) {
      setScan({ error: error instanceof Error ? error.message : String(error) });
      setProcessing(false);
    }
  };

  const finishOcr = (text: string) => {
    setScan({ rawText: text, ocrMs: Date.now() - ocrStartedAt.current });
    setProcessing(false);
    setOcrBase64(null);
    router.replace('/dev');
  };

  if (!permission) {
    return <View style={[styles.flex, { backgroundColor: colors.background }]} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text variant="body" color="textSecondary" style={styles.centerText}>
          {t('billScan.permission')}
        </Text>
        <Pressable onPress={requestPermission} accessibilityRole="button">
          <Text variant="label" color="primary">
            {t('billScan.grant')}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.flex} onLayout={onViewLayout}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        ratio="4:3"
        enableTorch={torchOn}
        onCameraReady={() => setCameraReady(true)}
      />

      <View pointerEvents="none" style={styles.overlay}>
        {guideLayout ? (
          <View
            style={[styles.guide, guideLayout]}
            onLayout={onGuideLayout}
          />
        ) : null}
      </View>

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

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          torchOn ? t('billScan.flashOff') : t('billScan.flashOn')
        }
        onPress={() => setTorchOn((value) => !value)}
        style={[styles.flash, { top: insets.top + spacing.sm }]}>
        <SymbolView
          name={{
            ios: torchOn ? 'bolt.fill' : 'bolt.slash.fill',
            android: torchOn ? 'flash_on' : 'flash_off',
            web: torchOn ? 'flash_on' : 'flash_off',
          }}
          size={22}
          tintColor="#FFFFFF"
        />
      </Pressable>

      <View
        pointerEvents="box-none"
        style={[styles.bottom, { paddingBottom: insets.bottom + spacing.xl }]}>
        {processing || !cameraReady ? (
          <View style={styles.processing}>
            <ActivityIndicator color="#FFFFFF" />
            {processing ? (
              <Text variant="caption" style={styles.whiteText}>
                {t('billScan.processing')}
              </Text>
            ) : null}
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('billScan.capture')}
            onPress={capture}
            style={styles.shutter}
          />
        )}
      </View>

      {ocrBase64 ? (
        <OcrWebView
          imageBase64={ocrBase64}
          lang={OCR_LANG}
          onResult={finishOcr}
          onError={(message) => {
            setScan({ error: message });
            setProcessing(false);
            setOcrBase64(null);
            router.replace('/dev');
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  centerText: { textAlign: 'center' },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guide: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
    borderRadius: radius.lg,
  },
  back: {
    position: 'absolute',
    left: spacing.lg,
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  flash: {
    position: 'absolute',
    right: spacing.lg,
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  shutter: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  processing: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  whiteText: { color: '#FFFFFF' },
});
