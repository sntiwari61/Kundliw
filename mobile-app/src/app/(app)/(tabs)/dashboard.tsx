import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, Share, StyleSheet, View } from "react-native";
import { Hero } from "@/components/Hero";
import { LangChip } from "@/components/LangChip";
import { Text } from "@/components/Text";
import { Button, Card, EmptyState, ErrorText, Field, Pill, SectionTitle, SkeletonList } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { canRequestPayout, commissionTone, isValidReferralCode, referralLink, type AssociateSummary } from "@/lib/associate";
import { formatDay } from "@/lib/booking";
import { API_URL } from "@/lib/config";
import { commissionStatusLabel, payoutStatusLabel, useLanguage } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { formatPaise } from "@/lib/validation";
import { colors, radius, space } from "@/theme";

/** An Associate's referral code, earnings, commissions and payout requests. */
export default function DashboardScreen() {
  const { api } = useSession();
  const { t, lang, pick } = useLanguage();
  const [data, setData] = useState<AssociateSummary | null>(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [custom, setCustom] = useState("");

  const load = useCallback(async () => {
    try {
      setData(await api.request<AssociateSummary>("/api/associate/summary"));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  async function run(name: string, action: () => Promise<void>) {
    setError("");
    setInfo("");
    setBusy(name);
    try {
      await action();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setBusy("");
    }
  }

  const share = () => {
    if (!data) return;
    const link = referralLink(API_URL, data.profile.referralCode);
    return Share.share({ message: `${t("shareText")}\n${link}\n\n${t("referralCode")}: ${data.profile.referralCode}` });
  };

  const changeCode = (mode: "generate" | "custom") => {
    if (mode === "custom" && !isValidReferralCode(custom)) {
      setError(t("ownCode"));
      return;
    }
    return run("code", async () => {
      await api.request("/api/associate/referral-code", { method: "POST", body: mode === "custom" ? { mode, code: custom.trim() } : { mode } });
      setInfo(t("codeChanged"));
      setEditing(false);
      setCustom("");
      await load();
    });
  };

  const requestPayout = () =>
    run("payout", async () => {
      await api.request("/api/associate/payout", { method: "POST", body: {} });
      setInfo(t("payoutDone"));
      await load();
    });

  const status = data?.profile.status;

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: space.xxl }}
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
      <Hero title={t("dashTitle")} right={<LangChip />} />
      <View style={styles.body}>
        <ErrorText>{error}</ErrorText>
        {info ? <Text style={styles.ok}>{info}</Text> : null}
        {!data && !error ? <SkeletonList count={3} height={110} /> : null}
        {error && !data ? <Button label={t("retry")} variant="outline" onPress={load} /> : null}

        {data && status !== "APPROVED" ? (
          <EmptyState
            title={status === "PENDING" ? t("assocPending") : status === "REJECTED" ? t("assocRejected") : t("assocSuspended")}
            note={status === "REJECTED" ? (data.profile.rejectionReason ?? undefined) : undefined}
          />
        ) : null}

        {data && status === "APPROVED" ? (
          <>
            <Card>
              <Text style={styles.label}>{t("referralCode")}</Text>
              <View style={styles.codeBox}>
                <Text style={styles.code} selectable>
                  {data.profile.referralCode}
                </Text>
              </View>
              <Button label={t("shareCode")} onPress={share} />
              {editing ? (
                <View style={{ gap: space.md }}>
                  <Field label={t("ownCode")} value={custom} onChangeText={(v) => setCustom(v.replace(/[^A-Za-z0-9]/g, "").slice(0, 16))} autoCapitalize="characters" autoCorrect={false} />
                  <Button label={t("saveCode")} onPress={() => changeCode("custom")} busy={busy === "code"} disabled={!isValidReferralCode(custom)} />
                  <Button label={t("randomCode")} variant="outline" onPress={() => changeCode("generate")} busy={busy === "code"} />
                  <Button label={t("cancel")} variant="text" onPress={() => setEditing(false)} />
                </View>
              ) : (
                <Button label={t("changeCode")} variant="text" onPress={() => setEditing(true)} />
              )}
            </Card>

            <View style={styles.grid}>
              <Stat label={t("earnAvailable")} value={formatPaise(data.earnings.availablePaise)} strong />
              <Stat label={t("earnPending")} value={formatPaise(data.earnings.pendingPaise)} />
              <Stat label={t("earnRequested")} value={formatPaise(data.earnings.requestedPaise)} />
              <Stat label={t("earnPaid")} value={formatPaise(data.earnings.paidPaise)} />
            </View>
            <Text style={styles.small}>
              {t("referredOrders")}: {data.earnings.referredOrders}
            </Text>

            <Card>
              <Text style={styles.small}>{t("payoutHint")}</Text>
              <Button label={t("requestPayout")} onPress={requestPayout} busy={busy === "payout"} disabled={!canRequestPayout(data)} />
            </Card>

            <SectionTitle>{t("commissions")}</SectionTitle>
            {data.commissions.length === 0 ? <EmptyState title={t("noCommissions")} /> : null}
            {data.commissions.map((c) => (
              <Card key={c.id} style={{ gap: space.sm }}>
                <View style={styles.rowBetween}>
                  <Text style={styles.small}>
                    {c.order?.orderNumber ?? ""} · {formatDay(c.createdAt.slice(0, 10), lang)}
                  </Text>
                  <Text style={styles.amount}>{formatPaise(c.amountPaise)}</Text>
                </View>
                {c.order?.service ? <Text style={styles.title}>{pick(c.order.service.titleEn, c.order.service.titleHi)}</Text> : null}
                <Pill label={commissionStatusLabel(lang, c.status)} tone={commissionTone(c.status)} />
              </Card>
            ))}

            {data.payouts.length > 0 ? <SectionTitle>{t("payouts")}</SectionTitle> : null}
            {data.payouts.map((p) => (
              <Card key={p.id} style={{ gap: space.sm }}>
                <View style={styles.rowBetween}>
                  <Text style={styles.small}>{formatDay(p.createdAt.slice(0, 10), lang)}</Text>
                  <Text style={styles.amount}>{formatPaise(p.amountPaise)}</Text>
                </View>
                <Pill label={payoutStatusLabel(lang, p.status)} tone={p.status === "PAID" ? "success" : p.status === "REJECTED" ? "error" : "warning"} />
                {p.paymentReference ? <Text style={styles.small}>{p.paymentReference}</Text> : null}
              </Card>
            ))}
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}

function Stat({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={[styles.stat, strong && { backgroundColor: colors.maroon }]}>
      <Text style={[styles.statValue, strong && { color: colors.onMaroon }]}>{value}</Text>
      <Text style={[styles.statLabel, strong && { color: colors.goldSoft }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: space.lg, gap: space.md },
  label: { fontSize: 13, fontWeight: "600", color: colors.textMuted },
  codeBox: { backgroundColor: colors.goldSoft, borderRadius: radius.md, paddingVertical: space.md, alignItems: "center" },
  code: { fontSize: 26, fontWeight: "700", color: colors.maroon, letterSpacing: 3 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: space.md },
  stat: {
    width: "47.5%",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radius.lg,
    padding: space.md,
    gap: 2,
  },
  statValue: { fontSize: 20, fontWeight: "700", color: colors.heading },
  statLabel: { fontSize: 12, color: colors.textMuted },
  small: { fontSize: 13, color: colors.textMuted, lineHeight: 19 },
  title: { fontSize: 15, fontWeight: "600", color: colors.heading },
  amount: { fontSize: 16, fontWeight: "700", color: colors.primary },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: space.md },
  ok: { fontSize: 14, color: colors.success, fontWeight: "500" },
});
