import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { TextInput } from '@/components/ui/text-input';
import { useToast } from '@/contexts/toast';
import { useEnergyBillActions } from '@/hooks/use-energy-bills';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { useBillDraftStore } from '@/store/bill-draft-store';
import { useBillScanStore } from '@/store/bill-scan-store';
import { radius, spacing } from '@/theme';

function parseDecimal(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  if (!normalized) {
    return null;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return null;
  }
  const date = new Date(`${trimmed}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export default function BillReviewScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { saveEnergyBill } = useEnergyBillActions();
  const scan = useBillScanStore((state) => state.scan);
  const draft = useBillDraftStore((state) => state.draft);
  const parseError = useBillDraftStore((state) => state.parseError);

  const [amount, setAmount] = useState(
    draft?.amountCents != null ? (draft.amountCents / 100).toFixed(2) : '',
  );
  const [activeKwh, setActiveKwh] = useState(
    draft?.activeKwh != null ? String(draft.activeKwh) : '',
  );
  const [injectedKwh, setInjectedKwh] = useState(
    draft?.injectedKwh != null ? String(draft.injectedKwh) : '',
  );
  const [date, setDate] = useState(draft?.readingDate ?? '');
  const [distributor, setDistributor] = useState(draft?.distributor ?? '');
  const [flag, setFlag] = useState(draft?.flag ?? '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const amountCents = (() => {
    const value = parseDecimal(amount);
    return value === null ? null : Math.round(value * 100);
  })();
  const activeKwhValue = parseDecimal(activeKwh);
  const injectedKwhValue = parseDecimal(injectedKwh);
  const canSave =
    amountCents !== null &&
    activeKwhValue !== null &&
    injectedKwhValue !== null &&
    !saving;

  const save = async () => {
    if (!canSave) {
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      await saveEnergyBill({
        distributor: distributor.trim() || null,
        readingDate: parseDate(date),
        amountCents,
        activeKwh: activeKwhValue,
        injectedKwh: injectedKwhValue,
        charges: draft?.charges ?? [],
        flag: flag.trim() || null,
      });
      toast.show(t('billReview.saved'), 'success');
      router.replace({ pathname: '/measurements', params: { tab: 'bills' } });
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  };

  const padding = {
    paddingTop: insets.top + spacing.lg,
    paddingBottom: insets.bottom + spacing.xl,
    paddingHorizontal: spacing.lg,
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.content, padding]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            onPress={() => router.back()}
            style={[styles.back, { backgroundColor: colors.surfaceMuted }]}>
            <SymbolView
              name={{
                ios: 'chevron.left',
                android: 'arrow_back',
                web: 'arrow_back',
              }}
              size={20}
              tintColor={colors.textPrimary}
            />
          </Pressable>
          <View style={styles.headerText}>
            <Text variant="title">{t('billReview.title')}</Text>
            <Text variant="caption" color="textSecondary">
              {t('billReview.subtitle')}
            </Text>
          </View>
        </View>

        {scan.processedUri ? (
          <Image
            source={{ uri: scan.processedUri }}
            style={[
              styles.image,
              { borderColor: colors.border, backgroundColor: colors.surfaceMuted },
            ]}
            contentFit="contain"
          />
        ) : null}

        <View
          style={[
            styles.notice,
            { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
          ]}>
          <Text variant="caption" color="textSecondary">
            {t('billReview.parserNotice')}
          </Text>
        </View>

        {parseError ? (
          <View
            style={[
              styles.notice,
              { backgroundColor: colors.surfaceMuted, borderColor: colors.danger },
            ]}>
            <Text variant="caption" color="danger">
              {t('billReview.parseError')}
            </Text>
            <Text variant="caption" color="textSecondary">
              {parseError}
            </Text>
          </View>
        ) : null}

        <TextInput
          label={t('billReview.amount')}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0,00"
        />

        <TextInput
          label={t('billReview.activeKwh')}
          value={activeKwh}
          onChangeText={setActiveKwh}
          keyboardType="number-pad"
          placeholder="0"
        />

        <TextInput
          label={t('billReview.injectedKwh')}
          value={injectedKwh}
          onChangeText={setInjectedKwh}
          keyboardType="number-pad"
          placeholder="0"
        />

        <TextInput
          label={t('billReview.date')}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          autoCapitalize="none"
        />

        <TextInput
          label={t('billReview.distributor')}
          value={distributor}
          onChangeText={setDistributor}
          placeholder="—"
        />

        <TextInput
          label={t('billReview.flag')}
          value={flag}
          onChangeText={setFlag}
          placeholder="—"
        />

        <View style={styles.section}>
          <Text variant="label" color="textSecondary">
            {t('billReview.charges')}
          </Text>
          {draft && draft.charges.length > 0 ? (
            <View
              style={[
                styles.chargesEmpty,
                { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
              ]}>
              {draft.charges.map((charge, index) => (
                <View key={`${charge.label}-${index}`} style={styles.chargeRow}>
                  <Text variant="caption" style={styles.chargeLabel}>
                    {charge.label}
                  </Text>
                  <Text variant="caption" color="textSecondary">
                    {(charge.amountCents / 100).toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View
              style={[
                styles.chargesEmpty,
                { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
              ]}>
              <Text variant="caption" color="textTertiary">
                {t('billReview.chargesEmpty')}
              </Text>
            </View>
          )}
        </View>

        {saveError ? (
          <Text variant="caption" color="danger">
            {saveError}
          </Text>
        ) : null}

        <Button label={t('billReview.save')} onPress={save} disabled={!canSave} />
        <Text variant="caption" color="textTertiary" style={styles.saveHint}>
          {t('billReview.saveHint')}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { gap: spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1, gap: spacing.xs },
  image: {
    width: '100%',
    height: 180,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  notice: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  section: { gap: spacing.xs, marginTop: spacing.sm },
  chargesEmpty: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  chargeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  chargeLabel: { flex: 1 },
  saveHint: { textAlign: 'center' },
});
