import { Linking, StyleSheet, View } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { Text } from "@/components/Text";
import { ContentScreen, FadeIn, Picture, RichText } from "@/components/ContentKit";
import { Button, Card, Pill } from "@/components/ui";
import { safeExternal } from "@/lib/content";
import { useLanguage } from "@/lib/i18n";
import { dateRange, useServerPage, type OtherServiceDetail } from "@/lib/services";
import { colors, space } from "@/theme";

/** One card of the Kendra's "other services" (tours, matrimony and the like): what it is, the day-by-day programme, dates and where to join or book. */
export default function OtherServiceScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { t, pick } = useLanguage();
  const { data, error, reload, loading } = useServerPage<OtherServiceDetail>(`/api/mobile/v1/content/other/${encodeURIComponent(String(slug))}`);
  const open = (url: string | null) => {
    const href = safeExternal(url);
    if (href) Linking.openURL(href).catch(() => undefined);
  };
  const range = data ? dateRange(data.startDate, data.endDate) : null;

  return (
    <ContentScreen loading={loading} error={error} reload={reload}>
      <Stack.Screen options={{ title: data ? pick(data.titleEn, data.titleHi) : t("explore") }} />
      {data ? (
        <>
          <Picture src={data.imageUrl} height={200} />
          <FadeIn>
            <Text serif style={styles.title}>
              {pick(data.titleEn, data.titleHi)}
            </Text>
            {pick(data.taglineEn, data.taglineHi) ? <Text style={styles.tagline}>{pick(data.taglineEn, data.taglineHi)}</Text> : null}
          </FadeIn>
          <View style={styles.pills}>
            {pick(data.natureEn, data.natureHi) ? <Pill label={pick(data.natureEn, data.natureHi)} tone="brand" /> : null}
            {data.numberOfDays ? <Pill label={`${data.numberOfDays} ${t("days")}`} tone="neutral" /> : null}
            {range ? <Pill label={range} tone="neutral" /> : null}
          </View>
          <FadeIn index={1}>
            <RichText text={pick(data.descriptionEn, data.descriptionHi)} />
          </FadeIn>

          {data.days.length > 0 ? (
            <Card>
              <Text style={styles.heading}>{t("programTitle")}</Text>
              {data.days.map((d, i) => (
                <View key={i} style={styles.day}>
                  <Text style={styles.sub}>{`${t("dayLabel")} ${i + 1}${pick(d.titleEn, d.titleHi) ? ` · ${pick(d.titleEn, d.titleHi)}` : ""}`}</Text>
                  {pick(d.detailsEn, d.detailsHi) ? <RichText text={pick(d.detailsEn, d.detailsHi)} /> : null}
                </View>
              ))}
            </Card>
          ) : null}

          {data.serviceSlug ? <Button label={t("bookThisService")} onPress={() => router.push({ pathname: "/service/[slug]", params: { slug: data.serviceSlug as string } })} /> : null}
          {data.actionUrl ? <Button label={pick(data.actionTextEn, data.actionTextHi) || t("openLink")} variant={data.serviceSlug ? "outline" : "filled"} onPress={() => open(data.actionUrl)} /> : null}
          {data.whatsappGroupUrl ? <Button label={t("joinGroup")} variant="outline" onPress={() => open(data.whatsappGroupUrl)} /> : null}
          {data.facebookUrl ? <Button label={t("facebookPage")} variant="outline" onPress={() => open(data.facebookUrl)} /> : null}
          {data.youtubeUrl ? <Button label={t("watchVideo")} variant="outline" onPress={() => open(data.youtubeUrl)} /> : null}
          {data.demos.length + data.links.length > 0 ? (
            <Card>
              <Text style={styles.heading}>{t("demosTitle")}</Text>
              {data.demos.map((d) => (
                <Button key={d.url} label={pick(d.labelEn, d.labelHi) || t("openLink")} variant="outline" onPress={() => open(d.url)} />
              ))}
              {data.links.map((l) => (
                <Button key={l.url} label={pick(l.labelEn, l.labelHi) || t("openLink")} variant="outline" onPress={() => open(l.url)} />
              ))}
            </Card>
          ) : null}
        </>
      ) : null}
    </ContentScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, color: colors.heading, lineHeight: 34 },
  tagline: { fontSize: 14, color: colors.textMuted, lineHeight: 20, marginTop: space.xs },
  pills: { flexDirection: "row", gap: space.sm, flexWrap: "wrap" },
  heading: { fontSize: 16, fontWeight: "700", color: colors.heading },
  sub: { fontSize: 14, fontWeight: "700", color: colors.maroon },
  day: { gap: space.xs, borderLeftWidth: 3, borderLeftColor: colors.gold, paddingLeft: space.md },
});
