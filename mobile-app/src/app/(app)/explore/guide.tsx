import { useMemo, useState } from "react";
import { LayoutAnimation, Linking, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/Text";
import { ContentScreen, FadeIn, Picture, RichText } from "@/components/ContentKit";
import { Button, Card, SearchField } from "@/components/ui";
import { filterSections, guideSections, safeExternal, useContent, type GuideContent } from "@/lib/content";
import { useLanguage } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { colors, space } from "@/theme";

/** The Kendra's guide to the app and website, written in Admin (Pages and legal). Sections open one by one; the box above searches them. */
export default function GuideScreen() {
  const { user } = useSession();
  const { t, pick } = useLanguage();
  const [which, setWhich] = useState<"user" | "associate">("user");
  const { data, error, reload, loading } = useContent<GuideContent>(`guide/${which}`, which === "associate");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<number | null>(0);
  const sections = useMemo(() => filterSections(guideSections(data ? pick(data.contentEn, data.contentHi) : ""), query), [data, query, pick]);
  const isAssociate = user?.role === "ASSOCIATE";

  return (
    <ContentScreen loading={loading} error={error} reload={reload}>
      {data ? (
        <>
          <FadeIn>
            <Text serif style={styles.title}>
              {pick(data.titleEn, data.titleHi)}
            </Text>
          </FadeIn>
          {isAssociate ? (
            <Button
              label={which === "user" ? t("associateGuide") : t("guideTitle")}
              variant="outline"
              onPress={() => {
                setWhich(which === "user" ? "associate" : "user");
                setOpen(0);
                setQuery("");
              }}
            />
          ) : null}
          <SearchField value={query} onChangeText={setQuery} placeholder={t("guideSearch")} />
          {sections.map((s, i) => {
            const isOpen = open === i || !!query.trim();
            return (
              <Card key={`${s.number}-${i}`} style={{ padding: 0 }}>
                {s.heading ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ expanded: isOpen }}
                    onPress={() => {
                      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                      setOpen(open === i ? null : i);
                    }}
                    style={styles.row}
                  >
                    {s.number ? <Text style={styles.number}>{s.number}</Text> : null}
                    <Text style={styles.heading}>{s.heading}</Text>
                    <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={20} color={colors.primary} />
                  </Pressable>
                ) : null}
                {isOpen || !s.heading ? (
                  <View style={{ padding: space.lg, paddingTop: s.heading ? 0 : space.lg }}>
                    <RichText text={s.body} />
                  </View>
                ) : null}
              </Card>
            );
          })}
          {data.visuals.map((v) =>
            v.kind === "image" ? (
              <View key={v.url} style={{ gap: space.xs }}>
                <Picture src={v.url} height={220} contain />
                {pick(v.labelEn, v.labelHi) ? <Text style={styles.caption}>{pick(v.labelEn, v.labelHi)}</Text> : null}
              </View>
            ) : safeExternal(v.url) ? (
              <Button key={v.url} label={pick(v.labelEn, v.labelHi) || t("watchVideo")} variant="outline" onPress={() => Linking.openURL(v.url).catch(() => undefined)} />
            ) : null,
          )}
        </>
      ) : null}
    </ContentScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, color: colors.heading, lineHeight: 34 },
  row: { flexDirection: "row", alignItems: "center", gap: space.md, padding: space.lg },
  number: { width: 28, height: 28, borderRadius: 14, textAlign: "center", lineHeight: 28, backgroundColor: colors.goldSoft, color: colors.maroon, fontWeight: "700", fontSize: 14 },
  heading: { flex: 1, fontSize: 15, fontWeight: "700", color: colors.heading, lineHeight: 22 },
  caption: { fontSize: 13, color: colors.textMuted },
});
