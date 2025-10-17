import { Stack } from 'expo-router';
import { Platform } from 'react-native';

if (Platform.OS === 'web') {
  require('./global.css');
}

export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
