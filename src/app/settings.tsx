import { StyleSheet, View } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Text } from '@/components/ui/text';
import { usePreferences } from '@/hooks/use-preferences';
import { useTranslation } from '@/hooks/use-translation';
import { spacing } from '@/theme';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { theme, locale, setTheme, setLocale } = usePreferences();

  return (
    <Screen scroll>
      <Text variant="title">{t('settings.title')}</Text>

      <View style={styles.section}>
        <Text variant="label" color="textSecondary">
          {t('settings.theme.label')}
        </Text>
        <SegmentedControl
          value={theme}
          onChange={setTheme}
          options={[
            { value: 'system', label: t('settings.theme.system') },
            { value: 'light', label: t('settings.theme.light') },
            { value: 'dark', label: t('settings.theme.dark') },
          ]}
        />
      </View>

      <View style={styles.section}>
        <Text variant="label" color="textSecondary">
          {t('settings.language.label')}
        </Text>
        <SegmentedControl
          value={locale}
          onChange={setLocale}
          options={[
            { value: 'en', label: t('settings.language.en') },
            { value: 'pt', label: t('settings.language.pt') },
          ]}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
});
