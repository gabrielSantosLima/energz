import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { useBillParser } from '@/hooks/use-bill-parser';
import { useBillDraftStore } from '@/store/bill-draft-store';
import { useBillScanStore } from '@/store/bill-scan-store';
import { useDevStore } from '@/store/dev-store';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { radius, spacing } from '@/theme';

export default function DevScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const devMode = useDevStore((state) => state.devMode);
  const scan = useBillScanStore((state) => state.scan);
  const resetScan = useBillScanStore((state) => state.resetScan);
  const parseError = useBillDraftStore((state) => state.parseError);
  const resetDraft = useBillDraftStore((state) => state.resetDraft);
  const { parse } = useBillParser();
  const [parseResult, setParseResult] = useState<{
    json: string;
    latencyMs: number;
    usage: string;
  } | null>(null);
  const [parsing, setParsing] = useState(false);

  const runParser = async () => {
    if (!scan.rawText || parsing) {
      return;
    }
    setParsing(true);
    setParseResult(null);
    resetDraft();
    try {
      const result = await parse(scan.rawText);
      if (result) {
        setParseResult({
          json: JSON.stringify(result.draft, null, 2),
          latencyMs: result.latencyMs,
          usage: result.usage
            ? `${result.usage.promptTokens ?? '?'} / ${
                result.usage.completionTokens ?? '?'
              } / ${result.usage.totalTokens ?? '?'}`
            : '—',
        });
      }
    } finally {
      setParsing(false);
    }
  };

  if (!devMode) {
    return (
      <Screen>
        <Text variant="body" color="textSecondary">
          {t('dev.off')}
        </Text>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Text variant="title">{t('dev.title')}</Text>

      <View style={styles.actions}>
        <Button label={t('dev.scan')} onPress={() => router.push('/bill-scan')} />
        <Button
          label={t('dev.parse')}
          onPress={runParser}
          disabled={!scan.rawText || parsing}
        />
        <Button
          label={t('dev.clear')}
          onPress={() => {
            resetScan();
            resetDraft();
            setParseResult(null);
          }}
          variant="secondary"
        />
      </View>

      {scan.error ? (
        <Text variant="body" color="danger">
          {scan.error}
        </Text>
      ) : null}

      {scan.processMs !== null ? (
        <Text variant="caption" color="textTertiary">
          {`${t('dev.process')}: ${scan.processMs} ms${
            scan.detected ? ` · ${t('dev.detected')}` : ''
          }`}
        </Text>
      ) : null}

      {scan.ocrMs !== null ? (
        <Text variant="caption" color="textTertiary">
          {`OCR: ${scan.ocrMs} ms`}
        </Text>
      ) : null}

      <Text variant="label" color="textSecondary">
        {t('dev.original')}
      </Text>
      {scan.originalUri ? (
        <Image
          source={{ uri: scan.originalUri }}
          style={[styles.image, { borderColor: colors.border }]}
          contentFit="contain"
        />
      ) : (
        <Text variant="caption" color="textTertiary">
          —
        </Text>
      )}

      <Text variant="label" color="textSecondary">
        {t('dev.processed')}
      </Text>
      {scan.processedUri ? (
        <Image
          source={{ uri: scan.processedUri }}
          style={[styles.image, { borderColor: colors.border }]}
          contentFit="contain"
        />
      ) : (
        <Text variant="caption" color="textTertiary">
          —
        </Text>
      )}

      <Text variant="label" color="textSecondary">
        {t('dev.rawText')}
      </Text>
      <View
        style={[
          styles.textBox,
          { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
        ]}>
        <Text variant="caption" selectable>
          {scan.rawText || '—'}
        </Text>
      </View>

      <Text variant="label" color="textSecondary">
        {t('dev.agentResult')}
      </Text>
      {parseError ? (
        <Text variant="caption" color="danger">
          {parseError}
        </Text>
      ) : null}
      {parseResult ? (
        <>
          <Text variant="caption" color="textTertiary">
            {`${t('dev.latency')}: ${parseResult.latencyMs} ms · ${t(
              'dev.usage',
            )}: ${parseResult.usage}`}
          </Text>
          <View
            style={[
              styles.textBox,
              {
                backgroundColor: colors.surfaceMuted,
                borderColor: colors.border,
              },
            ]}>
            <Text variant="caption" selectable>
              {parseResult.json}
            </Text>
          </View>
        </>
      ) : (
        <Text variant="caption" color="textTertiary">
          —
        </Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: radius.lg,
    borderWidth: 1,
    backgroundColor: '#00000010',
  },
  textBox: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    minHeight: 120,
  },
});
