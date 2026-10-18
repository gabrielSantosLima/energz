import { Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { radius, spacing } from '@/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  style?: ViewStyle;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
}: Props) {
  const { colors } = useTheme();

  const palette = {
    primary: { background: colors.primary, foreground: colors.onPrimary },
    secondary: { background: colors.surfaceMuted, foreground: colors.textPrimary },
    ghost: { background: 'transparent', foreground: colors.primary },
    danger: { background: colors.danger, foreground: '#FFFFFF' },
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: palette.background,
          opacity: disabled ? 0.5 : pressed ? 0.9 : 1,
        },
        style,
      ]}>
      <Text variant="label" style={{ color: palette.foreground }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
  },
});
