import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue } from 'react-native-reanimated';

import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { radius, spacing, typography } from '@/theme';

type Props = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  unit?: string;
  error?: string;
  actionLabel?: string;
};

export function NumberField({
  label,
  value,
  onChange,
  min = 0,
  unit,
  error,
  actionLabel,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const current = useSharedValue(value);
  const start = useSharedValue(value);
  const lower = useSharedValue(min);
  const lastValid = useSharedValue(value);

  useEffect(() => {
    lower.value = min;
  }, [lower, min]);

  useEffect(() => {
    if (!error) {
      lastValid.value = value;
    }
  }, [error, value, lastValid]);

  const beginEdit = (initial: number) => {
    setDraft(String(Math.round(initial)));
    setEditing(true);
  };

  const handleChangeText = (text: string) => {
    setDraft(text);
    const parsed = Number(text.replace(',', '.'));
    const next = Number.isFinite(parsed) ? Math.round(parsed) : 0;
    current.value = next;
    onChange(next);
  };

  const finishEdit = () => {
    setEditing(false);
  };

  const pan = Gesture.Pan()
    .enabled(!editing)
    .onBegin(() => {
      start.value = current.value;
    })
    .onUpdate((event) => {
      const distance = -event.translationY;
      const units = Math.round(
        (distance / 10) * (1 + Math.abs(distance) / 300),
      );
      let next = start.value + units;
      if (next < lower.value) {
        next = lower.value;
      }
      next = Math.round(next);
      if (next !== current.value) {
        current.value = next;
        runOnJS(onChange)(next);
      }
    });

  const tap = Gesture.Tap()
    .enabled(!editing)
    .onEnd(() => {
      runOnJS(beginEdit)(current.value);
    });

  const gesture = Gesture.Exclusive(pan, tap);

  return (
    <View style={styles.wrapper}>
      <Text variant="label" color="textSecondary">
        {label}
      </Text>

      <GestureDetector gesture={gesture}>
        <View
          style={[
            styles.field,
            {
              backgroundColor: colors.surfaceMuted,
              borderColor: error ? colors.danger : colors.border,
            },
          ]}>
          {editing ? (
            <TextInput
              autoFocus
              value={draft}
              onChangeText={handleChangeText}
              onBlur={finishEdit}
              onSubmitEditing={finishEdit}
              keyboardType="number-pad"
              placeholderTextColor={colors.textTertiary}
              style={[
                typography.body,
                styles.input,
                { color: colors.textPrimary },
              ]}
            />
          ) : (
            <Text variant="bodyStrong" style={styles.value}>
              {String(Math.round(value))}
            </Text>
          )}

          {unit ? (
            <Text variant="caption" color="textTertiary">
              {unit}
            </Text>
          ) : null}

          {editing ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('common.done')}
              onPress={finishEdit}
              hitSlop={spacing.sm}>
              <SymbolView
                name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                size={18}
                tintColor={colors.primary}
              />
            </Pressable>
          ) : (
            <SymbolView
              name={{
                ios: 'chevron.up.chevron.down',
                android: 'unfold_more',
                web: 'unfold_more',
              }}
              size={16}
              tintColor={colors.textTertiary}
            />
          )}
        </View>
      </GestureDetector>

      {error ? (
        <View style={styles.errorRow}>
          <Text variant="caption" color="danger" style={styles.errorText}>
            {error}
          </Text>
          {actionLabel ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                const restored = lastValid.value;
                current.value = restored;
                setDraft(String(restored));
                onChange(restored);
              }}
              hitSlop={spacing.sm}>
              <Text variant="caption" color="primary">
                {actionLabel}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  field: {
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    padding: 0,
  },
  value: {
    flex: 1,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  errorText: {
    flex: 1,
  },
});
