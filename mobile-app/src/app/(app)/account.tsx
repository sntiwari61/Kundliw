import { useState } from "react";
import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Button, Card, Segmented } from "@/components/ui";
import { siteUrl } from "@/lib/config";
import { useLanguage, type StringKey } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { colors, space } from "@/theme";

const LEGAL: { key: StringKey; path: string }[] = [
  { key: "terms", path: "/legal/terms" },
  { key: "privacy", path: "/legal/privacy" },
  { key: "refund", path: "/legal/refund" },
  { key: "cancellation", path: "/legal/cancellation" },
];

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function AccountScreen() {
  const { user, signOut } = useSession();
  const { t, lang, setLang } = useLanguage();
  const [busy, setBusy] = useState(false);

  if (!user) return null;
  const roleLabel = user.role === "ASSOCIATE" ? t("associate") : t("user");

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Card>
        <Text style={styles.name}>{user.name || "-"}</Text>
        <Row label={t("role")} value={roleLabel} />
        <Row label={t("mobile")} value={user.phone} />
        <Row label={t("email")} value={user.email} />
        {user.role === "ASSOCIATE" ? <Row label={t("associateStatus")} value={user.associateStatus} /> : null}
      </Card>

      <Card>
        <Text style={styles.section}>{t("language")}</Text>
        <Segmented
          options={[
            { value: "hi", label: "हिन्दी" },
            { value: "en", label: "English" },
          ]}
          value={lang}
          onChange={setLang}
        />
      </Card>

      <Card>
        <Text style={styles.section}>{t("legal")}</Text>
        {LEGAL.map((l) => (
          <Button key={l.key} label={t(l.key)} variant="outline" onPress={() => Linking.openURL(siteUrl(l.path, lang))} />
        ))}
      </Card>

      <Button
        label={t("signOut")}
        variant="outline"
        busy={busy}
        onPress={async () => {
          setBusy(true);
          await signOut();
        }}
      />
      <Button label={t("deleteAccount")} variant="text" onPress={() => router.push("/delete-account")} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, gap: space.lg },
  name: { fontSize: 20, fontWeight: "700", color: colors.heading },
  section: { fontSize: 13, fontWeight: "700", color: colors.textMuted },
  row: { flexDirection: "row", justifyContent: "space-between", gap: space.md },
  rowLabel: { fontSize: 14, color: colors.textMuted },
  rowValue: { fontSize: 14, color: colors.text, fontWeight: "600", flexShrink: 1, textAlign: "right" },
});
