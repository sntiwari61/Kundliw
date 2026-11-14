import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "@/components/Text";
import { router, useLocalSearchParams } from "expo-router";
import { Button, Card, ErrorText } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { formatDay } from "@/lib/booking";
import { orderStatusLabel, paymentStatusLabel, useLanguage } from "@/lib/i18n";
import { needsPayment, type MobileOrder } from "@/lib/orders";
import { useSession } from "@/lib/session";
import { formatPaise } from "@/lib/validation";
import { colors, space } from "@/theme";

/** One of the customer's orders: what was booked, its status and the amounts. */
export default function OrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { api } = useSession();
  const { t, lang, pick } = useLanguage();
  const [order, setOrder] = useState<MobileOrder | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      setOrder((await api.request<{ order: MobileOrder }>(`/api/mobile/v1/orders/${id}`)).order);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    }
  }, [api, id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!order) {
    return (
      <View style={styles.content}>
        {error ? <ErrorText>{error}</ErrorText> : <ActivityIndicator color={colors.brand} style={{ marginTop: space.xl }} />}
        {error ? <Button label={t("retry")} variant="outline" onPress={load} /> : null}
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Card>
        <Text style={styles.small}>
          {t("orderNo")} {order.orderNumber}
        </Text>
        <Text style={styles.title}>{pick(order.serviceTitleEn, order.serviceTitleHi)}</Text>
        <Text style={styles.text}>{pick(order.planTitleEn, order.planTitleHi)}</Text>
        <Text style={styles.small}>
          {t("placedOn")} {formatDay(order.createdAt.slice(0, 10), lang)}
        </Text>
      </Card>

      <Card>
        <Row label={t("orderStatus")} value={order.cancelledAt ? t("cancelled") : orderStatusLabel(lang, order.status)} />
        <Row label={t("paymentStatus")} value={paymentStatusLabel(lang, order.paymentStatus)} />
        {order.slot ? <Row label={t("callTime")} value={`${formatDay(order.slot.date, lang)} · ${order.slot.startTime} - ${order.slot.endTime}`} /> : null}
        {order.invoiceNumber ? <Row label={t("invoiceNo")} value={order.invoiceNumber} /> : null}
        {order.rejectionReason ? (
          <ErrorText>
            {t("rejectedNote")}: {order.rejectionReason}
          </ErrorText>
        ) : null}
      </Card>

      <Card>
        <Row label={t("basePrice")} value={formatPaise(order.baseAmountPaise)} />
        {order.discountAmountPaise > 0 ? <Row label={`${t("discount")}${order.offerCode ? ` (${order.offerCode})` : ""}`} value={`- ${formatPaise(order.discountAmountPaise)}`} /> : null}
        <Row label={t("gstLine")} value={formatPaise(order.gstAmountPaise)} />
        <Row label={t("total")} value={formatPaise(order.netAmountPaise)} bold />
      </Card>

      {needsPayment(order) ? <Button label={t("payNow")} onPress={() => router.push({ pathname: "/pay/[id]", params: { id: order.id } })} /> : null}
    </ScrollView>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.text, bold && styles.bold]}>{label}</Text>
      <Text style={[styles.text, { flexShrink: 1, textAlign: "right" }, bold && styles.bold]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, gap: space.md, paddingBottom: space.xxl },
  title: { fontSize: 18, fontWeight: "700", color: colors.heading },
  small: { fontSize: 13, color: colors.textMuted },
  text: { fontSize: 15, color: colors.text },
  row: { flexDirection: "row", justifyContent: "space-between", gap: space.md },
  bold: { fontWeight: "800", color: colors.heading, fontSize: 17 },
});
