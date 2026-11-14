import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pill, TapCard } from "@/components/ui";
import { Text } from "@/components/Text";
import type { CatalogService } from "@/lib/booking";
import { useLanguage } from "@/lib/i18n";
import { formatPaise } from "@/lib/validation";
import { colors, radius, space } from "@/theme";

/** One service in a list: its name, starting price and number of plans. Tapping opens its plans. */
export function ServiceCard({ service }: { service: CatalogService }) {
  const { t, lang, pick } = useLanguage();
  const min = service.plans.length ? Math.min(...service.plans.map((p) => p.pricePaise)) : null;
  const count = service.plans.length;
  return (
    <TapCard onPress={() => router.push({ pathname: "/service/[slug]", params: { slug: service.slug } })} style={styles.card}>
      <View style={styles.icon}>
        <Ionicons name="sparkles" size={22} color={colors.maroon} />
      </View>
      <View style={{ flex: 1, gap: space.xs }}>
        <Text style={styles.title}>{pick(service.titleEn, service.titleHi)}</Text>
        <View style={styles.meta}>
          {min !== null ? <Pill label={`${t("from")} ${formatPaise(min)}`} tone="brand" /> : null}
          <Text style={styles.count}>
            {count} {lang === "en" && count === 1 ? t("plan") : t("plans")}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.outline} />
    </TapCard>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: space.md },
  icon: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.goldSoft, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 15, fontWeight: "600", color: colors.heading, lineHeight: 22 },
  meta: { flexDirection: "row", alignItems: "center", gap: space.sm, flexWrap: "wrap" },
  count: { fontSize: 12, color: colors.textMuted },
});
