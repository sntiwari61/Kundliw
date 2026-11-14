import { useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Hero } from "@/components/Hero";
import { Text } from "@/components/Text";
import { Button, Card, Segmented, SectionTitle } from "@/components/ui";
import { siteUrl } from "@/lib/config";
import { useLanguage, type StringKey } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { colors, radius, space } from "@/theme";

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

  if (!user) {
    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: space.xxl }}>
        <Hero title={t("guestName")} subtitle={t("guestNote")} />
        <View style={styles.body}>
          <Button label={t("signIn")} onPress={() => router.push("/sign-in")} />
          <Button label={t("createAccount")} variant="outline" onPress={() => router.push("/register")} />
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
          <SectionTitle>{t("legal")}</SectionTitle>
          <Card style={{ gap: 0, paddingVertical: space.xs }}>
            {LEGAL.map((l, i) => (
              <Link key={l.key} icon="document-text-outline" label={t(l.key)} onPress={() => Linking.openURL(siteUrl(l.path, lang))} last={i === LEGAL.length - 1} />
            ))}
          </Card>
        </View>
      </ScrollView>
    );
  }
  const isAssociate = user.role === "ASSOCIATE";
  const initial = (user.name || user.email || user.phone || "?").trim().charAt(0).toUpperCase();

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: space.xxl }}>
      <Hero title={user.name || t("account")} subtitle={isAssociate ? t("associate") : t("user")} right={<View style={styles.avatar}><Text style={styles.avatarText}>{initial}</Text></View>} />

      <View style={styles.body}>
        <Card>
          <Row label={t("mobile")} value={user.phone} />
          <Row label={t("email")} value={user.email} />
          {isAssociate ? <Row label={t("associateStatus")} value={user.associateStatus} /> : null}
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

        <Card style={{ gap: 0, paddingVertical: space.xs }}>
          <Link icon="chatbubbles-outline" label={t("support")} onPress={() => router.push("/tickets")} />
          <Link icon="receipt-outline" label={t("tabOrders")} onPress={() => router.push("/orders")} last />
        </Card>

        <SectionTitle>{t("legal")}</SectionTitle>
        <Card style={{ gap: 0, paddingVertical: space.xs }}>
          {LEGAL.map((l, i) => (
            <Link key={l.key} icon="document-text-outline" label={t(l.key)} onPress={() => Linking.openURL(siteUrl(l.path, lang))} last={i === LEGAL.length - 1} />
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
      </View>
    </ScrollView>
  );
}

function Link({ icon, label, onPress, last }: { icon: React.ComponentProps<typeof Ionicons>["name"]; label: string; onPress: () => void; last?: boolean }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.link, !last && styles.linkBorder, pressed && { backgroundColor: colors.surfaceLow }]}>
      <Ionicons name={icon} size={22} color={colors.maroon} />
      <Text style={styles.linkText}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.outline} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: { padding: space.lg, gap: space.lg },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.gold, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 24, fontWeight: "700", color: colors.maroonDeep },
  section: { fontSize: 13, fontWeight: "600", color: colors.textMuted },
  row: { flexDirection: "row", justifyContent: "space-between", gap: space.md },
  rowLabel: { fontSize: 14, color: colors.textMuted },
  rowValue: { fontSize: 14, color: colors.text, fontWeight: "600", flexShrink: 1, textAlign: "right" },
  link: { flexDirection: "row", alignItems: "center", gap: space.md, minHeight: 52, paddingHorizontal: space.xs, borderRadius: radius.sm },
  linkBorder: { borderBottomWidth: 1, borderBottomColor: colors.outlineVariant },
  linkText: { flex: 1, fontSize: 15, fontWeight: "500", color: colors.heading },
});
