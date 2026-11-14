import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from "react-native";
import { Text } from "@/components/Text";
import { router } from "expo-router";
import { Button, Card, ErrorText, Field } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { colors, space } from "@/theme";

/** Delete my account, inside the app (a Google Play requirement). */
export default function DeleteAccountScreen() {
  const { deleteAccount } = useSession();
  const { t } = useLanguage();
  const [confirm, setConfirm] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    setBusy(true);
    try {
      // On success the session ends and the app returns to the sign-in screen by itself
      await deleteAccount(password || undefined);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card>
          <Text style={styles.warning}>{t("deleteWarning")}</Text>
          <Text style={styles.text}>{t("deleteWhat")}</Text>
        </Card>
        <Card>
          <Field label={t("typeDelete")} value={confirm} onChangeText={setConfirm} autoCapitalize="characters" autoCorrect={false} />
          <Field label={t("passwordIfAny")} value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoComplete="current-password" />
          <ErrorText>{error}</ErrorText>
          <Button label={t("deleteAccount")} variant="danger" disabled={confirm !== "DELETE"} busy={busy} onPress={submit} />
          <Button label={t("cancel")} variant="outline" disabled={busy} onPress={() => router.back()} />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, gap: space.lg },
  warning: { fontSize: 16, fontWeight: "700", color: colors.error },
  text: { fontSize: 14, color: colors.text, lineHeight: 21 },
});
