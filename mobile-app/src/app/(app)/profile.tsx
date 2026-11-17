import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "@/components/Text";
import { Button, Card, ErrorText, Field } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { colors, space } from "@/theme";

/** The person changes their own name and email. The mobile number is their sign-in and stays. */
export default function ProfileScreen() {
  const { user, updateProfile } = useSession();
  const { t } = useLanguage();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const save = async () => {
    setError("");
    setDone(false);
    if (name.trim().length < 2) {
      setError(t("errName"));
      return;
    }
    setBusy(true);
    try {
      await updateProfile(name, email);
      setDone(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Card>
          <Field label={t("fullName")} value={name} onChangeText={setName} autoCapitalize="words" maxLength={100} />
          <Field label={t("emailLabel")} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} maxLength={254} />
          <View style={{ gap: 2 }}>
            <Text style={styles.label}>{t("mobile")}</Text>
            <Text style={styles.value}>{user?.phone || "-"}</Text>
          </View>
          <Text style={styles.note}>{t("profileNote")}</Text>
        </Card>
        <ErrorText>{error}</ErrorText>
        {done ? <Text style={styles.ok}>{t("profileSaved")}</Text> : null}
        <Button label={t("saveChanges")} onPress={save} busy={busy} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  body: { padding: space.lg, gap: space.md, paddingBottom: space.xxl * 2 },
  label: { fontSize: 13, fontWeight: "600", color: colors.textMuted },
  value: { fontSize: 16, fontWeight: "600", color: colors.heading },
  note: { fontSize: 13, color: colors.textMuted, lineHeight: 19 },
  ok: { fontSize: 14, color: colors.success, fontWeight: "600" },
});
