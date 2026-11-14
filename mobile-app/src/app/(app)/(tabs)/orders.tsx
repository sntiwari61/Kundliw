import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Hero } from "@/components/Hero";
import { LangChip } from "@/components/LangChip";
import { SignInPrompt } from "@/components/SignInPrompt";
import { Text } from "@/components/Text";
import { Button, EmptyState, ErrorText, Pill, SkeletonList, TapCard } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { orderStatusLabel, paymentStatusLabel, useLanguage } from "@/lib/i18n";
import { needsPayment, type MobileOrder } from "@/lib/orders";
import { useSession } from "@/lib/session";
import { formatPaise } from "@/lib/validation";
import { colors, space } from "@/theme";

export function paymentTone(status: string): "success" | "warning" | "error" | "neutral" {
  if (status === "PAID") return "success";
  if (status === "AWAITING_VERIFICATION") return "warning";
  if (status === "FAILED") return "error";
  return "neutral";
}

/** The customer's own orders, newest first. */
export default function OrdersGate() {
  const { user } = useSession();
  const { t } = useLanguage();
  return user ? <OrdersScreen /> : <SignInPrompt title={t("guestOrdersTitle")} />;
}

function OrdersScreen() {
  const { api } = useSession();
  const { t, lang, pick } = useLanguage();
  const [orders, setOrders] = useState<MobileOrder[] | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      setOrders((await api.request<{ orders: MobileOrder[] }>("/api/mobile/v1/orders")).orders);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
      setOrders((o) => o ?? []);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: space.xxl }}
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
      <Hero title={t("myOrders")} right={<LangChip />} />
      <View style={styles.body}>
        <ErrorText>{error}</ErrorText>
        {error ? <Button label={t("retry")} variant="outline" onPress={load} /> : null}
        {orders === null ? <SkeletonList count={3} height={110} /> : null}
        {orders?.length === 0 && !error ? (
          <EmptyState title={t("noOrders")} action={<Button label={t("tabServices")} onPress={() => router.push("/services")} />} />
        ) : null}
        {orders?.map((o) => (
          <TapCard key={o.id} onPress={() => router.push({ pathname: "/orders/[id]", params: { id: o.id } })} style={{ gap: space.sm }}>
            <View style={styles.top}>
              <Text style={styles.number}>
                {t("orderNo")} {o.orderNumber}
              </Text>
              <Text style={styles.amount}>{formatPaise(o.netAmountPaise)}</Text>
            </View>
            <Text style={styles.title}>
              {pick(o.serviceTitleEn, o.serviceTitleHi)}
              {o.planTitleEn ? ` · ${pick(o.planTitleEn, o.planTitleHi)}` : ""}
            </Text>
            <View style={styles.pills}>
              {o.cancelledAt ? (
                <Pill label={t("cancelled")} tone="neutral" />
              ) : (
                <>
                  <Pill label={orderStatusLabel(lang, o.status)} tone="brand" />
                  <Pill label={paymentStatusLabel(lang, o.paymentStatus)} tone={paymentTone(o.paymentStatus)} />
                </>
              )}
            </View>
            {needsPayment(o) ? (
              <Button label={t("payNow")} onPress={() => router.push({ pathname: "/pay/[id]", params: { id: o.id } })} />
            ) : null}
          </TapCard>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: space.lg, gap: space.md },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  number: { fontSize: 12, color: colors.textMuted, fontWeight: "500" },
  amount: { fontSize: 16, fontWeight: "700", color: colors.primary },
  title: { fontSize: 15, fontWeight: "600", color: colors.heading, lineHeight: 22 },
  pills: { flexDirection: "row", gap: space.sm, flexWrap: "wrap" },
});
