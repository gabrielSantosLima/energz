import { Switch as RNSwitch, type SwitchProps } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

export function Switch(props: SwitchProps) {
  const { colors } = useTheme();

  return (
    <RNSwitch
      trackColor={{ false: colors.surfaceSelected, true: colors.primary }}
      thumbColor="#FFFFFF"
      ios_backgroundColor={colors.surfaceSelected}
      {...props}
    />
  );
}
