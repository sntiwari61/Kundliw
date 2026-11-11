import { useEffect } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { LanguageProvider } from "@/lib/i18n";
import { SessionProvider, useSession } from "@/lib/session";
import { colors } from "@/theme";

// The splash picture stays until the saved sign-in has been checked
SplashScreen.preventAutoHideAsync().catch(() => undefined);

function RootNavigator() {
  const { user, isLoading, isOffline } = useSession();

  useEffect(() => {
    if (!isLoading) SplashScreen.hideAsync().catch(() => undefined);
  }, [isLoading]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.surface } }}>
      <Stack.Protected guard={isOffline}>
        <Stack.Screen name="offline" />
      </Stack.Protected>
      <Stack.Protected guard={!isOffline && !!user}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!isOffline && !user}>
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <SessionProvider>
          <StatusBar style="dark" />
          <RootNavigator />
        </SessionProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
