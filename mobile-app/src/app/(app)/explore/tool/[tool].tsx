import { useState } from "react";
import { ActivityIndicator, Linking, StyleSheet, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { WebView } from "react-native-webview";
import { Text } from "@/components/Text";
import { Button, EmptyState, ErrorText, SkeletonList } from "@/components/ui";
import { useTools, type ToolKey } from "@/lib/astro";
import { useLanguage } from "@/lib/i18n";
import { colors, space } from "@/theme";

const KEYS: ToolKey[] = ["panchang", "kundli", "matching"];

/** One of the website's live tools (Panchang, Kundli, Kundli matching) shown inside the app. The admin switches it on or off and sets its address. */
export default function ToolScreen() {
  const { tool } = useLocalSearchParams<{ tool: string }>();
  const { t, lang, pick } = useLanguage();
  const { data, error, reload, loading } = useTools();
  const [busy, setBusy] = useState(true);
  const key = KEYS.find((k) => k === tool);

  if (!key) return <EmptyState title={t("noContent")} />;
  if (loading) return <View style={styles.pad}><SkeletonList count={3} height={120} /></View>;
  if (error || !data)
    return (
      <View style={styles.pad}>
        <ErrorText>{error}</ErrorText>
        <Button label={t("retry")} variant="outline" onPress={reload} />
      </View>
    );
  const info = data[key];
  if (!info.enabled) return <EmptyState title={t("toolOff")} />;

  const url = lang === "hi" ? info.urlHi : info.urlEn;
  const note = pick(data.noteEn, data.noteHi);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <WebView
          source={{ uri: url }}
          style={{ flex: 1, backgroundColor: "#fff" }}
          onLoadStart={() => setBusy(true)}
          onLoadEnd={() => setBusy(false)}
          javaScriptEnabled
          domStorageEnabled
          setSupportMultipleWindows={false}
          // Stay on the tool's own site; anything else opens in the phone's browser
          onShouldStartLoadWithRequest={(req) => {
            try {
              if (new URL(req.url).host === new URL(url).host || req.url === "about:blank") return true;
            } catch {
              // fall through
            }
            Linking.openURL(req.url).catch(() => undefined);
            return false;
          }}
        />
        {busy ? (
          <View style={styles.busy} pointerEvents="none">
            <ActivityIndicator size="large" color={colors.brand} />
          </View>
        ) : null}
      </View>
      <View style={styles.foot}>
        {note ? <Text style={styles.note}>{note}</Text> : null}
        <Text style={styles.credit}>{t("toolCredit")}</Text>
        <Button label={t("openFull")} variant="outline" onPress={() => Linking.openURL(url).catch(() => undefined)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { padding: space.lg, gap: space.lg },
  busy: { ...StyleSheet.absoluteFill as object, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.6)" },
  foot: { padding: space.md, gap: space.sm, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.outlineVariant },
  note: { fontSize: 12, color: colors.textMuted, lineHeight: 18 },
  credit: { fontSize: 11, color: colors.textMuted, textAlign: "center" },
});
