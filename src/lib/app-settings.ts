import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

export async function openAppSettings(): Promise<void> {
  await Linking.openSettings();
}

export async function openBluetoothSettings(): Promise<void> {
  if (Platform.OS !== 'android') {
    await Linking.openSettings();
    return;
  }

  try {
    // Deprecated in expo-linking, but still the only way to open the system
    // Bluetooth screen without adding a native dependency.
    await Linking.sendIntent('android.settings.BLUETOOTH_SETTINGS');
  } catch {
    await Linking.openSettings();
  }
}
