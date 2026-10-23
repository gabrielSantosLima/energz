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
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { useBillDraftStore } from '@/store/bill-draft-store';
import { useBillScanStore } from '@/store/bill-scan-store';
import { radius, spacing } from '@/theme';

export default function BillReviewScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
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

        <Button label={t('billReview.save')} onPress={() => undefined} disabled />
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
