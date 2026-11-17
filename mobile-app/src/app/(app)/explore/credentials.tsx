import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "@/components/Text";
import { ContentScreen, FadeIn } from "@/components/ContentKit";
import { Button, Card, ErrorText, Pill } from "@/components/ui";
import { useContent, type CredentialsContent } from "@/lib/content";
import { cacheFileName, downloadAndShare } from "@/lib/download";
import { useLanguage } from "@/lib/i18n";
import { colors, space } from "@/theme";

/** The Kendra's official documents (GST, MSME, trademark, ...): view, download or share. These files are public, so no sign-in is needed. */
export default function CredentialsScreen() {
  const { t, pick } = useLanguage();
  const { data, error, reload, loading } = useContent<CredentialsContent>("credentials");
  const [busyId, setBusyId] = useState("");
  const [fileError, setFileError] = useState("");

  const open = async (item: CredentialsContent["items"][number]) => {
    setFileError("");
    setBusyId(item.id);
    try {
      await downloadAndShare(null, item.fileUrl, cacheFileName(item.id, item.fileName), item.mimeType, pick(item.titleEn, item.titleHi));
    } catch (e) {
      setFileError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyId("");
    }
  };

  return (
    <ContentScreen loading={loading} error={error} reload={reload} empty={!!data && data.items.length === 0}>
      {data ? <Text style={styles.note}>{t("credentialsNote")}</Text> : null}
      <ErrorText>{fileError}</ErrorText>
      {data?.items.map((c, i) => (
        <FadeIn key={c.id} index={i}>
          <Card>
            <Pill label={pick(c.kindEn, c.kindHi)} tone="brand" />
            <Text style={styles.title}>{pick(c.titleEn, c.titleHi)}</Text>
            {pick(c.descriptionEn, c.descriptionHi) ? <Text style={styles.note}>{pick(c.descriptionEn, c.descriptionHi)}</Text> : null}
            {c.documentNumber ? (
              <View style={{ gap: 2 }}>
                <Text style={styles.label}>{t("documentNo")}</Text>
                <Text selectable style={styles.value}>
                  {c.documentNumber}
                </Text>
              </View>
            ) : null}
            <Button label={t("openDocument")} variant="outline" onPress={() => open(c)} busy={busyId === c.id} />
          </Card>
        </FadeIn>
      ))}
    </ContentScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 17, fontWeight: "700", color: colors.heading, lineHeight: 24 },
  note: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  label: { fontSize: 12, color: colors.textMuted, fontWeight: "600" },
  value: { fontSize: 15, color: colors.heading, fontWeight: "700" },
});
