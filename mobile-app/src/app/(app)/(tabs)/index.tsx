import { useState } from "react";
import { Linking, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Hero } from "@/components/Hero";
import { LangChip } from "@/components/LangChip";
import { ServiceCard } from "@/components/ServiceCard";
import { Text } from "@/components/Text";
import { FadeIn, TileLink } from "@/components/ContentKit";
import { Button, ErrorText, SectionTitle, SkeletonList } from "@/components/ui";
import { useLanguage } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { useCatalog } from "@/lib/useCatalog";
import { colors, radius, shadow, space } from "@/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

export default function HomeScreen() {
  const { user } = useSession();
  const { t } = useLanguage();
  const { catalog, error, reload, loading } = useCatalog();
  const [refreshing, setRefreshing] = useState(false);
  const isAssociate = user?.role === "ASSOCIATE";

  const tiles: { icon: IconName; label: string; go: () => void }[] = [
    { icon: "sparkles", label: t("tabServices"), go: () => router.push("/services") },
    isAssociate
      ? { icon: "stats-chart", label: t("tabDashboard"), go: () => router.push("/dashboard") }
      : { icon: "receipt", label: t("tabOrders"), go: () => router.push("/orders") },
    { icon: "folder-open", label: t("tabVault"), go: () => router.push("/vault") },
    { icon: "chatbubbles", label: t("support"), go: () => router.push("/tickets") },
  ];

  const explore: { icon: IconName; label: string; path: string }[] = [
    { icon: "planet", label: t("kundliTool"), path: "/explore/tool/kundli" },
    { icon: "calendar", label: t("panchangTool"), path: "/explore/tool/panchang" },
    { icon: "heart-circle", label: t("matchingTool"), path: "/explore/tool/matching" },
    { icon: "create", label: t("requestKundli"), path: "/explore/request/kundli" },
    { icon: "help-buoy", label: t("requestPrashna"), path: "/explore/request/prashna" },
    { icon: "information-circle", label: t("aboutUs"), path: "/explore/about" },
    { icon: "person-circle", label: t("founderTitle"), path: "/explore/founder" },
    { icon: "pricetags", label: t("offersTitle"), path: "/explore/offers" },
    { icon: "images", label: t("galleryTitle"), path: "/explore/gallery" },
    { icon: "book", label: t("blogsTitle"), path: "/explore/blogs" },
    { icon: "heart", label: t("testimonialsTitle"), path: "/explore/testimonials" },
    { icon: "help-circle", label: t("faqTitle"), path: "/explore/faq" },
    { icon: "call", label: t("contactTitle"), path: "/explore/contact" },
  ];

  const onRefresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: space.xxl }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
    >
      <Hero title={`${t("namaste")}, ${user?.name?.split(" ")[0] || ""}`.replace(/,\s*$/, "")} subtitle={t("homeSub")} right={<LangChip />}>
        <Text serif style={styles.shloka}>
          ॐ असतो मा सद्गमय। तमसो मा ज्योतिर्गमय।
        </Text>
      </Hero>

      <View style={styles.body}>
        <View style={styles.tiles}>
          {tiles.map((tile) => (
            <Pressable
              key={tile.label}
              accessibilityRole="button"
              accessibilityLabel={tile.label}
              onPress={tile.go}
              style={({ pressed }) => [styles.tile, pressed && { transform: [{ scale: 0.96 }] }]}
            >
              <View style={styles.tileIcon}>
                <Ionicons name={tile.icon} size={24} color={colors.maroon} />
              </View>
              <Text style={styles.tileLabel} numberOfLines={2}>
                {tile.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <SectionTitle
          action={
            <Pressable onPress={() => router.push("/services")} accessibilityRole="button">
              <Text style={styles.seeAll}>{t("seeAll")}</Text>
            </Pressable>
          }
        >
          {t("ourServices")}
        </SectionTitle>

        <ErrorText>{error}</ErrorText>
        {error ? <Button label={t("retry")} variant="outline" onPress={reload} /> : null}
        {loading ? <SkeletonList count={3} /> : null}
        {catalog?.services.slice(0, 3).map((s) => <ServiceCard key={s.slug} service={s} />)}
        {catalog && catalog.services.length === 0 ? <Text style={styles.note}>{t("noServices")}</Text> : null}

        <SectionTitle>{t("explore")}</SectionTitle>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.md, paddingVertical: space.xs, paddingRight: space.lg }}>
          {explore.map((e, i) => (
            <FadeIn key={e.path} index={i}>
              <TileLink icon={<Ionicons name={e.icon} size={22} color={colors.maroon} />} title={e.label} onPress={() => router.push(e.path as never)} />
            </FadeIn>
          ))}
        </ScrollView>

        <Button label={t("contactUs")} variant="outline" onPress={() => Linking.openURL("tel:+919827991224")} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  shloka: { fontSize: 18, color: colors.goldSoft, lineHeight: 26 },
  body: { padding: space.lg, gap: space.lg },
  tiles: { flexDirection: "row", gap: space.md, marginTop: -space.xl },
  tile: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingVertical: space.md,
    paddingHorizontal: space.xs,
    alignItems: "center",
    gap: space.sm,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    ...shadow.strong,
  },
  tileIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.goldSoft, alignItems: "center", justifyContent: "center" },
  tileLabel: { fontSize: 12, fontWeight: "600", color: colors.heading, textAlign: "center" },
  seeAll: { fontSize: 13, fontWeight: "600", color: colors.primary },
  note: { fontSize: 14, color: colors.textMuted },
});
