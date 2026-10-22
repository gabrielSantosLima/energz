import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { injectable } from 'tsyringe';

const CHANNEL_ID = 'measurement-reminders';
const MEASUREMENT_TIMES = [
  { hour: 7, minute: 0 },
  { hour: 19, minute: 0 },
];

@injectable()
export class NotificationService {
  async hasPermission(): Promise<boolean> {
    const settings = await Notifications.getPermissionsAsync();
    return (
      settings.granted ||
      settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
    );
  }

  async requestPermission(): Promise<boolean> {
    await this.ensureChannel();
    const settings = await Notifications.requestPermissionsAsync();
    return (
      settings.granted ||
      settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
    );
  }

  async scheduleMeasurementReminders(title: string, body: string): Promise<void> {
    await this.ensureChannel();
    await this.cancelMeasurementReminders();

    for (const time of MEASUREMENT_TIMES) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { url: '/measurement' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: time.hour,
          minute: time.minute,
          channelId: CHANNEL_ID,
        },
      });
    }
  }

  async cancelMeasurementReminders(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  private async ensureChannel(): Promise<void> {
    if (Platform.OS !== 'android') {
      return;
    }
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Measurement reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}
