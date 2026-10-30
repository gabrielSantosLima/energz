import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import { injectable } from 'tsyringe';

const DEVICE_ID_KEY = 'energz.sync.deviceId';
const DEVICE_NAME_KEY = 'energz.sync.deviceName';
const MAX_DEVICE_NAME_LENGTH = 40;

@injectable()
export class DeviceIdentity {
  private deviceId: string | null = null;
  private deviceName: string | null = null;

  private defaultName(): string {
    return Device.modelName?.trim() || 'energz device';
  }

  async getDeviceId(): Promise<string> {
    if (this.deviceId) {
      return this.deviceId;
    }

    const stored = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    const id = stored ?? Crypto.randomUUID();

    if (!stored) {
      await SecureStore.setItemAsync(DEVICE_ID_KEY, id);
    }

    this.deviceId = id;
    return id;
  }

  async getDeviceName(): Promise<string> {
    if (this.deviceName) {
      return this.deviceName;
    }

    const stored = await AsyncStorage.getItem(DEVICE_NAME_KEY);
    const name = stored?.trim() || this.defaultName();
    this.deviceName = name.slice(0, MAX_DEVICE_NAME_LENGTH);
    return this.deviceName;
  }

  async setDeviceName(name: string): Promise<string> {
    const next =
      name.trim().slice(0, MAX_DEVICE_NAME_LENGTH) || this.defaultName();
    await AsyncStorage.setItem(DEVICE_NAME_KEY, next);
    this.deviceName = next;
    return next;
  }
}
