import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { spacing } from '@/theme';

type Props = {
  title: string;
  message?: string;
};

export function ComingSoon({ title, message }: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <SymbolView
        name={{ ios: 'hourglass', android: 'hourglass_empty', web: 'hourglass_empty' }}
        size={32}
        tintColor={colors.textTertiary}
      />
      <Text variant="heading">{title}</Text>
      {message ? (
        <Text variant="body" color="textSecondary" style={styles.message}>
          {message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  message: { textAlign: 'center' },
});
