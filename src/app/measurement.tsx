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
  Switch,
  View,
} from 'react-native';

import { Button } from '@/components/ui/button';
import { DateField } from '@/components/ui/date-field';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { TextInput } from '@/components/ui/text-input';
import type { Measurement } from '@/domain/entities/measurement';
import {
  useMeasurement,
  useMeasurementActions,
} from '@/hooks/use-measurements';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { radius, spacing } from '@/theme';

type FormInput = {
  measuredAt: Date;
  consumption: number;
  production: number;
  endsCycle: boolean;
};

type FormProps = {
  initial: Measurement | null;
  onSubmit: (input: FormInput) => Promise<void>;
  onDelete?: () => Promise<void>;
};

function MeasurementForm({ initial, onSubmit, onDelete }: FormProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [date, setDate] = useState(initial?.measuredAt ?? new Date());
  const [consumption, setConsumption] = useState(
    initial ? String(initial.consumption) : '',
  );
  const [production, setProduction] = useState(
    initial ? String(initial.production) : '',
  );
  const [endsCycle, setEndsCycle] = useState(initial?.endsCycle ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSave = async () => {
    const consumptionValue = Number(consumption.replace(',', '.'));
    const productionValue = Number(production.replace(',', '.'));

    if (!Number.isFinite(consumptionValue) || !Number.isFinite(productionValue)) {
      setError(t('measurements.form.invalidNumber'));
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        measuredAt: date,
        consumption: consumptionValue,
        production: productionValue,
        endsCycle,
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
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
              setError(cause instanceof Error ? cause.message : String(cause));
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

        <TextInput
          label={t('measurements.form.consumption')}
          value={consumption}
          onChangeText={setConsumption}
          keyboardType="decimal-pad"
          placeholder="0"
        />

        <TextInput
          label={t('measurements.form.production')}
          value={production}
          onChangeText={setProduction}
          keyboardType="decimal-pad"
          placeholder="0"
        />

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

        {error ? (
          <Text variant="body" color="danger">
            {error}
          </Text>
        ) : null}

        <Button
          label={t('measurements.form.save')}
          onPress={onSave}
          disabled={saving}
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

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <MeasurementForm
          initial={measurement}
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
