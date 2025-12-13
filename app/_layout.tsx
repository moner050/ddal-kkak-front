import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { NavigationProvider } from '../src/context/NavigationContext';

if (Platform.OS === 'web') {
  require('./global.css');
}

export default function RootLayout() {
  return (
    <NavigationProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </NavigationProvider>
  );
}
