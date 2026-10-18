import { Text as RNText, type TextProps } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { typography, type ThemeColors } from '@/theme';

type Props = TextProps & {
  variant?: keyof typeof typography;
  color?: keyof ThemeColors;
};

export function Text({
  variant = 'body',
  color = 'textPrimary',
  style,
  ...rest
}: Props) {
  const { colors } = useTheme();

  return (
    <RNText
      style={[typography[variant], { color: colors[color] }, style]}
      {...rest}
    />
  );
}
