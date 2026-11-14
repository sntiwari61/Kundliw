import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Button, Card, ErrorText, Field } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { validateTicket, type TicketErrors, type TicketForm } from "@/lib/tickets";
import { space } from "@/theme";

/** Raise a new support ticket; contact details are filled in from the account. */
export default function NewTicketScreen() {
  const { user, api } = useSession();
  const { t } = useLanguage();
  const [form, setForm] = useState<TicketForm>({
    subject: "",
    message: "",
    orderNumber: "",
    contactName: user?.name ?? "",
    contactEmail: user?.email ?? "",
    contactPhone: user?.phone ?? "",
    contactAddress: "",
  });
  const [errors, setErrors] = useState<TicketErrors>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (key: keyof TicketForm, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  };

  const field = (key: keyof TicketForm, label: string, extra: Record<string, unknown> = {}) => (
    <View style={{ gap: space.xs }}>
      <Field label={label} value={form[key]} onChangeText={(v) => set(key, v)} {...extra} />
      {errors[key] ? <ErrorText>{t(errors[key]!)}</ErrorText> : null}
    </View>
  );

  const submit = async () => {
    const found = validateTicket(form);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setFormError(t("fixErrors"));
      return;
    }
    setFormError("");
    setBusy(true);
    try {
      await api.request("/api/tickets", {
        method: "POST",
        body: {
          subject: form.subject.trim(),
          message: form.message.trim(),
          orderNumber: form.orderNumber.trim() || null,
          contactName: form.contactName.trim(),
          contactEmail: form.contactEmail.trim(),
          contactPhone: form.contactPhone.trim(),
          contactAddress: form.contactAddress.trim(),
        },
      });
      router.back();
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Card>
          {field("subject", t("subject"), { maxLength: 150 })}
          {field("message", t("yourMessage"), { multiline: true, maxLength: 3000, style: { minHeight: 110, textAlignVertical: "top" } })}
          {field("orderNumber", t("relatedOrder"), { autoCapitalize: "characters", maxLength: 40 })}
        </Card>
        <Card>
          {field("contactName", t("fullName"), { autoCapitalize: "words" })}
          {field("contactEmail", t("emailLabel"), { keyboardType: "email-address", autoCapitalize: "none", autoCorrect: false })}
          {field("contactPhone", t("contactPhone"), { keyboardType: "phone-pad" })}
          {field("contactAddress", t("address"), { multiline: true, maxLength: 300, style: { minHeight: 72, textAlignVertical: "top" } })}
        </Card>
        <ErrorText>{formError}</ErrorText>
        <Button label={t("sendTicket")} onPress={submit} busy={busy} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  body: { padding: space.lg, gap: space.md, paddingBottom: space.xxl * 2 },
});
