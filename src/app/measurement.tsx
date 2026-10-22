import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';

import { Button } from '@/components/ui/button';
import { DateField } from '@/components/ui/date-field';
import { NumberField } from '@/components/ui/number-field';
import { Screen } from '@/components/ui/screen';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import type { Measurement } from '@/domain/entities/measurement';
import {
  useMeasurement,
  useMeasurementActions,
  useMeasurements,
} from '@/hooks/use-measurements';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { formatNumber } from '@/lib/format';
import { radius, spacing } from '@/theme';

type FormInput = {
  measuredAt: Date;
  consumption: number;
  production: number;
  endsCycle: boolean;
  restart: boolean;
};

type FormProps = {
  initial: Measurement | null;
  measurements: Measurement[];
  onSubmit: (input: FormInput) => Promise<void>;
  onDelete?: () => Promise<void>;
};

function MeasurementForm({
  initial,
  measurements,
  onSubmit,
  onDelete,
}: FormProps) {
  const { colors } = useTheme();
  const { t, locale } = useTranslation();

  const lastMeasurement =
    measurements.length > 0 ? measurements[measurements.length - 1] : null;

  const [date, setDate] = useState(initial?.measuredAt ?? new Date());
  const [consumption, setConsumption] = useState(
    initial?.consumption ?? lastMeasurement?.consumption ?? 0,
  );
  const [production, setProduction] = useState(
    initial?.production ?? lastMeasurement?.production ?? 0,
  );
  const [endsCycle, setEndsCycle] = useState(initial?.endsCycle ?? false);
  const [restart, setRestart] = useState(initial?.restart ?? false);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const previous = useMemo(() => {
    const before = measurements.filter(
      (measurement) =>
        measurement.id !== initial?.id &&
        measurement.measuredAt.getTime() < date.getTime(),
    );
    return before.length > 0 ? before[before.length - 1] : null;
  }, [measurements, initial?.id, date]);

  const minConsumption = restart ? 0 : (previous?.consumption ?? 0);
  const minProduction = restart ? 0 : (previous?.production ?? 0);

  const consumptionError =
    consumption <= 0
      ? t('measurements.form.positive')
      : !restart && consumption < minConsumption
        ? t('measurements.form.belowPrevious')
        : null;
  const productionError =
    production <= 0
      ? t('measurements.form.positive')
      : !restart && production < minProduction
        ? t('measurements.form.belowPrevious')
        : null;

  const onSave = async () => {
    if (consumptionError || productionError) {
      return;
    }

    setSaving(true);
    setSubmitError(null);
    try {
      await onSubmit({
        measuredAt: date,
        consumption,
        production,
        endsCycle,
        restart,
      });
    } catch (cause) {
      setSubmitError(cause instanceof Error ? cause.message : String(cause));
      setSaving(false);
    }
  };

  const onDeletePress = () => {
    if (!onDelete) {
      return;
    }
    Alert.alert(
      t('measurements.form.deleteConfirmTitle'),
      t('measurements.form.deleteConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('measurements.form.delete'),
          style: 'destructive',
          onPress: () => {
            void onDelete().catch((cause) => {
              setSubmitError(
                cause instanceof Error ? cause.message : String(cause),
              );
            });
          },
        },
      ],
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.form}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <DateField
          label={t('measurements.form.date')}
          value={date}
          onChange={setDate}
        />

        <NumberField
          label={t('measurements.form.consumption')}
          value={consumption}
          onChange={setConsumption}
          min={minConsumption}
          unit="kWh"
          error={consumptionError ?? undefined}
          actionLabel={t('measurements.form.restore')}
        />

        <NumberField
          label={t('measurements.form.production')}
          value={production}
          onChange={setProduction}
          min={minProduction}
          unit="kWh"
          error={productionError ?? undefined}
          actionLabel={t('measurements.form.restore')}
        />

        {!restart && previous ? (
          <Text variant="caption" color="textTertiary">
            {t('measurements.form.minHint', {
              consumption: formatNumber(minConsumption, locale),
              production: formatNumber(minProduction, locale),
            })}
          </Text>
        ) : null}

        <View style={styles.switchRow}>
          <Text variant="label" color="textSecondary">
            {t('measurements.form.endsCycle')}
          </Text>
          <Switch
            value={endsCycle}
            onValueChange={setEndsCycle}
            trackColor={{ true: colors.primary }}
            thumbColor={colors.surface}
          />
        </View>

        <View style={styles.switchBlock}>
          <View style={styles.switchRow}>
            <Text variant="label" color="textSecondary" style={styles.switchLabel}>
              {t('measurements.form.restart')}
            </Text>
            <Switch
              value={restart}
              onValueChange={setRestart}
              trackColor={{ true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>
          <Text variant="caption" color="textTertiary">
            {t('measurements.form.restartHint')}
          </Text>
        </View>

        {submitError ? (
          <Text variant="body" color="danger">
            {submitError}
          </Text>
        ) : null}

        <Button
          label={t('measurements.form.save')}
          onPress={onSave}
          disabled={saving || Boolean(consumptionError) || Boolean(productionError)}
        />

        {onDelete ? (
          <Button
            label={t('measurements.form.delete')}
            onPress={onDeletePress}
            variant="danger"
          />
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default function MeasurementFormScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id;
  const isNew = !id;

  const { colors } = useTheme();
  const { t } = useTranslation();
  const { measurement, loading } = useMeasurement(id);
  const { measurements, loading: measurementsLoading } = useMeasurements();
  const { createMeasurement, updateMeasurement, deleteMeasurement } =
    useMeasurementActions();

  const handleSubmit = async (input: FormInput) => {
    if (isNew) {
      await createMeasurement(input);
    } else {
      await updateMeasurement({ id, ...input });
    }
    router.back();
  };

  const handleDelete = async () => {
    if (!id) {
      return;
    }
    await deleteMeasurement(id);
    router.back();
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          onPress={() => router.back()}
          style={styles.back}>
          <SymbolView
            name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
            size={22}
            tintColor={colors.textPrimary}
          />
        </Pressable>
        <Text variant="heading">
          {isNew
            ? t('measurements.form.createTitle')
            : t('measurements.form.editTitle')}
        </Text>
      </View>

      {loading || measurementsLoading ? (
        <View style={styles.form}>
          <Skeleton height={72} />
          <Skeleton height={72} />
          <Skeleton height={72} />
          <Skeleton height={52} round={radius.lg} />
        </View>
      ) : (
        <MeasurementForm
          initial={measurement}
          measurements={measurements}
          onSubmit={handleSubmit}
          onDelete={isNew ? undefined : handleDelete}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
  form: {
    gap: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchBlock: {
    gap: spacing.xs,
  },
  switchLabel: {
    flex: 1,
    paddingRight: spacing.md,
  },
});
