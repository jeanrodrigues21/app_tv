import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { IPTVAuthProvider } from '@/contexts/IPTVAuthContext';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <SafeAreaProvider>
      <IPTVAuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="auth/login" />
          <Stack.Screen name="dorama/[id]" />
          <Stack.Screen name="player" />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="light" />
      </IPTVAuthProvider>
    </SafeAreaProvider>
  );
}