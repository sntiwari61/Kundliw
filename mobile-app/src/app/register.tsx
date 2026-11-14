import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Switch, View } from "react-native";
import { router } from "expo-router";
import { Hero } from "@/components/Hero";
import { LangChip } from "@/components/LangChip";
import { Text } from "@/components/Text";
import { Button, Card, ErrorText, Field, Segmented } from "@/components/ui";
import { ApiError, type Portal } from "@/lib/api";
import { siteUrl } from "@/lib/config";
import { useLanguage, type StringKey } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { isValidOtp, validateRegister, type RegisterForm } from "@/lib/validation";
import { colors, space } from "@/theme";

/**
 * Creates an account with the website's own sign-up route, so the same account signs in on the website and in the app.
 * With a password the person is signed in at once; without one, a code is sent to the mobile number.
 */
export default function RegisterScreen() {
  const { t, lang } = useLanguage();
  const { api, user, signInWithOtp, signInWithPassword } = useSession();
  const [form, setForm] = useState<RegisterForm>({ name: "", phone: "", email: "", password: "", adult: false, associate: false });
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterForm, string>>>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<"form" | "otp">("form");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const portal: Portal = form.associate ? "associate" : "user";

  useEffect(() => {
    if (user) {
      if (router.canGoBack()) router.back();
      else router.replace("/");
    }
  }, [user]);

  const set = <K extends keyof RegisterForm>(key: K, value: RegisterForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  };

  const fail = (e: unknown) => setFormError(e instanceof ApiError ? e.message : String(e));

  const submit = async () => {
    const found = validateRegister(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return setFormError(t("fixErrors"));
    setFormError("");
    setBusy(true);
    try {
      await api.request("/api/auth/register", {
        method: "POST",
        auth: false,
        body: {
          accountType: form.associate ? "ASSOCIATE" : "USER",
          name: form.name.trim(),
          phone: form.phone,
          email: form.email.trim(),
          ...(form.password ? { password: form.password } : {}),
          adultConfirmed: true,
        },
      });
      if (form.password) {
        await signInWithPassword(form.email.trim(), form.password, portal);
      } else {
        await api.sendOtp(form.phone);
        setStage("otp");
      }
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    if (!isValidOtp(otp)) return setFormError(t("invalidOtp"));
    setFormError("");
    setBusy(true);
    try {
      await signInWithOtp(form.phone, otp, portal);
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  const err = (key: keyof RegisterForm) => (errors[key] ? <ErrorText>{t(errors[key] as StringKey)}</ErrorText> : null);

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ paddingBottom: space.xxl }} keyboardShouldPersistTaps="handled">
          <Hero title={t("registerTitle")} subtitle={t("registerNote")} right={<LangChip />} />
          <View style={styles.body}>
            {stage === "otp" ? (
              <Card>
                <Text style={styles.hint}>{t("accountMade")}</Text>
                <Field label={t("enterOtp")} value={otp} onChangeText={(v) => setOtp(v.replace(/\D/g, "").slice(0, 6))} keyboardType="number-pad" autoComplete="one-time-code" maxLength={6} autoFocus />
                <ErrorText>{formError}</ErrorText>
                <Button label={t("verify")} onPress={verify} busy={busy} />
              </Card>
            ) : (
              <>
                <Card>
                  <Segmented
                    options={[
                      { value: "user", label: t("user") },
                      { value: "associate", label: t("associate") },
                    ]}
                    value={form.associate ? "associate" : "user"}
                    onChange={(v) => set("associate", v === "associate")}
                  />
                  <Field label={t("fullName")} value={form.name} onChangeText={(v) => set("name", v)} autoComplete="name" textContentType="name" />
                  {err("name")}
                  <Field label={t("mobileNumber")} value={form.phone} onChangeText={(v) => set("phone", v.replace(/\D/g, "").slice(0, 10))} keyboardType="phone-pad" autoComplete="tel" placeholder="9876543210" maxLength={10} />
                  {err("phone")}
                  <Field label={t("emailAddress")} value={form.email} onChangeText={(v) => set("email", v)} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" textContentType="emailAddress" />
                  {err("email")}
                  <Field
                    label={form.associate ? t("passwordRequired") : t("passwordOptional")}
                    value={form.password}
                    onChangeText={(v) => set("password", v)}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="new-password"
                    textContentType="newPassword"
                  />
                  {err("password")}
                  <Button label={showPassword ? t("hidePassword") : t("showPassword")} variant="text" onPress={() => setShowPassword((s) => !s)} />
                  <View style={styles.consent}>
                    <Switch value={form.adult} onValueChange={(v) => set("adult", v)} trackColor={{ true: colors.brand }} />
                    <Pressable style={{ flex: 1 }} onPress={() => Linking.openURL(siteUrl("/legal/terms", lang))} accessibilityRole="link">
                      <Text style={styles.consentText}>{t("adultConfirm")}</Text>
                    </Pressable>
                  </View>
                  <View style={{ flexDirection: "row", gap: space.lg }}>
                    <Pressable onPress={() => Linking.openURL(siteUrl("/legal/terms", lang))} accessibilityRole="link">
                      <Text style={styles.link}>{t("terms")}</Text>
                    </Pressable>
                    <Pressable onPress={() => Linking.openURL(siteUrl("/legal/privacy", lang))} accessibilityRole="link">
                      <Text style={styles.link}>{t("privacy")}</Text>
                    </Pressable>
                  </View>
                  {err("adult")}
                  <ErrorText>{formError}</ErrorText>
                  <Button label={t("createAccount")} onPress={submit} busy={busy} />
                </Card>
                <Button label={t("alreadyHaveAccount")} variant="text" onPress={() => (router.canGoBack() ? router.back() : router.replace("/sign-in"))} />
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: space.lg, gap: space.lg },
  hint: { fontSize: 14, color: colors.text, lineHeight: 20 },
  consent: { flexDirection: "row", alignItems: "center", gap: space.md },
  link: { fontSize: 13, fontWeight: "600", color: colors.brand, textDecorationLine: "underline" },
  consentText: { fontSize: 13, color: colors.text, lineHeight: 19 },
});
