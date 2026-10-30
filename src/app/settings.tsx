import { StyleSheet, View } from 'react-native';

import { NotificationSection } from '@/components/settings/notification-section';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Text } from '@/components/ui/text';
import { useToast } from '@/contexts/toast';
import { useAgentSettings } from '@/hooks/use-agent-settings';
import { useDevMode } from '@/hooks/use-dev-mode';
import { useSafeNavigation } from '@/hooks/use-safe-navigation';
import { usePreferences } from '@/hooks/use-preferences';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { APP_VERSION } from '@/lib/app-version';
import { radius, spacing } from '@/theme';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const toast = useToast();
  const { devMode, disableDevMode } = useDevMode();
  const { theme, locale, setTheme, setLocale } = usePreferences();
  const { configured } = useAgentSettings();
  const navigate = useSafeNavigation();

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

      <NotificationSection />

      <View style={styles.section}>
        <Text variant="label" color="textSecondary">
          {t('settings.backup.title')}
        </Text>
        <Button
          label={t('settings.backup.configure')}
          variant="secondary"
          onPress={() => navigate('/backup-settings')}
        />
      </View>

      <View style={styles.section}>
        <Text variant="label" color="textSecondary">
          {t('settings.sync.title')}
        </Text>
        <Button
          label={t('settings.sync.configure')}
          variant="secondary"
          onPress={() => navigate('/sync')}
        />
      </View>

      <View style={styles.section}>
        <Text variant="label" color="textSecondary">
          {t('settings.ai.title')}
        </Text>
        <Text variant="caption" color="textTertiary">
          {configured ? t('settings.ai.configured') : t('settings.ai.missing')}
        </Text>
        <Button
          label={t('settings.ai.configure')}
          variant="secondary"
          onPress={() => navigate('/agent-settings')}
        />
      </View>

      {devMode ? (
        <View style={styles.section}>
          <Text variant="label" color="textSecondary">
            {t('dev.title')}
          </Text>
          <Button
            label={t('dev.disable')}
            variant="secondary"
            onPress={() => {
              disableDevMode();
              toast.show(t('dev.disabled'), 'success');
            }}
          />
        </View>
      ) : null}

      <View style={styles.section}>
        <Text variant="label" color="textSecondary">
          {t('settings.version')}
        </Text>
        <View
          style={[
            styles.value,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}>
          <Text variant="body">{APP_VERSION}</Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  value: {
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
});
