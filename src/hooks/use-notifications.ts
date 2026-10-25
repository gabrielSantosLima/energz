import { useCallback, useEffect, useState } from 'react';

import { GetNotificationSettingsUseCase } from '@/domain/useCases/notifications/get-notification-settings';
import { SetMeasurementReminderEnabledUseCase } from '@/domain/useCases/notifications/set-measurement-reminder-enabled';
import { useInjection } from '@/hooks/use-injection';
import { useTranslation } from '@/hooks/use-translation';
import { useNotificationsStore } from '@/store/notifications-store';

type Options = {
  initialize?: boolean;
};

export function useNotifications({ initialize = true }: Options = {}) {
  const getSettings = useInjection(GetNotificationSettingsUseCase);
  const setReminder = useInjection(SetMeasurementReminderEnabledUseCase);
  const { t } = useTranslation();

  const enabled = useNotificationsStore(
    (state) => state.measurementReminderEnabled,
  );
  const hydrated = useNotificationsStore((state) => state.hydrated);
  const applyEnabled = useNotificationsStore(
    (state) => state.setMeasurementReminderEnabled,
  );
  const setHydrated = useNotificationsStore((state) => state.setHydrated);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!initialize || hydrated) {
      return;
    }

    let active = true;

    void (async () => {
      const settings = await getSettings.execute();
      let enabled = settings.measurementReminderEnabled;

      if (!settings.configured) {
        enabled = await setReminder.execute({
          enabled,
          title: t('notifications.measurement.title'),
          body: t('notifications.measurement.body'),
        });
      }

      if (active) {
        applyEnabled(enabled);
        setHydrated(true);
      }
    })();

    return () => {
      active = false;
    };
  }, [
    initialize,
    hydrated,
    getSettings,
    setReminder,
    applyEnabled,
    setHydrated,
    t,
  ]);

  const setMeasurementReminder = useCallback(
    async (value: boolean) => {
      setSaving(true);
      try {
        const ok = await setReminder.execute({
          enabled: value,
          title: t('notifications.measurement.title'),
          body: t('notifications.measurement.body'),
        });
        if (ok) {
          applyEnabled(value);
        }
        return ok;
      } finally {
        setSaving(false);
      }
    },
    [setReminder, applyEnabled, t],
  );

  return {
    measurementReminderEnabled: enabled,
    hydrated,
    saving,
    setMeasurementReminder,
  };
}
