import { create } from 'zustand';

type DevState = {
  devMode: boolean;
  enableDevMode: () => void;
  disableDevMode: () => void;
};

export const useDevStore = create<DevState>((set) => ({
  devMode: false,
  enableDevMode: () => set({ devMode: true }),
  disableDevMode: () => set({ devMode: false }),
}));
