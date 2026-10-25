import '@/lib/polyfills';
import 'reflect-metadata';

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import * as Notifications from 'expo-notifications';
import { Stack, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import '@/contexts/container';
import '@/tasks/database-backup-task';
import { ToastProvider } from '@/contexts/toast';
import { PillNav } from '@/components/ui/pill-nav';
import { useAgentSettings } from '@/hooks/use-agent-settings';
import { useBackupScheduler } from '@/hooks/use-backup-scheduler';
import { useNotificationObserver } from '@/hooks/use-notification-observer';
import { useNotifications } from '@/hooks/use-notifications';
import { usePreferences } from '@/hooks/use-preferences';
import { useTheme } from '@/hooks/use-theme';

SplashScreen.setOptions({
  duration: 400,
  fade: true,
});

SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const HIDDEN_NAV_ROUTES = new Set([
  '/bill-scan',
  '/bill-preview',
  '/bill-review',
  '/agent-settings',
  '/backup-settings',
]);

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const { hydrated } = usePreferences();
  const { colors } = useTheme();
  const pathname = usePathname();

  useAgentSettings();
  useNotifications({ initialize: true });
  useBackupScheduler();
  useNotificationObserver();

  const ready = fontsLoaded && hydrated;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <ToastProvider>
        <View style={[styles.root, { backgroundColor: colors.background }]}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
            }}
          />
          {HIDDEN_NAV_ROUTES.has(pathname) ? null : <PillNav />}
        </View>
      </ToastProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
