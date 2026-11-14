import { useEffect } from "react";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { CormorantGaramond_700Bold } from "@expo-google-fonts/cormorant-garamond";
import { Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from "@expo-google-fonts/poppins";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { LanguageProvider } from "@/lib/i18n";
import { SessionProvider, useSession } from "@/lib/session";
import { colors } from "@/theme";

// The splash picture stays until the fonts are ready and the saved sign-in has been checked
SplashScreen.preventAutoHideAsync().catch(() => undefined);

function RootNavigator({ fontsReady }: { fontsReady: boolean }) {
  const { isLoading, isOffline } = useSession();

  useEffect(() => {
    if (!isLoading && fontsReady) SplashScreen.hideAsync().catch(() => undefined);
  }, [isLoading, fontsReady]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.surface }, animation: "fade" }}>
      <Stack.Protected guard={isOffline}>
        <Stack.Screen name="offline" />
      </Stack.Protected>
      {/* Browsing is open to everyone; sign-in and register open on top only when a person chooses them */}
      <Stack.Protected guard={!isOffline}>
        <Stack.Screen name="(app)" />
        <Stack.Screen name="sign-in" options={{ animation: "slide_from_bottom" }} />
        <Stack.Screen name="register" options={{ animation: "slide_from_right" }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    CormorantGaramond_700Bold,
  });

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <SessionProvider>
          <StatusBar style="light" />
          {/* If a font cannot load, the app still opens with the phone's own font */}
          <RootNavigator fontsReady={loaded || !!fontError} />
        </SessionProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
