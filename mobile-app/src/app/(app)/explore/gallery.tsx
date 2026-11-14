import { useState } from "react";
import { Image, Linking, Modal, Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/Text";
import { ContentScreen, FadeIn } from "@/components/ContentKit";
import { imageUri, safeExternal, useContent, type GalleryContent } from "@/lib/content";
import { useLanguage } from "@/lib/i18n";
import { colors, radius, space } from "@/theme";

type Item = GalleryContent["items"][number];

export default function GalleryScreen() {
  const { pick } = useLanguage();
  const { width } = useWindowDimensions();
  const { data, error, reload, loading } = useContent<GalleryContent>("gallery");
  const [shown, setShown] = useState<Item | null>(null);
  const size = (width - space.lg * 2 - space.md) / 2;

  const open = (item: Item) => {
    const video = safeExternal(item.mediaType === "IMAGE" ? null : item.videoUrl || item.externalLink);
    if (video) Linking.openURL(video).catch(() => undefined);
    else if (item.imageUrl) setShown(item);
  };

  return (
    <>
      <ContentScreen loading={loading} error={error} reload={reload} empty={!!data && data.items.length === 0}>
        <View style={styles.grid}>
          {data?.items.map((item, i) => (
            <FadeIn key={item.id} index={i}>
              <Pressable accessibilityRole="imagebutton" accessibilityLabel={pick(item.titleEn, item.titleHi)} onPress={() => open(item)} style={[styles.cell, { width: size }]}>
                <Image source={{ uri: imageUri(item.imageUrl) }} style={{ width: size, height: size }} resizeMode="cover" accessibilityIgnoresInvertColors />
                {item.mediaType !== "IMAGE" ? (
                  <View style={styles.play}>
                    <Ionicons name="play" size={22} color="#fff" />
                  </View>
                ) : null}
                <Text style={styles.cellTitle} numberOfLines={2}>
                  {pick(item.titleEn, item.titleHi)}
                </Text>
              </Pressable>
            </FadeIn>
          ))}
        </View>
      </ContentScreen>
      <Modal visible={!!shown} transparent animationType="fade" onRequestClose={() => setShown(null)}>
        <Pressable style={styles.backdrop} onPress={() => setShown(null)} accessibilityLabel="Close">
          {shown ? (
            <>
              <Image source={{ uri: imageUri(shown.imageUrl) }} style={{ width: "100%", height: "70%" }} resizeMode="contain" accessibilityIgnoresInvertColors />
              <Text style={styles.modalTitle}>{pick(shown.titleEn, shown.titleHi)}</Text>
              {pick(shown.captionEn ?? "", shown.captionHi ?? "") ? <Text style={styles.modalCaption}>{pick(shown.captionEn ?? "", shown.captionHi ?? "")}</Text> : null}
            </>
          ) : null}
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: space.md },
  cell: { borderRadius: radius.lg, overflow: "hidden", backgroundColor: colors.card, borderWidth: 1, borderColor: colors.outlineVariant },
  cellTitle: { fontSize: 12, fontWeight: "600", color: colors.heading, padding: space.sm },
  play: { position: "absolute", top: space.sm, right: space.sm, width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center" },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.92)", justifyContent: "center", padding: space.lg },
  modalTitle: { color: "#fff", fontSize: 16, fontWeight: "700", textAlign: "center", marginTop: space.md },
  modalCaption: { color: "#ddd", fontSize: 13, textAlign: "center", marginTop: space.xs },
});
