import { Linking, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/Text";
import { ContentScreen, FadeIn, Picture } from "@/components/ContentKit";
import { Button, Card } from "@/components/ui";
import { safeExternal, useContent, type TestimonialsContent } from "@/lib/content";
import { useLanguage } from "@/lib/i18n";
import { colors, space } from "@/theme";

export default function TestimonialsScreen() {
  const { pick, t } = useLanguage();
  const { data, error, reload, loading } = useContent<TestimonialsContent>("testimonials");
  return (
    <ContentScreen loading={loading} error={error} reload={reload} empty={!!data && data.items.length === 0}>
      {data?.items.map((x, i) => (
        <FadeIn key={x.id} index={i}>
          <Card>
            <View style={styles.stars} accessibilityLabel={`${x.rating} / 5`}>
              {Array.from({ length: 5 }, (_, k) => (
                <Ionicons key={k} name={k < x.rating ? "star" : "star-outline"} size={16} color={colors.gold} />
              ))}
            </View>
            <Text style={styles.quote}>{`“${pick(x.quoteEn, x.quoteHi)}”`}</Text>
            <View style={styles.author}>
              {x.photoUrl ? (
                <View style={{ width: 44 }}>
                  <Picture src={x.photoUrl} height={44} round />
                </View>
              ) : null}
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{pick(x.authorNameEn, x.authorNameHi)}</Text>
                <Text style={styles.meta}>{[pick(x.authorTitleEn, x.authorTitleHi), pick(x.cityEn, x.cityHi)].filter(Boolean).join(" · ")}</Text>
              </View>
            </View>
            {safeExternal(x.youtubeUrl) ? <Button label={t("watchVideo")} variant="text" onPress={() => Linking.openURL(x.youtubeUrl as string).catch(() => undefined)} /> : null}
          </Card>
        </FadeIn>
      ))}
    </ContentScreen>
  );
}

const styles = StyleSheet.create({
  stars: { flexDirection: "row", gap: 2 },
  quote: { fontSize: 15, lineHeight: 24, color: colors.text, fontStyle: "italic" },
  author: { flexDirection: "row", alignItems: "center", gap: space.md },
  name: { fontSize: 14, fontWeight: "700", color: colors.heading },
  meta: { fontSize: 12, color: colors.textMuted },
});
