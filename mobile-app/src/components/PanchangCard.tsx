import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Text } from "@/components/Text";
import { FadeIn } from "@/components/ContentKit";
import { Button } from "@/components/ui";
import { useLanguage } from "@/lib/i18n";
import { panchangFacts, tithiLine, type Panchang } from "@/lib/panchang";
import { useServerPage } from "@/lib/services";
import { colors, radius, space } from "@/theme";

/** Today's Panchang (tithi, nakshatra, yoga, karana, sunrise, Rahu Kaal ...) from the website's own calculation. Hidden when it cannot be loaded. */
export function PanchangCard() {
  const { t, lang } = useLanguage();
  const { data } = useServerPage<{ success: boolean; panchang: Panchang }>("/api/astro/panchang");
  const p = data?.success ? data.panchang : null;
  if (!p) return null;
  const facts = panchangFacts(p);
  return (
    <FadeIn>
      <LinearGradient colors={["#800000", "#5C0000"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
        <Text style={styles.kicker}>{t("panchangToday")}</Text>
        <Text serif style={styles.date}>
          {[p.vaar, p.date].filter(Boolean).join(" · ")}
        </Text>
        <Text style={styles.tithi}>{`${t("tithiLabel")}: ${tithiLine(p, lang)}`}</Text>
        <View style={styles.grid}>
          {facts.map((f) => (
            <View key={f.key} style={styles.cell}>
              <Text style={styles.cellLabel}>{t(f.key)}</Text>
              <Text style={styles.cellValue}>{f.value}</Text>
            </View>
          ))}
        </View>
        <Button label={t("fullPanchang")} variant="outline" onPress={() => router.push("/explore/tool/panchang" as never)} />
      </LinearGradient>
    </FadeIn>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: space.lg, gap: space.sm },
  kicker: { fontSize: 12, fontWeight: "700", letterSpacing: 1, color: colors.gold, textTransform: "uppercase" },
  date: { fontSize: 22, color: colors.onMaroon },
  tithi: { fontSize: 15, color: colors.goldSoft, fontWeight: "600" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: space.sm, marginVertical: space.sm },
  cell: { width: "48%", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: radius.md, padding: space.sm, gap: 2 },
  cellLabel: { fontSize: 11, color: colors.goldSoft, fontWeight: "600" },
  cellValue: { fontSize: 14, color: colors.onMaroon, fontWeight: "600" },
});
