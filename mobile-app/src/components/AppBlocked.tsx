import { Linking, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/Text";
import { Button } from "@/components/ui";
import { useAppConfig } from "@/lib/appConfig";
import { useLanguage } from "@/lib/i18n";
import { colors, gradients, space } from "@/theme";

/** Shown instead of the app when the admin switches it off for maintenance, or this installed version is too old. */
export function AppBlocked({ reason }: { reason: "maintenance" | "update" }) {
  const { t, lang } = useLanguage();
  const { config, reload } = useAppConfig();
  const own = reason === "maintenance" ? (lang === "hi" ? config.maintenanceTextHi : config.maintenanceTextEn) : lang === "hi" ? config.updateTextHi : config.updateTextEn;
  const text = own || (reason === "maintenance" ? t("maintenanceDefault") : t("updateDefault"));
  return (
    <LinearGradient colors={gradients.hero} style={styles.root}>
      <View style={styles.icon}>
        <Ionicons name={reason === "maintenance" ? "construct" : "cloud-download"} size={44} color={colors.gold} />
      </View>
      <Text serif style={styles.title}>
        {reason === "maintenance" ? t("maintenanceTitle") : t("updateTitle")}
      </Text>
      <Text style={styles.text}>{text}</Text>
      <View style={{ alignSelf: "stretch", gap: space.md, marginTop: space.lg }}>
        {reason === "update" && config.playStoreUrl ? <Button label={t("updateNow")} onPress={() => Linking.openURL(config.playStoreUrl as string).catch(() => undefined)} /> : null}
        <Button label={t("retry")} variant="outline" onPress={reload} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center", padding: space.xl, gap: space.md },
  icon: { width: 90, height: 90, borderRadius: 45, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  title: { fontSize: 30, color: colors.onMaroon, textAlign: "center" },
  text: { fontSize: 15, color: colors.goldSoft, textAlign: "center", lineHeight: 23 },
});
