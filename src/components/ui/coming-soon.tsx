import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { radius, spacing } from '@/theme';

type Props = {
  title: string;
  message?: string;
  icon?: SymbolViewProps['name'];
};

export function ComingSoon({ title, message, icon }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={[styles.badge, { backgroundColor: colors.surfaceMuted }]}>
        <SymbolView
          name={
            icon ?? {
              ios: 'hourglass',
              android: 'hourglass_empty',
              web: 'hourglass_empty',
            }
          }
          size={30}
          tintColor={colors.primary}
        />
      </View>

      <Text variant="heading" style={styles.title}>
        {title}
      </Text>

      {message ? (
        <Text variant="body" color="textSecondary" style={styles.message}>
          {message}
        </Text>
      ) : null}

      <View style={[styles.chip, { backgroundColor: colors.accentSoft }]}>
        <Text variant="caption" color="warning">
          {t('common.comingSoon')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  badge: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
});
