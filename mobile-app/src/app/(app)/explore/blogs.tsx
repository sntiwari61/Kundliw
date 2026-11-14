import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Text } from "@/components/Text";
import { ContentScreen, FadeIn, Picture } from "@/components/ContentKit";
import { TapCard } from "@/components/ui";
import { plainText, useContent, type BlogListContent } from "@/lib/content";
import { useLanguage } from "@/lib/i18n";
import { colors, space } from "@/theme";

export default function BlogsScreen() {
  const { pick, t } = useLanguage();
  const { data, error, reload, loading } = useContent<BlogListContent>("blogs");
  return (
    <ContentScreen loading={loading} error={error} reload={reload} empty={!!data && data.posts.length === 0}>
      {data?.posts.map((p, i) => {
        const excerpt = plainText(pick(p.excerptEn ?? "", p.excerptHi ?? ""));
        return (
          <FadeIn key={p.slug} index={i}>
            <TapCard onPress={() => router.push(`/explore/blog/${encodeURIComponent(p.slug)}` as never)} style={{ padding: 0, overflow: "hidden" }}>
              <Picture src={p.coverImage} height={150} />
              <View style={{ padding: space.lg, gap: space.xs }}>
                <Text style={styles.title}>{pick(p.titleEn, p.titleHi)}</Text>
                {excerpt ? (
                  <Text style={styles.excerpt} numberOfLines={3}>
                    {excerpt}
                  </Text>
                ) : null}
                <Text style={styles.more}>{t("readArticle")}</Text>
              </View>
            </TapCard>
          </FadeIn>
        );
      })}
    </ContentScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 17, fontWeight: "700", color: colors.heading, lineHeight: 24 },
  excerpt: { fontSize: 14, color: colors.textMuted, lineHeight: 21 },
  more: { fontSize: 13, fontWeight: "600", color: colors.primary, marginTop: space.xs },
});
