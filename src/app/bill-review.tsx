import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import type { BillDraft, EnergyBill } from '@/domain/entities/energy-bill';
import {
  useEnergyBill,
  useEnergyBillActions,
} from '@/hooks/use-energy-bills';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { useBillDraftStore } from '@/store/bill-draft-store';
import { useBillScanStore } from '@/store/bill-scan-store';
import { radius, spacing } from '@/theme';

const EMPTY_DRAFT: BillDraft = {
  distributor: null,
  readingDate: null,
  amountCents: null,
  activeKwh: null,
  injectedKwh: null,
  charges: [],
  flag: null,
};

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

function toDateInput(date: Date | null): string {
  if (!date) {
    return '';
  }
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function billToDraft(bill: EnergyBill): BillDraft {
  return {
    distributor: bill.distributor,
    readingDate: toDateInput(bill.readingDate),
    amountCents: bill.amountCents,
    activeKwh: bill.activeKwh,
    injectedKwh: bill.injectedKwh,
    charges: bill.charges,
    flag: bill.flag,
  };
}

type FormProps = {
  initial: BillDraft;
  billId?: string;
  imageUri: string | null;
  parserNotice: string | null;
  parseError: string | null;
  manual?: boolean;
};

function BillReviewForm({
  initial,
  billId,
  imageUri,
  parserNotice,
  parseError,
  manual = false,
}: FormProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { saveEnergyBill, updateEnergyBill, deleteEnergyBill } =
    useEnergyBillActions();
  const editing = Boolean(billId);

  const [amount, setAmount] = useState(
    initial.amountCents != null ? (initial.amountCents / 100).toFixed(2) : '',
  );
  const [activeKwh, setActiveKwh] = useState(
    initial.activeKwh != null ? String(initial.activeKwh) : '',
  );
  const [injectedKwh, setInjectedKwh] = useState(
    initial.injectedKwh != null ? String(initial.injectedKwh) : '',
  );
  const [date, setDate] = useState(initial.readingDate ?? '');
  const [distributor, setDistributor] = useState(initial.distributor ?? '');
  const [flag, setFlag] = useState(initial.flag ?? '');
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
    const input = {
      distributor: distributor.trim() || null,
      readingDate: parseDate(date),
      amountCents,
      activeKwh: activeKwhValue,
      injectedKwh: injectedKwhValue,
      charges: initial.charges,
      flag: flag.trim() || null,
      source: manual ? ('manual' as const) : ('agent' as const),
    };

    try {
      if (billId) {
        await updateEnergyBill(billId, input);
        toast.show(t('billReview.updated'), 'success');
      } else {
        await saveEnergyBill(input);
        toast.show(t('billReview.saved'), 'success');
      }
      router.replace({ pathname: '/measurements', params: { tab: 'bills' } });
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!billId) {
      return;
    }

    Alert.alert(
      t('bills.deleteConfirmTitle'),
      t('bills.deleteConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await deleteEnergyBill(billId);
                toast.show(t('bills.deleted'), 'success');
                router.replace({
                  pathname: '/measurements',
                  params: { tab: 'bills' },
                });
              } catch (error) {
                setSaveError(
                  error instanceof Error ? error.message : String(error),
                );
              }
            })();
          },
        },
      ],
    );
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
            <Text variant="title">
              {editing
                ? t('billReview.editTitle')
                : manual
                  ? t('billReview.newTitle')
                  : t('billReview.title')}
            </Text>
            <Text variant="caption" color="textSecondary">
              {t('billReview.subtitle')}
            </Text>
          </View>
        </View>

        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={[
              styles.image,
              { borderColor: colors.border, backgroundColor: colors.surfaceMuted },
            ]}
            contentFit="contain"
          />
        ) : null}

        {parserNotice ? (
          <View
            style={[
              styles.notice,
              { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
            ]}>
            <Text variant="caption" color="textSecondary">
              {parserNotice}
            </Text>
          </View>
        ) : null}

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
          {initial.charges.length > 0 ? (
            <View
              style={[
                styles.chargesEmpty,
                { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
              ]}>
              {initial.charges.map((charge, index) => (
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

        {billId ? (
          <Button
            label={t('common.delete')}
            onPress={confirmDelete}
            variant="danger"
          />
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default function BillReviewScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ id?: string; manual?: string }>();
  const { bill, loading } = useEnergyBill(params.id);
  const scan = useBillScanStore((state) => state.scan);
  const draft = useBillDraftStore((state) => state.draft);
  const parseError = useBillDraftStore((state) => state.parseError);
  const manual = params.manual === '1';

  if (params.id) {
    if (loading) {
      return (
        <View style={[styles.flex, styles.center, { backgroundColor: colors.background }]}>
          <ActivityIndicator color={colors.primary} />
        </View>
      );
    }

    if (!bill) {
      return (
        <View style={[styles.flex, styles.center, { backgroundColor: colors.background }]}>
          <Text variant="body" color="textSecondary">
            {t('billReview.notFound')}
          </Text>
          <Button label={t('common.back')} onPress={() => router.back()} />
        </View>
      );
    }

    return (
      <BillReviewForm
        key={bill.id}
        initial={billToDraft(bill)}
        billId={bill.id}
        imageUri={null}
        parserNotice={null}
        parseError={null}
      />
    );
  }

  if (manual) {
    return (
      <BillReviewForm
        key="manual"
        initial={EMPTY_DRAFT}
        imageUri={null}
        parserNotice={null}
        parseError={null}
        manual
      />
    );
  }

  return (
    <BillReviewForm
      key="new"
      initial={draft ?? EMPTY_DRAFT}
      imageUri={scan.processedUri}
      parserNotice={t('billReview.parserNotice')}
      parseError={parseError}
    />
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
