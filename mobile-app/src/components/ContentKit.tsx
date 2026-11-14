import { useEffect, useRef, useState, type ReactNode } from "react";
import { Animated, Image, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "@/components/Text";
import { Button, EmptyState, ErrorText, SkeletonList } from "@/components/ui";
import { imageUri, paragraphs, parseInline, safeExternal, type Block } from "@/lib/content";
import { useLanguage } from "@/lib/i18n";
import { colors, radius, shadow, space } from "@/theme";

/** Building blocks shared by the website's public pages in the app. */

/** Fades and slides its content in; `index` staggers a list so cards appear one after another. */
export function FadeIn({ children, index = 0 }: { children: ReactNode; index?: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 420, delay: Math.min(index, 8) * 70, useNativeDriver: true }).start();
  }, [v, index]);
  return (
    <Animated.View style={{ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }}>{children}</Animated.View>
  );
}

/** Text with the website's simple markup: paragraphs, **bold** and links that open outside the app. */
export function RichText({ text, style }: { text: string; style?: object }) {
  return (
    <View style={{ gap: space.md }}>
      {paragraphs(text).map((p, i) => (
        <Text key={i} style={[styles.body, style]}>
          {parseInline(p).map((part, j) =>
            part.type === "link" ? (
              <Text key={j} style={styles.link} onPress={() => Linking.openURL(part.href).catch(() => undefined)}>
                {part.text}
              </Text>
            ) : part.type === "bold" ? (
              <Text key={j} style={{ fontWeight: "700" }}>
                {part.text}
              </Text>
            ) : (
              part.text
            ),
          )}
        </Text>
      ))}
    </View>
  );
}

/** A picture from the website that keeps its shape and shows a soft block while it loads. */
export function Picture({ src, height = 200, round, contain }: { src: string | null | undefined; height?: number; round?: boolean; contain?: boolean }) {
  const uri = imageUri(src);
  if (!uri) return null;
  return (
    <View style={[styles.pictureBox, { height }, round && { borderRadius: height / 2, width: height, alignSelf: "center" }]}>
      <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode={contain ? "contain" : "cover"} accessibilityIgnoresInvertColors />
    </View>
  );
}

/** The blocks the admin stacks on a page: text, picture, video link and link button. */
export function Blocks({ blocks }: { blocks: Block[] }) {
  const { t, pick } = useLanguage();
  return (
    <View style={{ gap: space.lg }}>
      {blocks.map((b, i) => {
        const text = pick(b.textEn, b.textHi);
        if (b.type === "text") return text ? <FadeIn key={b.id} index={i}><RichText text={text} /></FadeIn> : null;
        if (b.type === "image")
          return (
            <FadeIn key={b.id} index={i}>
              <Picture src={b.url} height={220} />
              {text ? <Text style={styles.caption}>{text}</Text> : null}
            </FadeIn>
          );
        const href = safeExternal(b.url);
        if (!href) return null;
        const label = pick(b.labelEn, b.labelHi) || (b.type === "youtube" ? t("watchVideo") : t("openLink"));
        return (
          <FadeIn key={b.id} index={i}>
            {b.type === "youtube" && text ? <Text style={styles.caption}>{text}</Text> : null}
            <Button label={label} variant="outline" onPress={() => Linking.openURL(href).catch(() => undefined)} />
          </FadeIn>
        );
      })}
    </View>
  );
}

/** A card with a soft gold edge, used for the quote, mission and similar highlights. */
export function Highlight({ children }: { children: ReactNode }) {
  return <View style={styles.highlight}>{children}</View>;
}

/** The frame of a content screen: pull to refresh, a loading shape, an error with Try again, or the content. */
export function ContentScreen({
  loading,
  error,
  reload,
  empty,
  children,
}: {
  loading: boolean;
  error: string;
  reload: () => Promise<void> | void;
  empty?: boolean;
  children: ReactNode;
}) {
  const { t } = useLanguage();
  const [refreshing, setRefreshing] = useState(false);
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.screen}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await reload();
            setRefreshing(false);
          }}
          tintColor={colors.brand}
        />
      }
    >
      {loading ? <SkeletonList count={4} height={110} /> : null}
      {error ? (
        <>
          <ErrorText>{error}</ErrorText>
          <Button label={t("retry")} variant="outline" onPress={reload} />
        </>
      ) : null}
      {!loading && !error && empty ? <EmptyState title={t("noContent")} /> : null}
      {!loading && !error && !empty ? children : null}
    </ScrollView>
  );
}

/** A large tappable tile with an icon, a title and an optional line under it. */
export function TileLink({ icon, title, note, onPress }: { icon: ReactNode; title: string; note?: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={({ pressed }) => [styles.tile, pressed && { transform: [{ scale: 0.97 }] }]}>
      <View style={styles.tileIcon}>{icon}</View>
      <Text style={styles.tileTitle} numberOfLines={2}>
        {title}
      </Text>
      {note ? (
        <Text style={styles.tileNote} numberOfLines={2}>
          {note}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { padding: space.lg, gap: space.lg, paddingBottom: space.xxl * 2 },
  body: { fontSize: 15, lineHeight: 24, color: colors.text },
  link: { color: colors.primary, textDecorationLine: "underline", fontWeight: "600" },
  caption: { fontSize: 13, color: colors.textMuted, marginTop: space.sm, lineHeight: 19 },
  pictureBox: { width: "100%", borderRadius: radius.lg, overflow: "hidden", backgroundColor: colors.surfaceContainer },
  highlight: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.sm,
    borderLeftWidth: 4,
    borderLeftColor: colors.gold,
    ...shadow.card,
  },
  tile: {
    width: 150,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.md,
    gap: space.sm,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    ...shadow.card,
  },
  tileIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.goldSoft, alignItems: "center", justifyContent: "center" },
  tileTitle: { fontSize: 14, fontWeight: "700", color: colors.heading },
  tileNote: { fontSize: 12, color: colors.textMuted, lineHeight: 17 },
});
