import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { radius, spacing } from '@/theme';

type Props = {
  title: string;
  description: string;
  icon: SymbolViewProps['name'];
  badge?: string;
  divider?: boolean;
  onPress?: () => void;
};

export function ReportTypeRow({
  title,
  description,
  icon,
  badge,
  divider = false,
  onPress,
}: Props) {
  const { colors } = useTheme();
  const disabled = !onPress;
  const tint = disabled ? colors.textTertiary : colors.primary;

  return (
    <Pressable
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        divider && {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
        },
        { opacity: pressed ? 0.9 : 1 },
      ]}>
      <View
        style={[styles.iconBox, { backgroundColor: colors.surfaceMuted }]}>
        <SymbolView name={icon} size={20} tintColor={tint} />
      </View>

      <View style={styles.text}>
        <Text
          variant="bodyStrong"
          color={disabled ? 'textTertiary' : 'textPrimary'}>
          {title}
        </Text>
        <Text
          variant="caption"
          color={disabled ? 'textTertiary' : 'textSecondary'}>
          {description}
        </Text>
      </View>

      {badge ? (
        <View
          style={[styles.badge, { backgroundColor: colors.surfaceSelected }]}>
          <Text variant="caption" color="textSecondary">
            {badge}
          </Text>
        </View>
      ) : (
        <SymbolView
          name={{
            ios: 'chevron.right',
            android: 'chevron_right',
            web: 'chevron_right',
          }}
          size={16}
          tintColor={colors.textTertiary}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: 2,
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
});
