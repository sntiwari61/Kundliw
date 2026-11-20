import { useEffect, useState } from "react";
import { router } from "expo-router";
import { Image, KeyboardAvoidingView, Linking, Platform, ScrollView, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LangChip } from "@/components/LangChip";
import { Text } from "@/components/Text";
import { Button, Card, ErrorText, Field, Segmented } from "@/components/ui";
import { ApiError, type Portal } from "@/lib/api";
import { siteUrl } from "@/lib/config";
import { useLanguage } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { isValidEmail, isValidOtp, isValidPhone } from "@/lib/validation";
import { colors, gradients, radius, shadow, space } from "@/theme";

type Method = "otp" | "email" | "password";

export default function SignInScreen() {
  const { t, lang } = useLanguage();
  const insets = useSafeAreaInsets();
  const { api, user, signInWithOtp, signInWithEmailOtp, signInWithPassword } = useSession();
  const leave = () => (router.canGoBack() ? router.back() : router.replace("/"));

  const [portal, setPortal] = useState<Portal>("user");
  const [method, setMethod] = useState<Method>("otp");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const fail = (e: unknown) => setError(e instanceof ApiError ? e.message : String(e));

  async function run(action: () => Promise<void>) {
    setError("");
    setBusy(true);
    try {
      await action();
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }

  const sendOtp = () => {
    if (!isValidPhone(phone)) return setError(t("invalidPhone"));
    return run(async () => {
      await api.sendOtp(phone);
      setOtp("");
      setOtpSent(true);
    });
  };

  const sendEmailCode = () => {
    if (!isValidEmail(email)) return setError(t("errEmailAddr"));
    return run(async () => {
      await api.sendEmailOtp(email);
      setOtp("");
      setOtpSent(true);
    });
  };

  const verifyOtp = () => {
    if (!isValidOtp(otp)) return setError(t("invalidOtp"));
    return run(() => (method === "email" ? signInWithEmailOtp(email, otp, portal) : signInWithOtp(phone, otp, portal)));
  };

  const passwordSignIn = () => {
    if (!identifier.trim() || !password) return setError(t("fillBoth"));
    return run(() => signInWithPassword(identifier.trim(), password, portal));
  };

  const resetError = () => setError("");

  // Opened over the app for guests: once signed in, go back to where they were (the booking form keeps its entries)
  useEffect(() => {
    if (user) leave();
  }, [user]);

  return (
    <View style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, { paddingTop: insets.top + space.md }]}>
            <View style={styles.langRow}>
              <LangChip />
            </View>
            <View style={styles.logoBox}>
              <Image source={require("../../assets/splash-icon.png")} style={styles.logo} resizeMode="contain" accessibilityIgnoresInvertColors />
            </View>
            <Text serif style={styles.title}>
              {t("appName")}
            </Text>
            <Text serif style={styles.shloka}>
              ॐ असतो मा सद्गमय। तमसो मा ज्योतिर्गमय।
            </Text>
          </LinearGradient>

          <View style={styles.form}>
          <Card>
            <Text style={styles.label}>{t("signInAs")}</Text>
            <Segmented
              options={[
                { value: "user", label: t("user") },
                { value: "associate", label: t("associate") },
              ]}
              value={portal}
              onChange={(p) => {
                setPortal(p);
                resetError();
              }}
            />
            <Segmented
              options={[
                { value: "otp", label: t("mobileOtp") },
                { value: "email", label: t("emailCode") },
                { value: "password", label: t("passwordShort") },
              ]}
              value={method}
              onChange={(m) => {
                setMethod(m);
                setOtpSent(false);
                resetError();
              }}
            />

            {method !== "password" ? (
              otpSent ? (
                <>
                  <Text style={styles.hint}>{method === "email" ? t("emailCodeSent") : t("otpSent")}</Text>
                  <Field
                    label={t("enterOtp")}
                    value={otp}
                    onChangeText={(v) => setOtp(v.replace(/\D/g, "").slice(0, 6))}
                    keyboardType="number-pad"
                    autoComplete="one-time-code"
                    textContentType="oneTimeCode"
                    maxLength={6}
                    autoFocus
                  />
                  <ErrorText>{error}</ErrorText>
                  <Button label={t("verify")} onPress={verifyOtp} busy={busy} />
                  <Button
                    label={method === "email" ? t("changeEmail") : t("changeNumber")}
                    variant="text"
                    disabled={busy}
                    onPress={() => {
                      setOtpSent(false);
                      resetError();
                    }}
                  />
                </>
              ) : method === "email" ? (
                <>
                  <Field
                    label={t("emailLabel")}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    autoComplete="email"
                    textContentType="emailAddress"
                    placeholder="name@example.com"
                  />
                  <ErrorText>{error}</ErrorText>
                  <Button label={t("sendEmailCode")} onPress={sendEmailCode} busy={busy} />
                </>
              ) : (
                <>
                  <Field
                    label={t("mobileNumber")}
                    value={phone}
                    onChangeText={(v) => setPhone(v.replace(/\D/g, "").slice(0, 10))}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    textContentType="telephoneNumber"
                    placeholder="9876543210"
                    maxLength={10}
                  />
                  <ErrorText>{error}</ErrorText>
                  <Button label={t("sendOtp")} onPress={sendOtp} busy={busy} />
                </>
              )
            ) : (
              <>
                <Field
                  label={t("emailOrMobile")}
                  value={identifier}
                  onChangeText={setIdentifier}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  autoComplete="username"
                  textContentType="username"
                />
                <Field
                  label={t("password")}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="current-password"
                  textContentType="password"
                />
                <Button label={showPassword ? t("hidePassword") : t("showPassword")} variant="text" onPress={() => setShowPassword((s) => !s)} />
                <ErrorText>{error}</ErrorText>
                <Button label={t("signIn")} onPress={passwordSignIn} busy={busy} />
                <Button label={t("forgotPassword")} variant="text" onPress={() => Linking.openURL(siteUrl("/auth/forgot-password", lang))} />
              </>
            )}
          </Card>

          <Button label={t("register")} variant="outline" onPress={() => router.push("/register")} />
          <Button label={t("continueBrowsing")} variant="text" onPress={leave} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  content: { flexGrow: 1, paddingBottom: space.xxl },
  hero: {
    paddingHorizontal: space.lg,
    paddingBottom: space.xxl + space.lg,
    alignItems: "center",
    gap: space.md,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  langRow: { alignSelf: "flex-end" },
  logoBox: { backgroundColor: colors.card, borderRadius: radius.lg, padding: space.sm, ...shadow.strong },
  logo: { width: 190, height: 142 },
  title: { fontSize: 26, color: colors.onMaroon, textAlign: "center", lineHeight: 32 },
  shloka: { fontSize: 16, color: colors.goldSoft, textAlign: "center" },
  form: { paddingHorizontal: space.lg, gap: space.lg, marginTop: -space.xl },
  label: { fontSize: 13, fontWeight: "600", color: colors.textMuted },
  hint: { fontSize: 14, color: colors.text, lineHeight: 20 },
});
