import { useState } from "react";
import { StyleSheet, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { Text } from "@/components/Text";
import { ContentScreen, FadeIn } from "@/components/ContentKit";
import { Button, Card, Pill } from "@/components/ui";
import { offerValue, useContent, type OffersContent } from "@/lib/content";
import { useLanguage } from "@/lib/i18n";
import { formatPaise } from "@/lib/validation";
import { colors, radius, space } from "@/theme";

export default function OffersScreen() {
  const { t, lang, pick } = useLanguage();
  const { data, error, reload, loading } = useContent<OffersContent>("offers");
  const [copied, setCopied] = useState("");
  const date = (iso: string) => new Date(iso).toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <ContentScreen loading={loading} error={error} reload={reload} empty={!!data && data.offers.length === 0}>
      {data?.offers.map((o, i) => (
        <FadeIn key={o.id} index={i}>
          <Card style={styles.card}>
            <Text style={styles.value}>{offerValue(o, formatPaise, t("off"), t("maxOff"))}</Text>
            <Text style={styles.title}>{pick(o.titleEn, o.titleHi)}</Text>
            {o.minOrderValuePaise > 0 ? <Text style={styles.meta}>{`${t("minOrder")} ${formatPaise(o.minOrderValuePaise)}`}</Text> : null}
            {o.validUntil ? <Text style={styles.meta}>{`${t("validTill")} ${date(o.validUntil)}`}</Text> : null}
            {o.autoApply ? (
              <Pill label={t("autoApplied")} tone="success" />
            ) : (
              <View style={styles.codeRow}>
                <View style={styles.code}>
                  <Text style={styles.codeText}>{o.code}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    label={copied === o.id ? t("codeCopied") : t("copyCode")}
                    variant="outline"
                    onPress={async () => {
                      await Clipboard.setStringAsync(o.code);
                      setCopied(o.id);
                    }}
                  />
                </View>
              </View>
            )}
            {!o.autoApply ? <Text style={styles.meta}>{t("offerHow")}</Text> : null}
          </Card>
        </FadeIn>
      ))}
      {data && data.offers.length > 0 ? <Button label={t("tabServices")} onPress={() => router.push("/services")} /> : null}
    </ContentScreen>
  );
}

const styles = StyleSheet.create({
  card: { borderLeftWidth: 4, borderLeftColor: colors.gold },
  value: { fontSize: 24, fontWeight: "700", color: colors.brand },
  title: { fontSize: 15, fontWeight: "600", color: colors.heading },
  meta: { fontSize: 13, color: colors.textMuted },
  codeRow: { flexDirection: "row", alignItems: "center", gap: space.md },
  code: { borderWidth: 1.5, borderStyle: "dashed", borderColor: colors.gold, borderRadius: radius.md, paddingHorizontal: space.lg, paddingVertical: space.md, backgroundColor: colors.surfaceLow },
  codeText: { fontSize: 16, fontWeight: "700", letterSpacing: 1.5, color: colors.heading },
});
