import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Linking, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "@/components/Text";
import * as Clipboard from "expo-clipboard";
import { router, useLocalSearchParams } from "expo-router";
import { Button, Card, ErrorText, Field, Segmented } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { orderStatusLabel, paymentStatusLabel, useLanguage } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { needsPayment, type MobileOrder } from "@/lib/orders";
import { formatPaise } from "@/lib/validation";
import { colors, space } from "@/theme";

interface PaymentInfo {
  upiVpa: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  bankIfsc: string | null;
  bankName: string | null;
}

type Method = "UPI" | "BANK";

/** Payment for a new order: send the money by UPI or bank transfer, then give the reference number. */
export default function PayScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { api } = useSession();
  const { t, lang, pick } = useLanguage();
  const [order, setOrder] = useState<MobileOrder | null>(null);
  const [info, setInfo] = useState<PaymentInfo | null>(null);
  const [error, setError] = useState("");
  const [method, setMethod] = useState<Method>("UPI");
  const [ref, setRef] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const [o, p] = await Promise.all([
        api.request<{ order: MobileOrder }>(`/api/mobile/v1/orders/${id}`),
        api.request<PaymentInfo>("/api/mobile/v1/payment-info"),
      ]);
      setOrder(o.order);
      setInfo(p);
      if (!p.upiVpa && p.bankAccountNumber) setMethod("BANK");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    }
  }, [api, id]);

  useEffect(() => {
    load();
  }, [load]);

  const copy = async (label: string, value: string) => {
    await Clipboard.setStringAsync(value);
    setCopied(label);
    setTimeout(() => setCopied((c) => (c === label ? "" : c)), 1500);
  };

  const openUpiApp = () => {
    if (!order || !info?.upiVpa) return;
    const amount = (order.netAmountPaise / 100).toFixed(2);
    const url = `upi://pay?pa=${encodeURIComponent(info.upiVpa)}&pn=${encodeURIComponent("Maharshi Kanad Jyotish Kendra")}&am=${amount}&cu=INR&tn=${encodeURIComponent(order.orderNumber)}`;
    Linking.openURL(url).catch(() => setError(t("noPayInfo")));
  };

  const submit = async () => {
    if (!order) return;
    if (!ref.trim()) {
      setError(t("utrRequired"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api.request("/api/payments/manual/submit", {
        method: "POST",
        body: { orderId: order.id, paymentMode: method === "UPI" ? "MANUAL_UPI" : "MANUAL_BANK", manualPaymentRef: ref.trim() },
      });
      setSent(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  if (!order) {
    return (
      <View style={styles.content}>
        {error ? <ErrorText>{error}</ErrorText> : <ActivityIndicator color={colors.brand} style={{ marginTop: space.xl }} />}
        {error ? <Button label={t("retry")} variant="outline" onPress={load} /> : null}
      </View>
    );
  }

  const title = `${pick(order.serviceTitleEn, order.serviceTitleHi)} · ${pick(order.planTitleEn, order.planTitleHi)}`;
  const payable = needsPayment(order);
  const hasUpi = !!info?.upiVpa;
  const hasBank = !!info?.bankAccountNumber;

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Card>
        <Text style={styles.small}>
          {t("orderNo")} {order.orderNumber}
        </Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.small}>{t("amountToPay")}</Text>
        <Text style={styles.amount}>{formatPaise(order.netAmountPaise)}</Text>
        <Text style={styles.small}>
          {orderStatusLabel(lang, order.status)} · {paymentStatusLabel(lang, order.paymentStatus)}
        </Text>
        {order.rejectionReason ? (
          <ErrorText>
            {t("rejectedNote")}: {order.rejectionReason}
          </ErrorText>
        ) : null}
      </Card>

      {sent ? (
        <Card>
          <Text style={styles.ok}>{t("paymentSent")}</Text>
          <Button label={t("myOrders")} onPress={() => router.replace("/orders")} />
        </Card>
      ) : !payable ? (
        <Button label={t("myOrders")} onPress={() => router.replace("/orders")} />
      ) : !hasUpi && !hasBank ? (
        <ErrorText>{t("noPayInfo")}</ErrorText>
      ) : (
        <>
          <Text style={styles.small}>{t("payStep")}</Text>
          {hasUpi && hasBank ? (
            <Segmented
              options={[
                { value: "UPI" as Method, label: t("payByUpi") },
                { value: "BANK" as Method, label: t("payByBank") },
              ]}
              value={method}
              onChange={setMethod}
            />
          ) : null}

          {method === "UPI" && hasUpi ? (
            <Card>
              <Line label={t("upiId")} value={info!.upiVpa!} onCopy={() => copy("upi", info!.upiVpa!)} copied={copied === "upi"} copyLabel={copied === "upi" ? t("copied") : t("copy")} />
              <Button label={t("payByUpi")} variant="outline" onPress={openUpiApp} />
            </Card>
          ) : null}

          {method === "BANK" && hasBank ? (
            <Card>
              <Line label={t("accountName")} value={info!.bankAccountName ?? ""} />
              <Line label={t("accountNumber")} value={info!.bankAccountNumber!} onCopy={() => copy("acc", info!.bankAccountNumber!)} copied={copied === "acc"} copyLabel={copied === "acc" ? t("copied") : t("copy")} />
              <Line label={t("ifsc")} value={info!.bankIfsc ?? ""} onCopy={info!.bankIfsc ? () => copy("ifsc", info!.bankIfsc!) : undefined} copied={copied === "ifsc"} copyLabel={copied === "ifsc" ? t("copied") : t("copy")} />
              <Line label={t("bank")} value={info!.bankName ?? ""} />
            </Card>
          ) : null}

          <Card>
            <Field label={t("utr")} value={ref} onChangeText={setRef} autoCapitalize="characters" autoCorrect={false} maxLength={120} />
            <ErrorText>{error}</ErrorText>
            <Button label={t("submitPayment")} onPress={submit} busy={busy} />
          </Card>
        </>
      )}
      {sent || !payable ? <ErrorText>{error}</ErrorText> : null}
    </ScrollView>
  );
}

function Line({ label, value, onCopy, copied, copyLabel }: { label: string; value: string; onCopy?: () => void; copied?: boolean; copyLabel?: string }) {
  if (!value) return null;
  return (
    <View style={styles.line}>
      <View style={{ flex: 1 }}>
        <Text style={styles.small}>{label}</Text>
        <Text selectable style={[styles.value, copied && { color: colors.success }]}>
          {value}
        </Text>
      </View>
      {onCopy ? <Button label={copyLabel ?? ""} variant="text" onPress={onCopy} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, gap: space.md, paddingBottom: space.xxl * 2 },
  title: { fontSize: 17, fontWeight: "700", color: colors.heading },
  small: { fontSize: 13, color: colors.textMuted, lineHeight: 19 },
  amount: { fontSize: 28, fontWeight: "800", color: colors.primary },
  ok: { fontSize: 15, color: colors.success, fontWeight: "700", lineHeight: 22 },
  line: { flexDirection: "row", alignItems: "center", gap: space.sm },
  value: { fontSize: 16, fontWeight: "700", color: colors.heading },
});
