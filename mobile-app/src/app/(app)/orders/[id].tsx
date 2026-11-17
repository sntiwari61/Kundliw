import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { router, useLocalSearchParams } from "expo-router";
import { Text } from "@/components/Text";
import { Button, Card, ErrorText, Field, Pill, SectionTitle } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { formatDay } from "@/lib/booking";
import { cacheFileName, downloadAndShare } from "@/lib/download";
import { orderStatusLabel, paymentStatusLabel, useLanguage } from "@/lib/i18n";
import { ORDER_STAGES, canDownloadInvoice, hasTracking, needsPayment, stageProgress, type MobileOrderDetail } from "@/lib/orders";
import { useSession } from "@/lib/session";
import { formatPaise } from "@/lib/validation";
import { colors, space } from "@/theme";

/** One of the customer's orders: progress, tracking, history, amounts, and what they can still do with it. */
export default function OrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { api } = useSession();
  const { t, lang, pick } = useLanguage();
  const [order, setOrder] = useState<MobileOrderDetail | null>(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [asking, setAsking] = useState(false);
  const [reason, setReason] = useState("");
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      setOrder((await api.request<{ order: MobileOrderDetail }>(`/api/mobile/v1/orders/${id}`)).order);
      setError("");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    }
  }, [api, id]);

  useEffect(() => {
    load();
  }, [load]);

  const fail = (e: unknown) => setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : String(e));

  const download = async (kind: "invoice" | "ticket") => {
    if (!order) return;
    setError("");
    setInfo("");
    setBusy(kind);
    try {
      const path = kind === "invoice" ? `/api/invoice/${order.id}` : `/api/ticket/${order.id}?lang=${lang}`;
      await downloadAndShare(api, path, cacheFileName(order.id, `${kind}-${order.orderNumber}.pdf`), "application/pdf", order.orderNumber);
    } catch (e) {
      fail(e);
    } finally {
      setBusy("");
    }
  };

  const cancel = async () => {
    if (!order) return;
    if (reason.trim().length < 3) {
      setError(t("cancelReasonShort"));
      return;
    }
    setError("");
    setBusy("cancel");
    try {
      const r = await api.request<{ refundPaise: number }>(`/api/orders/${order.id}/cancel`, { method: "POST", body: { reason: reason.trim() } });
      setInfo(r.refundPaise > 0 ? t("cancelDoneRefund") : t("cancelDone"));
      setAsking(false);
      setReason("");
      await load();
    } catch (e) {
      fail(e);
    } finally {
      setBusy("");
    }
  };

  const upgrade = async (planId: string) => {
    setError("");
    setBusy(planId);
    try {
      const r = await api.request<{ orderId: string }>(`/api/orders/${id}/upgrade`, { method: "POST", body: { planId } });
      router.push({ pathname: "/pay/[id]", params: { id: r.orderId } });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("upgradeFailed"));
    } finally {
      setBusy("");
    }
  };

  const copyTracking = async () => {
    if (!order?.trackingNumber) return;
    await Clipboard.setStringAsync(order.trackingNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!order) {
    return (
      <View style={styles.content}>
        {error ? <ErrorText>{error}</ErrorText> : <ActivityIndicator color={colors.brand} style={{ marginTop: space.xl }} />}
        {error ? <Button label={t("retry")} variant="outline" onPress={load} /> : null}
      </View>
    );
  }

  const cancelled = !!order.cancelledAt;
  const { index } = stageProgress(order.status);
  const title = pick(order.serviceTitleEn, order.serviceTitleHi);
  const blockedReason = order.cancel && !order.cancel.allowed && !cancelled ? pick(order.cancel.reasonEn, order.cancel.reasonHi) : "";
  const refundKey = order.refundStatus ? (`refund${order.refundStatus}` as "refundSENT") : null;

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={colors.brand}
          onRefresh={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }}
        />
      }
    >
      <Card>
        <Text style={styles.small}>
          {t("orderNo")} {order.orderNumber}
        </Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.text}>{pick(order.planTitleEn, order.planTitleHi)}</Text>
        <Text style={styles.small}>
          {t("placedOn")} {formatDay(order.createdAt.slice(0, 10), lang)}
        </Text>
        <View style={styles.pills}>
          {cancelled ? (
            <Pill label={t("cancelled")} tone="neutral" />
          ) : (
            <>
              <Pill label={orderStatusLabel(lang, order.status)} tone="brand" />
              <Pill label={paymentStatusLabel(lang, order.paymentStatus)} tone={order.paymentStatus === "PAID" ? "success" : order.paymentStatus === "AWAITING_VERIFICATION" ? "warning" : "neutral"} />
            </>
          )}
        </View>
      </Card>

      {info ? <Text style={styles.ok}>{info}</Text> : null}
      <ErrorText>{error}</ErrorText>

      {order.rejectionReason ? (
        <ErrorText>
          {t("rejectedNote")}: {order.rejectionReason}
        </ErrorText>
      ) : null}

      {needsPayment(order) ? <Button label={t("payNow")} onPress={() => router.push({ pathname: "/pay/[id]", params: { id: order.id } })} /> : null}

      {cancelled ? (
        <Card>
          <Row label={t("cancelled")} value={order.cancelledAt ? formatDay(order.cancelledAt.slice(0, 10), lang) : ""} />
          {order.cancelReason ? <Row label={t("cancelReasonIs")} value={order.cancelReason} /> : null}
          {refundKey && order.refundStatus ? (
            <Row label={t(refundKey)} value={order.refundAmountPaise ? formatPaise(order.refundAmountPaise) : ""} />
          ) : null}
        </Card>
      ) : (
        <>
          <SectionTitle>{t("orderProgress")}</SectionTitle>
          <Card style={{ gap: 0 }}>
            {ORDER_STAGES.map((stage, i) => {
              const done = i < index || (i === index && (stage === "EXECUTION_COMPLETE" || order.status === "EXECUTION_COMPLETE"));
              const current = i === index && !done;
              return (
                <View key={stage} style={styles.stageRow}>
                  <View style={styles.stageRail}>
                    <View style={[styles.dot, done && styles.dotDone, current && styles.dotNow]}>
                      {done ? <Ionicons name="checkmark" size={14} color={colors.onBrand} /> : null}
                    </View>
                    {i < ORDER_STAGES.length - 1 ? <View style={[styles.line, done && { backgroundColor: colors.success }]} /> : null}
                  </View>
                  <Text style={[styles.stageText, (done || current) && { color: colors.heading, fontWeight: "700" }]}>{orderStatusLabel(lang, stage)}</Text>
                </View>
              );
            })}
          </Card>
        </>
      )}

      {order.slot ? (
        <Card>
          <Text style={styles.small}>{t("appointment")}</Text>
          <Text style={styles.text}>{`${formatDay(order.slot.date, lang)} · ${order.slot.startTime} - ${order.slot.endTime}`}</Text>
          {order.appointmentStatus ? <Pill label={t(`appt${order.appointmentStatus}` as "apptPENDING")} tone={order.appointmentStatus === "REJECTED" ? "error" : order.appointmentStatus === "PENDING" ? "warning" : "success"} /> : null}
          {order.appointmentNote ? <Text style={styles.small}>{order.appointmentNote}</Text> : null}
        </Card>
      ) : null}

      {hasTracking(order) ? (
        <Card>
          <Text style={styles.small}>{t("trackingTitle")}</Text>
          {order.courierName ? <Row label={t("courier")} value={order.courierName} /> : null}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.small}>{t("trackingNo")}</Text>
              <Text selectable style={[styles.text, { fontWeight: "700" }, copied && { color: colors.success }]}>
                {order.trackingNumber}
              </Text>
            </View>
            <Button label={copied ? t("copied") : t("copy")} variant="text" onPress={copyTracking} />
          </View>
        </Card>
      ) : null}

      <Card>
        <Row label={t("basePrice")} value={formatPaise(order.baseAmountPaise)} />
        {order.discountAmountPaise > 0 ? <Row label={`${t("discount")}${order.offerCode ? ` (${order.offerCode})` : ""}`} value={`- ${formatPaise(order.discountAmountPaise)}`} /> : null}
        <Row label={t("gstLine")} value={formatPaise(order.gstAmountPaise)} />
        <Row label={t("total")} value={formatPaise(order.netAmountPaise)} bold />
        {order.invoiceNumber ? <Row label={t("invoiceNo")} value={order.invoiceNumber} /> : null}
      </Card>

      {order.paymentStatus === "PAID" && !cancelled ? (
        <View style={{ gap: space.sm }}>
          {canDownloadInvoice(order) ? <Button label={t("downloadInvoice")} variant="outline" onPress={() => download("invoice")} busy={busy === "invoice"} /> : null}
          <Button label={t("downloadTicket")} variant="outline" onPress={() => download("ticket")} busy={busy === "ticket"} />
        </View>
      ) : null}

      {order.upgrades && order.upgrades.length > 0 ? (
        <>
          <SectionTitle>{t("upgradeTitle")}</SectionTitle>
          <Card>
            <Text style={styles.small}>{t("upgradeNote")}</Text>
            {order.upgrades.map((p) => (
              <Button key={p.id} label={`${t("upgradeTo")} ${pick(p.titleEn, p.titleHi)} · ${formatPaise(p.pricePaise)}`} variant="outline" onPress={() => upgrade(p.id)} busy={busy === p.id} />
            ))}
          </Card>
        </>
      ) : null}

      {(order.documents ?? 0) > 0 ? (
        <Card>
          <Text style={styles.text}>{`${t("orderDocuments")}: ${order.documents}`}</Text>
          <Button label={t("viewDocuments")} variant="outline" onPress={() => router.push("/vault")} />
        </Card>
      ) : null}

      <SectionTitle>{t("orderHistory")}</SectionTitle>
      {order.events && order.events.length > 0 ? (
        <Card>
          {order.events.map((e) => (
            <View key={e.id} style={{ gap: 2 }}>
              <Text style={styles.small}>{`${formatDay(e.createdAt.slice(0, 10), lang)} · ${orderStatusLabel(lang, e.status)}`}</Text>
              {e.note ? <Text style={styles.text}>{e.note}</Text> : null}
            </View>
          ))}
        </Card>
      ) : (
        <Text style={styles.small}>{t("noHistory")}</Text>
      )}

      {!cancelled && order.cancel?.allowed ? (
        asking ? (
          <Card>
            <Field label={t("cancelWhy")} value={reason} onChangeText={setReason} multiline maxLength={500} style={{ minHeight: 84, textAlignVertical: "top" }} />
            <Button label={t("cancelConfirm")} variant="danger" onPress={cancel} busy={busy === "cancel"} />
            <Button
              label={t("keepOrder")}
              variant="outline"
              onPress={() => {
                setAsking(false);
                setError("");
              }}
            />
          </Card>
        ) : (
          <Button label={t("cancelOrder")} variant="outline" onPress={() => setAsking(true)} />
        )
      ) : null}
      {blockedReason ? <Text style={styles.small}>{blockedReason}</Text> : null}

      <View style={{ gap: space.sm }}>
        {order.serviceSlug ? <Button label={t("bookAgain")} variant="outline" onPress={() => router.push({ pathname: "/service/[slug]", params: { slug: order.serviceSlug as string } })} /> : null}
        <Button label={t("orderHelp")} variant="text" onPress={() => router.push({ pathname: "/tickets/new", params: { order: order.orderNumber, subject: `${t("orderNo")} ${order.orderNumber}` } })} />
      </View>
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
  content: { padding: space.lg, gap: space.md, paddingBottom: space.xxl * 2 },
  title: { fontSize: 18, fontWeight: "700", color: colors.heading },
  small: { fontSize: 13, color: colors.textMuted, lineHeight: 19 },
  text: { fontSize: 15, color: colors.text, lineHeight: 22 },
  ok: { fontSize: 14, color: colors.success, fontWeight: "600", lineHeight: 20 },
  pills: { flexDirection: "row", gap: space.sm, flexWrap: "wrap" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: space.md },
  bold: { fontWeight: "800", color: colors.heading, fontSize: 17 },
  stageRow: { flexDirection: "row", alignItems: "flex-start", gap: space.md, minHeight: 40 },
  stageRail: { alignItems: "center", width: 22 },
  dot: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.outlineVariant, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" },
  dotDone: { backgroundColor: colors.success, borderColor: colors.success },
  dotNow: { borderColor: colors.brand, backgroundColor: colors.goldSoft },
  line: { width: 2, flex: 1, minHeight: 18, backgroundColor: colors.outlineVariant },
  stageText: { flex: 1, fontSize: 15, color: colors.textMuted, paddingTop: 1 },
});
