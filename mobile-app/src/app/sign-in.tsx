import { useState } from "react";
import { Image, KeyboardAvoidingView, Linking, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Card, ErrorText, Field, Segmented } from "@/components/ui";
import { ApiError, type Portal } from "@/lib/api";
import { siteUrl } from "@/lib/config";
import { useLanguage } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { isValidOtp, isValidPhone } from "@/lib/validation";
import { colors, space } from "@/theme";

type Method = "otp" | "password";

export default function SignInScreen() {
  const { t, lang, setLang } = useLanguage();
  const { api, signInWithOtp, signInWithPassword } = useSession();

  const [portal, setPortal] = useState<Portal>("user");
  const [method, setMethod] = useState<Method>("otp");
  const [phone, setPhone] = useState("");
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

  const verifyOtp = () => {
    if (!isValidOtp(otp)) return setError(t("invalidOtp"));
    return run(() => signInWithOtp(phone, otp, portal));
  };

  const passwordSignIn = () => {
    if (!identifier.trim() || !password) return setError(t("fillBoth"));
    return run(() => signInWithPassword(identifier.trim(), password, portal));
  };

  const resetError = () => setError("");

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.langRow}>
            <Segmented
              options={[
                { value: "hi", label: "हिन्दी" },
                { value: "en", label: "EN" },
              ]}
              value={lang}
              onChange={setLang}
            />
          </View>

          <Image source={require("../../assets/splash-icon.png")} style={styles.logo} resizeMode="contain" accessibilityIgnoresInvertColors />
          <Text style={styles.title}>{t("appName")}</Text>

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
                { value: "password", label: t("emailPassword") },
              ]}
              value={method}
              onChange={(m) => {
                setMethod(m);
                resetError();
              }}
            />

            {method === "otp" ? (
              otpSent ? (
                <>
                  <Text style={styles.hint}>{t("otpSent")}</Text>
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
                    label={t("changeNumber")}
                    variant="text"
                    disabled={busy}
                    onPress={() => {
                      setOtpSent(false);
                      resetError();
                    }}
                  />
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

          <Button label={t("register")} variant="outline" onPress={() => Linking.openURL(siteUrl("/auth/register", lang))} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  content: { padding: space.lg, gap: space.lg, flexGrow: 1 },
  langRow: { alignSelf: "flex-end", width: 160 },
  logo: { width: 180, height: 135, alignSelf: "center" },
  title: { fontSize: 22, fontWeight: "700", color: colors.heading, textAlign: "center" },
  label: { fontSize: 13, fontWeight: "700", color: colors.textMuted },
  hint: { fontSize: 14, color: colors.text, lineHeight: 20 },
});
