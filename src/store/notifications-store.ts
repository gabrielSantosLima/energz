import { create } from 'zustand';

type NotificationsState = {
  measurementReminderEnabled: boolean;
  hydrated: boolean;
  setMeasurementReminderEnabled: (enabled: boolean) => void;
  setHydrated: (hydrated: boolean) => void;
};

export const useNotificationsStore = create<NotificationsState>((set) => ({
  measurementReminderEnabled: true,
  hydrated: false,
  setMeasurementReminderEnabled: (enabled) =>
    set({ measurementReminderEnabled: enabled }),
  setHydrated: (hydrated) => set({ hydrated }),
}));
