import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { radius, spacing } from '@/theme';

type Props = {
  title: string;
  description: string;
  icon: SymbolViewProps['name'];
  selected?: boolean;
  onPress: () => void;
};

export function SyncModeCard({
  title,
  description,
  icon,
  selected = false,
  onPress,
}: Props) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: selected ? colors.primary : colors.border,
          opacity: pressed ? 0.92 : 1,
        },
      ]}>
      <View
        style={[
          styles.iconBox,
          {
            backgroundColor: selected ? colors.primarySoft : colors.surfaceMuted,
          },
        ]}>
        <SymbolView
          name={icon}
          size={22}
          tintColor={selected ? colors.primary : colors.textSecondary}
        />
      </View>

      <View style={styles.text}>
        <Text variant="subtitle">{title}</Text>
        <Text variant="caption" color="textSecondary">
          {description}
        </Text>
      </View>

      <SymbolView
        name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
        size={18}
        tintColor={colors.textTertiary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: spacing.xs,
  },
});
