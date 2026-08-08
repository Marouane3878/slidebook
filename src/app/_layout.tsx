import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '../context/AuthContext';
import { LibraryProvider } from '../context/LibraryContext';
import { useLibrary } from '../context/LibraryContext';
import { colors, spacing, typography } from '../theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <LibraryProvider>
          <StatusBar style="dark" />
          <SessionLibrarySync />
          <RootNavigator />
        </LibraryProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function SessionLibrarySync() {
  const { user } = useAuth();
  const { setDisplayName } = useLibrary();

  useEffect(() => {
    if (!user) {
      return;
    }

    const emailName = user.email?.split('@')[0] ?? '';
    setDisplayName(user.displayName?.trim() || emailName || 'Reader');
  }, [setDisplayName, user]);

  return null;
}

function RootNavigator() {
  const { isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingScreen}>
        <View style={styles.loadingMark}>
          <ActivityIndicator color={colors.white} size="small" />
        </View>
        <Text style={styles.loadingText}>Opening your shelf…</Text>
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        animation: 'fade_from_bottom',
        contentStyle: { backgroundColor: colors.canvas },
        headerShown: false,
      }}
    >
      <Stack.Protected guard={!user}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" />
      </Stack.Protected>

      <Stack.Protected guard={Boolean(user)}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="interests" />
      </Stack.Protected>
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    alignItems: 'center',
    backgroundColor: colors.canvas,
    flex: 1,
    gap: spacing.md,
    justifyContent: 'center',
  },
  loadingMark: {
    alignItems: 'center',
    backgroundColor: colors.violet,
    borderRadius: 18,
    height: 52,
    justifyContent: 'center',
    transform: [{ rotate: '-4deg' }],
    width: 52,
  },
  loadingText: {
    ...typography.label,
    color: colors.inkMuted,
  },
});
