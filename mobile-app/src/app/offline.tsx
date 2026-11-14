import { StyleSheet } from "react-native";
import { Text } from "@/components/Text";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui";
import { useLanguage } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { colors, space } from "@/theme";

/** Shown at start-up when a sign-in is saved but the server cannot be reached. The sign-in is kept. */
export default function OfflineScreen() {
  const { retry, isLoading } = useSession();
  const { t, lang } = useLanguage();
  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.title}>{t("appName")}</Text>
      <Text style={styles.text}>
        {lang === "hi"
          ? "सर्वर से संपर्क नहीं हो सका। कृपया अपना इंटरनेट जाँचें।"
          : "Could not reach the server. Please check your internet connection."}
      </Text>
      <Button label={t("retry")} onPress={retry} busy={isLoading} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface, padding: space.xl, justifyContent: "center", gap: space.lg },
  title: { fontSize: 22, fontWeight: "700", color: colors.heading, textAlign: "center" },
  text: { fontSize: 16, color: colors.text, textAlign: "center", lineHeight: 24 },
});
