import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { radius, spacing } from '@/theme';

type Props = {
  count: number;
  onCancel: () => void;
  onDelete: () => void;
};

export function SelectionHeader({ count, onCancel, onDelete }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('common.cancel')}
        onPress={onCancel}
        style={styles.button}>
        <SymbolView
          name={{ ios: 'xmark', android: 'close', web: 'close' }}
          size={20}
          tintColor={colors.textPrimary}
        />
      </Pressable>

      <Text variant="bodyStrong" style={styles.count}>
        {t('common.selected', { count })}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('common.delete')}
        onPress={onDelete}
        disabled={count === 0}
        style={styles.button}>
        <SymbolView
          name={{ ios: 'trash', android: 'delete', web: 'delete' }}
          size={20}
          tintColor={count === 0 ? colors.textTertiary : colors.danger}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    flex: 1,
  },
});
