import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { radius, spacing } from '@/theme';

type Props = {
  deviceName: string | null | undefined;
};

export function SourceChip({ deviceName }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const name = deviceName?.trim();
  const label = name
    ? t('sync.fromDevice', { name })
    : t('sync.fromAnotherDevice');

  return (
    <View
      style={[
        styles.chip,
        { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
      ]}>
      <SymbolView
        name={{ ios: 'iphone', android: 'smartphone', web: 'smartphone' }}
        size={12}
        tintColor={colors.textSecondary}
      />
      <Text
        variant="caption"
        color="textSecondary"
        numberOfLines={1}
        style={styles.label}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    maxWidth: '100%',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: {
    flexShrink: 1,
  },
});
