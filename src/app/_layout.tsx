import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.setOptions({
  duration: 400,
  fade: true,
});

export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
