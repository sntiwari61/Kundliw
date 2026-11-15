import { useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Hero } from "@/components/Hero";
import { LangChip } from "@/components/LangChip";
import { ServiceCard } from "@/components/ServiceCard";
import { Text } from "@/components/Text";
import { FadeIn, TileLink } from "@/components/ContentKit";
import {
  AboutBlock,
  ContactBlock,
  FaqBlock,
  FloatingButtons,
  GalleryStrip,
  NoticeStrip,
  OffersRow,
  OtherServicesRow,
  PostsBlock,
  ReviewsBlock,
  SlideShow,
  StepsBlock,
  TipsBlock,
  WhyBlock,
} from "@/components/HomeBlocks";
import { Button, ErrorText, SectionTitle, SkeletonList } from "@/components/ui";
import { isOn, pickText, useHome } from "@/lib/home";
import { HEADINGS } from "@/lib/homeDefaults";
import { useLanguage } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { useCatalog } from "@/lib/useCatalog";
import { colors, radius, shadow, space } from "@/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

/** The Home screen. Every block is switched on or off, and worded, from the website's admin panel (Settings > Android app and the home page settings). */
export default function HomeScreen() {
  const { user } = useSession();
  const { t, lang } = useLanguage();
  const l = lang === "hi" ? "hi" : "en";
  const { catalog, error, reload, loading } = useCatalog();
  const home = useHome();
  const [refreshing, setRefreshing] = useState(false);
  const isAssociate = user?.role === "ASSOCIATE";
  const app = home.data?.app;
  const on = (key: string) => isOn(app, key);

  const tiles: { icon: IconName; label: string; go: () => void }[] = [
    { icon: "sparkles", label: t("tabServices"), go: () => router.push("/services") },
    isAssociate
      ? { icon: "stats-chart", label: t("tabDashboard"), go: () => router.push("/dashboard") }
      : { icon: "receipt", label: t("tabOrders"), go: () => router.push("/orders") },
    { icon: "folder-open", label: t("tabVault"), go: () => router.push("/vault") },
    { icon: "chatbubbles", label: t("support"), go: () => router.push("/tickets") },
  ];

  const exploreAll: { key: string; icon: IconName; label: string; path: string }[] = [
    { key: "toolKundli", icon: "planet", label: t("kundliTool"), path: "/explore/tool/kundli" },
    { key: "toolPanchang", icon: "calendar", label: t("panchangTool"), path: "/explore/tool/panchang" },
    { key: "toolMatching", icon: "heart-circle", label: t("matchingTool"), path: "/explore/tool/matching" },
    { key: "toolRequestKundli", icon: "create", label: t("requestKundli"), path: "/explore/request/kundli" },
    { key: "toolPrashna", icon: "help-buoy", label: t("requestPrashna"), path: "/explore/request/prashna" },
    { key: "pageAbout", icon: "information-circle", label: t("aboutUs"), path: "/explore/about" },
    { key: "pageFounder", icon: "person-circle", label: t("founderTitle"), path: "/explore/founder" },
    { key: "pageOffers", icon: "pricetags", label: t("offersTitle"), path: "/explore/offers" },
    { key: "pageGallery", icon: "images", label: t("galleryTitle"), path: "/explore/gallery" },
    { key: "pageBlogs", icon: "book", label: t("blogsTitle"), path: "/explore/blogs" },
    { key: "pageTestimonials", icon: "heart", label: t("testimonialsTitle"), path: "/explore/testimonials" },
    { key: "pageFaq", icon: "help-circle", label: t("faqTitle"), path: "/explore/faq" },
    { key: "pageContact", icon: "call", label: t("contactTitle"), path: "/explore/contact" },
  ];
  const explore = exploreAll.filter((e) => isOn(app, e.key));

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([reload(), home.reload()]);
    setRefreshing(false);
  };

  const first = user?.name?.split(" ")[0] || "";
  const greeting = first ? `${t("namaste")}, ${first}` : t("namaste");
  const data = home.data;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: space.xxl * 3 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
      >
        <Hero title={greeting} subtitle={pickText(app, "greetingSub", l, t("homeSub"))} right={<LangChip />}>
          <Text serif style={styles.shloka}>
            {pickText(app, "shloka", l, "ॐ असतो मा सद्गमय। तमसो मा ज्योतिर्गमय।")}
          </Text>
        </Hero>

        <View style={styles.body}>
          {on("showQuickTiles") ? (
            <View style={styles.tiles}>
              {tiles.map((tile) => (
                <Pressable key={tile.label} accessibilityRole="button" accessibilityLabel={tile.label} onPress={tile.go} style={({ pressed }) => [styles.tile, pressed && { transform: [{ scale: 0.96 }] }]}>
                  <View style={styles.tileIcon}>
                    <Ionicons name={tile.icon} size={24} color={colors.maroon} />
                  </View>
                  <Text style={styles.tileLabel} numberOfLines={2}>
                    {tile.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          {home.loading ? <SkeletonList count={2} height={200} /> : null}
          {home.error && !data ? (
            <>
              <ErrorText>{home.error}</ErrorText>
              <Button label={t("retry")} variant="outline" onPress={home.reload} />
            </>
          ) : null}
        </View>

        {data && on("showSlides") ? <SlideShow data={data} /> : null}

        <View style={styles.body}>
          {data && on("showAnnouncement") ? <NoticeStrip notices={data.notices} /> : null}
          {data && on("showOffers") ? <OffersRow data={data} /> : null}

          {on("showFeaturedServices") || !data ? (
            <>
              <SectionTitle
                action={
                  <Pressable onPress={() => router.push("/services")} accessibilityRole="button">
                    <Text style={styles.seeAll}>{t("seeAll")}</Text>
                  </Pressable>
                }
              >
                {pickText(data?.servicesCfg, "servicesTitle", l, HEADINGS.services[l])}
              </SectionTitle>
              <ErrorText>{error}</ErrorText>
              {error ? <Button label={t("retry")} variant="outline" onPress={reload} /> : null}
              {loading ? <SkeletonList count={3} /> : null}
              {catalog?.services.slice(0, 4).map((s, i) => (
                <FadeIn key={s.slug} index={i}>
                  <ServiceCard service={s} />
                </FadeIn>
              ))}
              {catalog && catalog.services.length === 0 ? <Text style={styles.note}>{t("noServices")}</Text> : null}
            </>
          ) : null}

          {data && on("showOtherServices") ? <OtherServicesRow data={data} /> : null}

          {data && on("showExplore") && explore.length > 0 ? (
            <>
              <SectionTitle>{t("explore")}</SectionTitle>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.md, paddingVertical: space.xs, paddingRight: space.lg }}>
                {explore.map((e, i) => (
                  <FadeIn key={e.path} index={i}>
                    <TileLink icon={<Ionicons name={e.icon} size={22} color={colors.maroon} />} title={e.label} onPress={() => router.push(e.path as never)} />
                  </FadeIn>
                ))}
              </ScrollView>
            </>
          ) : null}

          {data && on("showAboutBlock") ? <AboutBlock data={data} /> : null}
          {data && on("showWhyBlock") ? <WhyBlock data={data} /> : null}
          {data && on("showStepsBlock") ? <StepsBlock data={data} /> : null}
          {data && on("showReviewsBlock") ? <ReviewsBlock data={data} /> : null}
          {data && on("showTipsBlock") ? <TipsBlock data={data} /> : null}
          {data && on("showGalleryBlock") ? <GalleryStrip data={data} /> : null}
          {data && on("showBlogBlock") ? <PostsBlock data={data} /> : null}
          {data && on("showFaqBlock") ? <FaqBlock data={data} /> : null}
          {data && on("showContactBlock") ? <ContactBlock data={data} /> : null}
        </View>
      </ScrollView>
      {data ? <FloatingButtons data={data} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  shloka: { fontSize: 18, color: colors.goldSoft, lineHeight: 26 },
  body: { padding: space.lg, gap: space.xl },
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
  tileLabel: { alignSelf: "stretch", fontSize: 12, lineHeight: 18, fontWeight: "600", color: colors.heading, textAlign: "center" },
  seeAll: { fontSize: 13, fontWeight: "600", color: colors.primary },
  note: { fontSize: 14, color: colors.textMuted },
});
