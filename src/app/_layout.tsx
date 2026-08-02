import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LibraryProvider } from '../context/LibraryContext';
import { colors } from '../theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <LibraryProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            animation: 'fade_from_bottom',
            contentStyle: { backgroundColor: colors.canvas },
            headerShown: false,
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="interests" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </LibraryProvider>
    </SafeAreaProvider>
  );
}
