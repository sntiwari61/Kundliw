import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, View } from "react-native";
import { Text } from "@/components/Text";
import { Button, Card, ErrorText, Field, Segmented } from "@/components/ui";
import type { Gender } from "@/lib/booking";
import { useLanguage } from "@/lib/i18n";
import { EMPTY_DETAILS, useMyDetails, validateDetails, type MyDetails } from "@/lib/myDetails";
import { colors, space } from "@/theme";

/** The person's own birth details, kept on this phone only, to fill in forms with one tap. */
export default function MyDetailsScreen() {
  const { t } = useLanguage();
  const { details, loaded, save, clear } = useMyDetails();
  const [form, setForm] = useState<MyDetails>(EMPTY_DETAILS);
  const [errors, setErrors] = useState<Partial<Record<keyof MyDetails, string>>>({});
  const [info, setInfo] = useState("");
  const [filled, setFilled] = useState(false);

  // Start from what is already saved, once it has been read from the phone
  useEffect(() => {
    if (loaded && !filled) {
      if (details) setForm(details);
      setFilled(true);
    }
  }, [loaded, details, filled]);

  const set = <K extends keyof MyDetails>(key: K, value: MyDetails[K]) => {
    setInfo("");
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  };

  const submit = async () => {
    const found = validateDetails(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    await save({ ...form, name: form.name.trim(), pob: form.pob.trim(), tob: form.timeUnknown ? "" : form.tob.trim(), dob: form.dob.trim() });
    setInfo(t("myDetailsSaved"));
  };

  const text = (key: "name" | "dob" | "tob" | "pob", label: string, extra: Record<string, unknown> = {}) => (
    <View style={{ gap: space.xs }}>
      <Field label={label} value={form[key]} onChangeText={(v) => set(key, v)} {...extra} />
      {errors[key] ? <ErrorText>{t(errors[key] as "errName")}</ErrorText> : null}
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={styles.note}>{t("myDetailsNote")}</Text>
        <Card>
          {text("name", t("fullName"), { autoCapitalize: "words" })}
          <Text style={styles.label}>{t("gender")}</Text>
          <Segmented
            options={[
              { value: "MALE" as Gender, label: t("male") },
              { value: "FEMALE" as Gender, label: t("female") },
              { value: "OTHER" as Gender, label: t("other") },
            ]}
            value={form.gender}
            onChange={(v) => set("gender", v)}
          />
          {text("dob", t("dob"), { keyboardType: "numbers-and-punctuation", placeholder: "25-12-1990", maxLength: 10 })}
          <View style={styles.switchRow}>
            <Text style={[styles.label, { flex: 1 }]}>{t("timeUnknown")}</Text>
            <Switch value={form.timeUnknown} onValueChange={(v) => set("timeUnknown", v)} trackColor={{ true: colors.maroon }} />
          </View>
          {form.timeUnknown ? null : text("tob", t("tob"), { keyboardType: "numbers-and-punctuation", placeholder: "06:05", maxLength: 5 })}
          {text("pob", t("pob"), { autoCapitalize: "words" })}
        </Card>
        {info ? <Text style={styles.ok}>{info}</Text> : null}
        <Button label={t("saveChanges")} onPress={submit} />
        {details ? (
          <Button
            label={t("clearDetails")}
            variant="text"
            onPress={async () => {
              await clear();
              setForm(EMPTY_DETAILS);
              setInfo(t("detailsCleared"));
            }}
          />
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  body: { padding: space.lg, gap: space.md, paddingBottom: space.xxl * 2 },
  note: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  label: { fontSize: 13, fontWeight: "700", color: colors.textMuted },
  switchRow: { flexDirection: "row", alignItems: "center", gap: space.md },
  ok: { fontSize: 14, color: colors.success, fontWeight: "600" },
});
