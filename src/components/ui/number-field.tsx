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
};

export function NumberField({
  label,
  value,
  onChange,
  min = 0,
  unit,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const current = useSharedValue(value);
  const start = useSharedValue(value);
  const lower = useSharedValue(min);

  useEffect(() => {
    lower.value = min;
  }, [lower, min]);

  const commit = (text: string) => {
    const digits = text.replace(/[^0-9]/g, '');
    const parsed = digits ? Number.parseInt(digits, 10) : Math.round(current.value);
    const next = Math.max(
      min,
      Number.isFinite(parsed) ? parsed : Math.round(current.value),
    );
    current.value = Math.round(next);
    onChange(Math.round(next));
    setEditing(false);
  };

  const beginEdit = (initial: number) => {
    setDraft(String(Math.round(initial)));
    setEditing(true);
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
            { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
          ]}>
          {editing ? (
            <TextInput
              autoFocus
              value={draft}
              onChangeText={setDraft}
              onBlur={() => commit(draft)}
              onSubmitEditing={() => commit(draft)}
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
              onPress={() => commit(draft)}
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
});
