import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Alert, Linking, StyleSheet, View } from 'react-native';

import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { useNotifications } from '@/hooks/use-notifications';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';
import { radius, spacing } from '@/theme';

export function NotificationSection() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { measurementReminderEnabled, saving, setMeasurementReminder } =
    useNotifications({ initialize: false });
  const [pending, setPending] = useState(false);

  const onChange = async (value: boolean) => {
    setPending(true);
    const ok = await setMeasurementReminder(value);
    setPending(false);

    if (!ok) {
      Alert.alert(
        t('settings.notifications.permission.title'),
        t('settings.notifications.permission.message'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('settings.notifications.permission.open'),
            onPress: () => Linking.openSettings(),
          },
        ],
      );
    }
  };

  return (
    <View style={styles.section}>
      <Text variant="label" color="textSecondary">
        {t('settings.notifications.title')}
      </Text>

      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}>
        <View style={styles.row}>
          <SymbolView
            name={{ ios: 'bell', android: 'notifications', web: 'notifications' }}
            size={20}
            tintColor={colors.primary}
          />
          <View style={styles.info}>
            <Text variant="bodyStrong">
              {t('settings.notifications.measurement.title')}
            </Text>
            <Text variant="caption" color="textSecondary">
              {t('settings.notifications.measurement.description')}
            </Text>
          </View>
          <Switch
            value={measurementReminderEnabled}
            onValueChange={onChange}
            disabled={saving || pending}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  info: {
    flex: 1,
    gap: spacing.xs,
  },
});
