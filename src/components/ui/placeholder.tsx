import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { spacing } from '@/theme';

type Props = {
  title: string;
  message?: string;
};

export function Placeholder({ title, message }: Props) {
  return (
    <View style={styles.container}>
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
