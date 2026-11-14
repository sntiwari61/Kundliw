import { Linking, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Text } from "@/components/Text";
import { ContentScreen, FadeIn, Picture, RichText } from "@/components/ContentKit";
import { Button } from "@/components/ui";
import { safeExternal, useContent, type BlogPostContent } from "@/lib/content";
import { useLanguage } from "@/lib/i18n";
import { colors, space } from "@/theme";

export default function BlogPostScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { t, pick } = useLanguage();
  const { data, error, reload, loading } = useContent<BlogPostContent>(`blog/${encodeURIComponent(String(slug))}`);
  return (
    <ContentScreen loading={loading} error={error} reload={reload}>
      {data ? (
        <>
          <Picture src={data.coverImage} height={200} />
          <FadeIn>
            <Text serif style={styles.title}>
              {pick(data.titleEn, data.titleHi)}
            </Text>
          </FadeIn>
          <FadeIn index={1}>
            <RichText text={pick(data.contentEn, data.contentHi)} />
          </FadeIn>
          {safeExternal(data.youtubeUrl) ? <Button label={t("watchVideo")} variant="outline" onPress={() => Linking.openURL(data.youtubeUrl as string).catch(() => undefined)} /> : null}
          {data.links.map((l) => (
            <Button key={l.url} label={pick(l.labelEn, l.labelHi)} variant="outline" onPress={() => Linking.openURL(l.url).catch(() => undefined)} />
          ))}
        </>
      ) : null}
    </ContentScreen>
  );
}

const styles = StyleSheet.create({ title: { fontSize: 26, color: colors.heading, lineHeight: 34, marginBottom: space.sm } });
