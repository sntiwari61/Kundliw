import { Image, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pill, TapCard } from "@/components/ui";
import { Text } from "@/components/Text";
import type { CatalogService } from "@/lib/booking";
import { imageUri } from "@/lib/content";
import { useLanguage } from "@/lib/i18n";
import { useSaved } from "@/lib/services";
import { formatPaise } from "@/lib/validation";
import { colors, radius, space } from "@/theme";

/** One service in a list: its name, starting price and number of plans. Tapping opens its plans. */
export function ServiceCard({ service }: { service: CatalogService }) {
  const { t, lang, pick } = useLanguage();
  const { isSaved, toggle } = useSaved();
  const saved = isSaved(service.slug);
  const min = service.plans.length ? Math.min(...service.plans.map((p) => p.pricePaise)) : null;
  const count = service.plans.length;
  return (
    <TapCard onPress={() => router.push({ pathname: "/service/[slug]", params: { slug: service.slug } })} style={styles.card}>
      {service.imageUrl ? (
        <Image source={{ uri: imageUri(service.imageUrl) }} style={styles.thumb} resizeMode="cover" accessibilityIgnoresInvertColors />
      ) : (
        <View style={styles.icon}>
          <Ionicons name="sparkles" size={22} color={colors.maroon} />
        </View>
      )}
      <View style={{ flex: 1, gap: space.xs }}>
        <Text style={styles.title}>{pick(service.titleEn, service.titleHi)}</Text>
        {pick(service.taglineEn ?? "", service.taglineHi ?? "") ? (
          <Text style={styles.tagline} numberOfLines={2}>
            {pick(service.taglineEn ?? "", service.taglineHi ?? "")}
          </Text>
        ) : null}
        <View style={styles.meta}>
          {min !== null ? <Pill label={`${t("from")} ${formatPaise(min)}`} tone="brand" /> : null}
          <Text style={styles.count}>
            {count} {lang === "en" && count === 1 ? t("plan") : t("plans")}
          </Text>
        </View>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={saved ? t("unsaveService") : t("saveService")} onPress={() => toggle(service.slug)} hitSlop={10} style={styles.heart}>
        <Ionicons name={saved ? "heart" : "heart-outline"} size={22} color={saved ? colors.brand : colors.outline} />
      </Pressable>
    </TapCard>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: space.md },
  icon: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.goldSoft, alignItems: "center", justifyContent: "center" },
  thumb: { width: 64, height: 64, borderRadius: radius.md, backgroundColor: colors.surfaceContainer },
  heart: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  tagline: { fontSize: 12, color: colors.textMuted, lineHeight: 17 },
  title: { fontSize: 15, fontWeight: "600", color: colors.heading, lineHeight: 22 },
  meta: { flexDirection: "row", alignItems: "center", gap: space.sm, flexWrap: "wrap" },
  count: { fontSize: 12, color: colors.textMuted },
});
