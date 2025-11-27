import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { useEffect } from 'react';
import { initializeVisitTracking } from '../src/utils/analytics';

if (Platform.OS === 'web') {
  require('./global.css');
}

export default function RootLayout() {
  useEffect(() => {
    // 앱 시작 시 접속 로그 기록
    if (Platform.OS === 'web') {
      initializeVisitTracking();
    }
  }, []);

  return <Stack screenOptions={{ headerShown: false }} />;
}
