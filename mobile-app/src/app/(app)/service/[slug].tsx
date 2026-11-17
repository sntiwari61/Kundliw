import { useState } from "react";
import { Linking, Pressable, Share, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { Text } from "@/components/Text";
import { ContentScreen, FadeIn, Highlight, Picture, RichText } from "@/components/ContentKit";
import { Button, Card, Pill, SectionTitle } from "@/components/ui";
import { useAppConfig } from "@/lib/appConfig";
import { API_URL } from "@/lib/config";
import { safeExternal } from "@/lib/content";
import { useLanguage } from "@/lib/i18n";
import { openLink } from "@/lib/links";
import { dateRange, pickList, serviceShareUrl, useSaved, useServerPage, type ServiceDetail, type ServicePackageDetail, type ServicePlanDetail } from "@/lib/services";
import { formatPaise } from "@/lib/validation";
import { colors, radius, space } from "@/theme";

/** One service in full: what it is, its highlights, every plan with what it gives, packages with dates and seats, samples. Choosing a plan goes to the booking form. */
export default function ServiceScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { t, lang, pick } = useLanguage();
  const { config } = useAppConfig();
  const { data, error, reload, loading } = useServerPage<ServiceDetail>(`/api/mobile/v1/services/${encodeURIComponent(String(slug))}`);
  const { isSaved, toggle } = useSaved();

  const share = () => {
    if (!data) return;
    Share.share({ message: `${t("shareServiceText")}: ${pick(data.titleEn, data.titleHi)}\n${serviceShareUrl(API_URL, data.slug, lang)}` }).catch(() => undefined);
  };

  const book = (plan: ServicePlanDetail) => {
    if (!data) return;
    if (config.allowBooking) router.push({ pathname: "/book", params: { slug: data.slug, plan: plan.slug } });
    else openLink(config.bookingUrl);
  };

  const saved = data ? isSaved(data.slug) : false;

  return (
    <ContentScreen loading={loading} error={error} reload={reload}>
      <Stack.Screen options={{ title: data ? pick(data.titleEn, data.titleHi) : t("services") }} />
      {data ? (
        <>
          <Picture src={data.imageUrl} height={190} />
          <FadeIn>
            <View style={styles.titleRow}>
              <View style={{ flex: 1, gap: space.xs }}>
                <Text serif style={styles.title}>
                  {pick(data.titleEn, data.titleHi)}
                </Text>
                {pick(data.taglineEn, data.taglineHi) ? <Text style={styles.tagline}>{pick(data.taglineEn, data.taglineHi)}</Text> : null}
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel={saved ? t("unsaveService") : t("saveService")} onPress={() => toggle(data.slug)} style={styles.round} hitSlop={8}>
                <Ionicons name={saved ? "heart" : "heart-outline"} size={22} color={saved ? colors.brand : colors.maroon} />
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel={t("share")} onPress={share} style={styles.round} hitSlop={8}>
                <Ionicons name="share-social-outline" size={21} color={colors.maroon} />
              </Pressable>
            </View>
          </FadeIn>

          {pick(data.descriptionEn, data.descriptionHi) ? (
            <FadeIn index={1}>
              <RichText text={pick(data.descriptionEn, data.descriptionHi)} />
            </FadeIn>
          ) : null}

          {pickList(lang, data.highlightsEn, data.highlightsHi).length > 0 ? (
            <FadeIn index={2}>
              <Highlight>
                <Text style={styles.heading}>{t("highlights")}</Text>
                <Bullets items={pickList(lang, data.highlightsEn, data.highlightsHi)} />
              </Highlight>
            </FadeIn>
          ) : null}

          {data.packages.length > 0 ? (
            <>
              <SectionTitle>{t("packagesTitle")}</SectionTitle>
              {data.packages.map((p) => (
                <PackageCard key={p.id} pack={p} />
              ))}
            </>
          ) : null}

          <SectionTitle>{t("choosePlan")}</SectionTitle>
          {data.plans.length === 0 ? <Text style={styles.note}>{t("noPlans")}</Text> : null}
          {data.plans.map((p, i) => (
            <FadeIn key={p.id} index={i}>
              <PlanCard plan={p} onBook={() => book(p)} bookLabel={config.allowBooking ? t("bookThisPlan") : t("bookOnWebsite")} />
            </FadeIn>
          ))}

          {pick(data.notesEn, data.notesHi) ? (
            <Card>
              <Text style={styles.heading}>{t("goodToKnow")}</Text>
              <RichText text={pick(data.notesEn, data.notesHi)} />
            </Card>
          ) : null}
          {pick(data.samagriEn, data.samagriHi) ? (
            <Card>
              <Text style={styles.heading}>{t("samagriTitle")}</Text>
              <RichText text={pick(data.samagriEn, data.samagriHi)} />
            </Card>
          ) : null}
          {pick(data.itineraryEn, data.itineraryHi) ? (
            <Card>
              <Text style={styles.heading}>{t("programTitle")}</Text>
              <RichText text={pick(data.itineraryEn, data.itineraryHi)} />
            </Card>
          ) : null}

          {safeExternal(data.youtubeUrl) ? <Button label={t("watchVideo")} variant="outline" onPress={() => Linking.openURL(data.youtubeUrl as string).catch(() => undefined)} /> : null}
          {data.demos.length + data.links.length > 0 ? (
            <Card>
              <Text style={styles.heading}>{t("demosTitle")}</Text>
              {data.demos.map((d) => (
                <Button key={d.url} label={pick(d.labelEn, d.labelHi) || t("openLink")} variant="outline" onPress={() => Linking.openURL(d.url).catch(() => undefined)} />
              ))}
              {data.links.map((l) => (
                <Button key={l.url} label={pick(l.labelEn, l.labelHi) || t("openLink")} variant="outline" onPress={() => Linking.openURL(l.url).catch(() => undefined)} />
              ))}
            </Card>
          ) : null}
        </>
      ) : null}
    </ContentScreen>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <View style={{ gap: space.xs }}>
      {items.map((x, i) => (
        <View key={`${i}-${x}`} style={styles.bulletRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>{x}</Text>
        </View>
      ))}
    </View>
  );
}

function PlanCard({ plan: p, onBook, bookLabel }: { plan: ServicePlanDetail; onBook: () => void; bookLabel: string }) {
  const { t, lang, pick } = useLanguage();
  const [open, setOpen] = useState(false);
  const facts = [
    p.deliveryDays ? `${t("deliveryIn")} ${p.deliveryDays} ${t("days")}` : "",
    p.pages ? `${p.pages} ${t("pagesWord")}` : "",
    p.hasCall ? (p.callDurationMinutes ? `${t("callOf")} ${p.callDurationMinutes} ${t("minutes")}` : t("includesCall")) : "",
  ].filter(Boolean);
  const features = pickList(lang, p.featuresEn, p.featuresHi);
  const more = [
    { key: "d", title: "", text: pick(p.descriptionEn, p.descriptionHi) },
    { key: "p", title: t("programTitle"), text: pick(p.programEn, p.programHi) },
    { key: "r", title: t("preparationTitle"), text: pick(p.preparationEn, p.preparationHi) },
    { key: "s", title: t("samagriTitle"), text: pick(p.samagriEn, p.samagriHi) },
  ].filter((m) => m.text);
  return (
    <Card style={p.isPopular ? { borderColor: colors.gold, borderWidth: 2 } : undefined}>
      <View style={styles.planHead}>
        <Text style={[styles.planTitle, { flex: 1 }]}>{pick(p.titleEn, p.titleHi)}</Text>
        {p.isPopular ? <Pill label={t("popular")} tone="warning" /> : null}
      </View>
      <View style={styles.priceRow}>
        <Text style={styles.price}>{formatPaise(p.pricePaise)}</Text>
        {p.originalPricePaise && p.originalPricePaise > p.pricePaise ? <Text style={styles.was}>{formatPaise(p.originalPricePaise)}</Text> : null}
      </View>
      {facts.map((f) => (
        <Text key={f} style={styles.fact}>
          • {f}
        </Text>
      ))}
      {features.length > 0 ? (
        <>
          <Text style={styles.subHeading}>{t("planFeatures")}</Text>
          <Bullets items={features} />
        </>
      ) : null}
      {more.length > 0 ? (
        <>
          {open
            ? more.map((m) => (
                <View key={m.key} style={{ gap: space.xs }}>
                  {m.title ? <Text style={styles.subHeading}>{m.title}</Text> : null}
                  <RichText text={m.text} />
                </View>
              ))
            : null}
          <Button label={open ? t("planLess") : t("planMore")} variant="text" onPress={() => setOpen((v) => !v)} />
        </>
      ) : null}
      <Button label={bookLabel} onPress={onBook} />
    </Card>
  );
}

function PackageCard({ pack: k }: { pack: ServicePackageDetail }) {
  const { t, lang, pick } = useLanguage();
  const range = dateRange(k.startDate, k.endDate);
  const status = k.availability?.status;
  const seats = k.availability?.seatsLeft;
  const lists: { key: string; title: string; items: string[] }[] = [
    { key: "i", title: t("inclusions"), items: pickList(lang, k.inclusionsEn, k.inclusionsHi) },
    { key: "e", title: t("exclusions"), items: pickList(lang, k.exclusionsEn, k.exclusionsHi) },
    { key: "m", title: t("materialsTitle"), items: pickList(lang, k.materialsEn, k.materialsHi) },
  ].filter((l) => l.items.length > 0);
  return (
    <Card>
      <Picture src={k.imageUrl} height={140} />
      <Text style={styles.planTitle}>{pick(k.titleEn, k.titleHi)}</Text>
      <View style={styles.pills}>
        {k.numberOfDays ? <Pill label={`${k.numberOfDays} ${t("days")}`} tone="brand" /> : null}
        {range ? <Pill label={range} tone="neutral" /> : null}
        {status && status !== "open" ? <Pill label={k.availability.reason === "full" ? t("packageFull") : t("packageClosed")} tone="error" /> : seats != null && seats <= 10 ? <Pill label={`${seats} ${t("seatsLeft")}`} tone="warning" /> : null}
      </View>
      {pick(k.descriptionEn, k.descriptionHi) ? <RichText text={pick(k.descriptionEn, k.descriptionHi)} /> : null}
      {k.days.map((d, i) => (
        <View key={i} style={styles.day}>
          <Text style={styles.subHeading}>{`${t("dayLabel")} ${i + 1}${pick(d.titleEn, d.titleHi) ? ` · ${pick(d.titleEn, d.titleHi)}` : ""}`}</Text>
          {pick(d.detailsEn, d.detailsHi) ? <RichText text={pick(d.detailsEn, d.detailsHi)} /> : null}
        </View>
      ))}
      {lists.map((l) => (
        <View key={l.key} style={{ gap: space.xs }}>
          <Text style={styles.subHeading}>{l.title}</Text>
          <Bullets items={l.items} />
        </View>
      ))}
      {safeExternal(k.youtubeUrl) ? <Button label={t("watchVideo")} variant="outline" onPress={() => Linking.openURL(k.youtubeUrl as string).catch(() => undefined)} /> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: space.sm },
  title: { fontSize: 26, color: colors.heading, lineHeight: 34 },
  tagline: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  round: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.goldSoft, alignItems: "center", justifyContent: "center" },
  heading: { fontSize: 16, fontWeight: "700", color: colors.heading },
  subHeading: { fontSize: 14, fontWeight: "700", color: colors.maroon },
  note: { fontSize: 14, color: colors.textMuted },
  bulletRow: { flexDirection: "row", gap: space.sm },
  bullet: { fontSize: 15, color: colors.brand, lineHeight: 22 },
  bulletText: { flex: 1, fontSize: 15, color: colors.text, lineHeight: 22 },
  planHead: { flexDirection: "row", alignItems: "center", gap: space.sm },
  planTitle: { fontSize: 17, fontWeight: "700", color: colors.heading },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: space.sm },
  price: { fontSize: 24, fontWeight: "800", color: colors.primary },
  was: { fontSize: 14, color: colors.textMuted, textDecorationLine: "line-through" },
  fact: { fontSize: 14, color: colors.text },
  pills: { flexDirection: "row", gap: space.sm, flexWrap: "wrap" },
  day: { gap: space.xs, borderLeftWidth: 3, borderLeftColor: colors.gold, paddingLeft: space.md, borderRadius: radius.sm },
});
