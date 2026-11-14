import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Text } from "@/components/Text";
import { Button, Card, ErrorText, Field, Segmented } from "@/components/ui";
import {
  PRASHNA_CATEGORIES,
  birthPayload,
  emptyBirth,
  prashnaPayload,
  validateBirth,
  validatePrashna,
  type BirthForm,
  type Gender,
  type PrashnaForm,
} from "@/lib/astro";
import { ApiError } from "@/lib/api";
import { useLanguage, type StringKey } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { colors, radius, space } from "@/theme";

type Kind = "kundli" | "matching" | "prashna";

/** The Kendra's free request forms (Kundli, Kundli matching, Prashna Kundli), the same ones as on the website. */
export default function RequestScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const kind: Kind = type === "matching" || type === "prashna" ? type : "kundli";
  const { t } = useLanguage();
  const { api, user } = useSession();

  const [boy, setBoy] = useState<BirthForm>(emptyBirth());
  const [girl, setGirl] = useState<BirthForm>(emptyBirth("FEMALE"));
  const [prashna, setPrashna] = useState<PrashnaForm>({
    name: user?.name ?? "",
    phone: (user?.phone ?? "").replace(/^\+?91/, ""),
    email: user?.email ?? "",
    category: "GENERAL",
    questionText: "",
    placeOfQuery: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const submit = async () => {
    const found: Record<string, string> = {};
    if (kind === "prashna") Object.entries(validatePrashna(prashna)).forEach(([k, v]) => (found[`p.${k}`] = v as string));
    else {
      Object.entries(validateBirth(boy)).forEach(([k, v]) => (found[`a.${k}`] = v as string));
      if (kind === "matching") Object.entries(validateBirth(girl)).forEach(([k, v]) => (found[`b.${k}`] = v as string));
    }
    setErrors(found);
    if (Object.keys(found).length > 0) return setFormError(t("fixErrors"));
    setFormError("");
    setBusy(true);
    try {
      const body =
        kind === "prashna"
          ? { requestType: "PRASHNA_KUNDLI", jatakaDetails: prashnaPayload(prashna) }
          : kind === "matching"
            ? { requestType: "KUNDLI_MATCHING", jatakaDetails: { boy: birthPayload(boy), girl: birthPayload(girl) } }
            : { requestType: "KUNDLI_REQUEST", jatakaDetails: birthPayload(boy) };
      const res = await api.request<{ orderNumber: string }>("/api/astro/request", { method: "POST", body });
      setDone(res.orderNumber);
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const err = (key: string) => (errors[key] ? <ErrorText>{t(errors[key] as StringKey)}</ErrorText> : null);

  const birthFields = (prefix: "a" | "b", f: BirthForm, set: (f: BirthForm) => void) => (
    <>
      <Field label={t("fullName")} value={f.name} onChangeText={(v) => set({ ...f, name: v })} autoComplete="name" />
      {err(`${prefix}.name`)}
      <Text style={styles.label}>{t("gender")}</Text>
      <Segmented
        options={[
          { value: "MALE", label: t("male") },
          { value: "FEMALE", label: t("female") },
          { value: "OTHER", label: t("other") },
        ]}
        value={(f.gender || "MALE") as Gender}
        onChange={(g) => set({ ...f, gender: g })}
      />
      <Field label={t("dob")} value={f.dob} onChangeText={(v) => set({ ...f, dob: v })} keyboardType="numbers-and-punctuation" placeholder="25-12-1990" maxLength={10} />
      {err(`${prefix}.dob`)}
      <Field label={t("tob")} value={f.tob} onChangeText={(v) => set({ ...f, tob: v })} keyboardType="numbers-and-punctuation" placeholder="06:30" maxLength={5} />
      {err(`${prefix}.tob`)}
      <Field label={t("pob")} value={f.pob} onChangeText={(v) => set({ ...f, pob: v })} />
      {err(`${prefix}.pob`)}
    </>
  );

  if (done)
    return (
      <View style={styles.doneBox}>
        <View style={styles.doneIcon}>
          <Ionicons name="checkmark" size={36} color={colors.success} />
        </View>
        <Text serif style={styles.doneTitle}>{t("requestSent")}</Text>
        <Text style={styles.doneNote}>{`${t("orderNo")} ${done}`}</Text>
        <Text style={styles.doneNote}>{t("requestSentNote")}</Text>
        {!user ? <Text style={styles.doneNote}>{t("requestGuestNote")}</Text> : null}
        <View style={{ alignSelf: "stretch", gap: space.md, marginTop: space.lg }}>
          {user ? <Button label={t("tabOrders")} onPress={() => router.replace("/orders")} /> : <Button label={t("signIn")} onPress={() => router.replace("/sign-in")} />}
          <Button label={t("goBack")} variant="outline" onPress={() => router.back()} />
        </View>
      </View>
    );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
        <Text style={styles.note}>{t("requestNote")}</Text>

        {kind === "prashna" ? (
          <Card>
            <Field label={t("fullName")} value={prashna.name} onChangeText={(v) => setPrashna({ ...prashna, name: v })} autoComplete="name" />
            {err("p.name")}
            <Field label={t("mobileNumber")} value={prashna.phone} onChangeText={(v) => setPrashna({ ...prashna, phone: v.replace(/\D/g, "").slice(0, 10) })} keyboardType="phone-pad" maxLength={10} />
            {err("p.phone")}
            <Field label={t("emailAddress")} value={prashna.email} onChangeText={(v) => setPrashna({ ...prashna, email: v })} autoCapitalize="none" keyboardType="email-address" />
            {err("p.email")}
            <Text style={styles.label}>{t("topic")}</Text>
            <View style={styles.chips}>
              {PRASHNA_CATEGORIES.map((c) => (
                <Text key={c} onPress={() => setPrashna({ ...prashna, category: c })} style={[styles.chip, prashna.category === c && styles.chipOn]} accessibilityRole="button">
                  {t(c)}
                </Text>
              ))}
            </View>
            <Field label={t("yourQuestion")} value={prashna.questionText} onChangeText={(v) => setPrashna({ ...prashna, questionText: v.slice(0, 2000) })} multiline style={{ minHeight: 110, textAlignVertical: "top" }} />
            {err("p.questionText")}
            <Field label={t("placeOfQuery")} value={prashna.placeOfQuery} onChangeText={(v) => setPrashna({ ...prashna, placeOfQuery: v })} />
            {err("p.placeOfQuery")}
          </Card>
        ) : kind === "matching" ? (
          <>
            <Card>
              <Text style={styles.cardTitle}>{t("boy")}</Text>
              {birthFields("a", boy, setBoy)}
            </Card>
            <Card>
              <Text style={styles.cardTitle}>{t("girl")}</Text>
              {birthFields("b", girl, setGirl)}
            </Card>
          </>
        ) : (
          <Card>
            <Text style={styles.cardTitle}>{t("yourDetails")}</Text>
            {birthFields("a", boy, setBoy)}
          </Card>
        )}

        <ErrorText>{formError}</ErrorText>
        <Button label={t("sendRequest")} onPress={submit} busy={busy} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: space.lg, gap: space.lg, paddingBottom: space.xxl * 2 },
  note: { fontSize: 14, color: colors.textMuted, lineHeight: 21 },
  label: { fontSize: 13, fontWeight: "600", color: colors.textMuted },
  cardTitle: { fontSize: 16, fontWeight: "700", color: colors.heading },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  chip: { paddingHorizontal: space.md, paddingVertical: space.sm, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.outlineVariant, backgroundColor: colors.card, fontSize: 13, color: colors.text, overflow: "hidden" },
  chipOn: { backgroundColor: colors.maroon, borderColor: colors.maroon, color: colors.onMaroon },
  doneBox: { flex: 1, alignItems: "center", justifyContent: "center", padding: space.xl, gap: space.sm },
  doneIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.successContainer, alignItems: "center", justifyContent: "center" },
  doneTitle: { fontSize: 26, color: colors.heading },
  doneNote: { fontSize: 14, color: colors.textMuted, textAlign: "center", lineHeight: 21 },
});
