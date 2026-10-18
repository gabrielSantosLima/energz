import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { TextInput } from '@/components/ui/text-input';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { formatDate } from '@/lib/format';
import { radius, spacing } from '@/theme';

type Props = {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
};

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function fromIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) {
    return null;
  }
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );
  return Number.isNaN(date.getTime()) ? null : date;
}

export function DateField({ label, value, onChange }: Props) {
  const { colors, isDark } = useTheme();
  const { t, locale } = useTranslation();
  const [iosOpen, setIosOpen] = useState(false);
  const [webText, setWebText] = useState(toIsoDate(value));

  if (Platform.OS === 'web') {
    return (
      <TextInput
        label={label}
        value={webText}
        placeholder="YYYY-MM-DD"
        autoCapitalize="none"
        onChangeText={(text) => {
          setWebText(text);
          const parsed = fromIsoDate(text);
          if (parsed) {
            onChange(parsed);
          }
        }}
      />
    );
  }

  const open = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value,
        mode: 'date',
        onChange: (event: DateTimePickerEvent, date?: Date) => {
          if (event.type === 'set' && date) {
            onChange(date);
          }
        },
      });
      return;
    }
    setIosOpen(true);
  };

  return (
    <View style={styles.wrapper}>
      <Text variant="label" color="textSecondary">
        {label}
      </Text>

      <Pressable
        accessibilityRole="button"
        onPress={open}
        style={[
          styles.field,
          { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
        ]}>
        <Text variant="body">{formatDate(value, locale)}</Text>
        <SymbolView
          name={{ ios: 'calendar', android: 'calendar_today', web: 'calendar_today' }}
          size={18}
          tintColor={colors.textTertiary}
        />
      </Pressable>

      {Platform.OS === 'ios' ? (
        <Modal
          visible={iosOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIosOpen(false)}>
          <Pressable style={styles.backdrop} onPress={() => setIosOpen(false)}>
            <Pressable
              style={[styles.sheet, { backgroundColor: colors.surface }]}
              onPress={() => { }}>
              <Text variant="label" color="textSecondary">
                {label}
              </Text>
              <DateTimePicker
                value={value}
                mode="date"
                display="inline"
                themeVariant={isDark ? 'dark' : 'light'}
                onChange={(_event, date) => {
                  if (date) {
                    onChange(date);
                  }
                }}
              />
              <Pressable
                accessibilityRole="button"
                style={[styles.confirm, { backgroundColor: colors.primary }]}
                onPress={() => setIosOpen(false)}>
                <Text variant="label" style={{ color: colors.onPrimary }}>
                  {t('common.done')}
                </Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
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
    justifyContent: 'space-between',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  sheet: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  confirm: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
  },
});
