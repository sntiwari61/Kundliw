import { useMemo, useRef, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, View } from "react-native";
import { Text } from "@/components/Text";
import { router, useLocalSearchParams } from "expo-router";
import { Button, Card, ErrorText, Field, Segmented } from "@/components/ui";
import { ApiError } from "@/lib/api";
import {
  buildBookingBody,
  emptyForm,
  formatDay,
  gstLabel,
  isKundliService,
  needsPartner,
  previewTotals,
  validateBooking,
  type BookingForm,
  type FormErrors,
  type Gender,
} from "@/lib/booking";
import { useLanguage } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { useCatalog } from "@/lib/useCatalog";
import { formatPaise } from "@/lib/validation";
import { colors, radius, space, TOUCH } from "@/theme";

interface OfferResult {
  isValid: boolean;
  reason?: string;
  code?: string;
  discountPaise?: number;
}

/** The booking form: birth details (and family or partner details where the service needs them), call time, offer, price. */
export default function BookScreen() {
  const { slug, plan: planSlug } = useLocalSearchParams<{ slug: string; plan: string }>();
  const { user, api } = useSession();
  const { t, lang, pick } = useLanguage();
  const { catalog, error: loadError, reload, loading } = useCatalog();

  const [form, setForm] = useState<BookingForm>(() =>
    emptyForm({ name: user?.name ?? "", phone: user?.phone?.replace(/^\+?91/, "") ?? "", email: user?.email ?? "", language: lang }),
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [offer, setOffer] = useState<{ code: string; discountPaise: number } | null>(null);
  const [offerError, setOfferError] = useState("");
  const [offerBusy, setOfferBusy] = useState(false);
  // One key per form, so a double tap or a retry never creates two orders
  const idempotencyKey = useRef(`app-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`).current;

  const service = catalog?.services.find((s) => s.slug === slug);
  const plan = service?.plans.find((p) => p.slug === planSlug);

  const set = <K extends keyof BookingForm>(key: K, value: BookingForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  };

  const totals = useMemo(
    () => (plan && catalog ? previewTotals(plan.pricePaise, offer?.discountPaise ?? 0, catalog.gstRateBasisPoints) : null),
    [plan, catalog, offer],
  );

  const applyOffer = async () => {
    if (!plan || !form.offerCode.trim()) return;
    setOfferBusy(true);
    setOfferError("");
    try {
      const r = await api.request<OfferResult>("/api/offers/validate", {
        method: "POST",
        body: { code: form.offerCode.trim().toUpperCase(), planId: plan.id },
      });
      if (r.isValid && r.code) setOffer({ code: r.code, discountPaise: r.discountPaise ?? 0 });
      else setOfferError(r.reason || "Invalid or unavailable coupon code.");
    } catch (e) {
      setOfferError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setOfferBusy(false);
    }
  };

  const removeOffer = () => {
    setOffer(null);
    set("offerCode", "");
  };

  const submit = async () => {
    if (!service || !plan) return;
    // Browsing is open to all; signing in is needed only now, before the order is made. This form stays open underneath.
    if (!user) {
      setFormError(t("loginToBook"));
      router.push("/sign-in");
      return;
    }
    const found = validateBooking(form, service.slug, plan);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setFormError(t("fixErrors"));
      return;
    }
    setFormError("");
    setBusy(true);
    try {
      const body = buildBookingBody({ ...form, offerCode: offer?.code ?? "" }, service.slug, plan, idempotencyKey);
      const res = await api.request<{ orderId: string }>("/api/booking", { method: "POST", body });
      router.replace({ pathname: "/pay/[id]", params: { id: res.orderId } });
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const text = (key: keyof BookingForm, label: string, extra: Record<string, unknown> = {}) => (
    <View style={{ gap: space.xs }}>
      <Field label={label} value={String(form[key])} onChangeText={(v) => set(key, v as never)} {...extra} />
      {errors[key] ? <ErrorText>{t(errors[key]!)}</ErrorText> : null}
    </View>
  );

  const genderOptions = [
    { value: "MALE" as Gender, label: t("male") },
    { value: "FEMALE" as Gender, label: t("female") },
    { value: "OTHER" as Gender, label: t("other") },
  ];

  if (loading) return <ActivityIndicator color={colors.brand} style={{ marginTop: space.xxl }} />;
  if (!service || !plan) {
    return (
      <View style={styles.content}>
        <ErrorText>{loadError || t("noPlans")}</ErrorText>
        <Button label={t("retry")} variant="outline" onPress={reload} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{pick(service.titleEn, service.titleHi)}</Text>
        <Text style={styles.sub}>
          {pick(plan.titleEn, plan.titleHi)} · {formatPaise(plan.pricePaise)}
        </Text>

        <Card>
          <Text style={styles.section}>{t("yourDetails")}</Text>
          {text("name", t("fullName"), { autoCapitalize: "words" })}
          <Text style={styles.label}>{t("gender")}</Text>
          <Segmented options={genderOptions} value={form.gender} onChange={(v) => set("gender", v)} />
          {text("dob", t("dob"), { keyboardType: "numbers-and-punctuation", placeholder: "25-12-1990", maxLength: 10 })}
          <View style={styles.switchRow}>
            <Text style={[styles.label, { flex: 1 }]}>{t("timeUnknown")}</Text>
            <Switch value={form.timeUnknown} onValueChange={(v) => set("timeUnknown", v)} trackColor={{ true: colors.maroon }} />
          </View>
          {form.timeUnknown ? null : text("tob", t("tob"), { keyboardType: "numbers-and-punctuation", placeholder: "06:05", maxLength: 5 })}
          {text("pob", t("pob"), { autoCapitalize: "words" })}
          {text("phone", t("contactPhone"), { keyboardType: "phone-pad", maxLength: 13 })}
          {text("email", t("emailOptional"), { keyboardType: "email-address", autoCapitalize: "none", autoCorrect: false })}
          <Text style={styles.label}>{t("reportLanguage")}</Text>
          <Segmented
            options={[
              { value: "hi" as const, label: "हिन्दी" },
              { value: "en" as const, label: "English" },
            ]}
            value={form.language}
            onChange={(v) => set("language", v)}
          />
          {text("queries", t("queries"), { multiline: true, maxLength: 1000, style: { minHeight: 96, textAlignVertical: "top" } })}
        </Card>

        {isKundliService(service.slug) ? (
          <Card>
            <Text style={styles.section}>{t("familyDetails")}</Text>
            {text("fatherName", t("fatherName"), { autoCapitalize: "words" })}
            {text("motherName", t("motherName"), { autoCapitalize: "words" })}
            {text("grandfatherName", t("grandfatherName"), { autoCapitalize: "words" })}
            {text("gotra", t("gotra"), { autoCapitalize: "words" })}
            {text("address", t("address"), { multiline: true, maxLength: 500, style: { minHeight: 72, textAlignVertical: "top" } })}
          </Card>
        ) : null}

        {needsPartner(service.slug) ? (
          <Card>
            <Text style={styles.section}>{t("partnerDetails")}</Text>
            {text("partnerName", t("partnerName"), { autoCapitalize: "words" })}
            <Text style={styles.label}>{t("gender")}</Text>
            <Segmented options={genderOptions} value={form.partnerGender} onChange={(v) => set("partnerGender", v)} />
            {text("partnerDob", t("dob"), { keyboardType: "numbers-and-punctuation", placeholder: "25-12-1992", maxLength: 10 })}
            <View style={styles.switchRow}>
              <Text style={[styles.label, { flex: 1 }]}>{t("timeUnknown")}</Text>
              <Switch value={form.partnerTimeUnknown} onValueChange={(v) => set("partnerTimeUnknown", v)} trackColor={{ true: colors.maroon }} />
            </View>
            {form.partnerTimeUnknown ? null : text("partnerTob", t("tob"), { keyboardType: "numbers-and-punctuation", placeholder: "06:05", maxLength: 5 })}
            {text("partnerPob", t("pob"), { autoCapitalize: "words" })}
          </Card>
        ) : null}

        {plan.hasCall ? (
          <Card>
            <Text style={styles.section}>{t("chooseSlot")}</Text>
            {catalog && catalog.slots.length === 0 ? <Text style={styles.sub}>{t("noSlots")}</Text> : null}
            {catalog?.slots.map((s) => {
              const on = form.slotId === s.id;
              return (
                <Pressable
                  key={s.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  onPress={() => set("slotId", s.id)}
                  style={[styles.slot, on && { backgroundColor: colors.maroon, borderColor: colors.maroon }]}
                >
                  <Text style={[styles.slotText, on && { color: colors.onMaroon }]}>
                    {formatDay(s.date, lang)} · {s.startTime} - {s.endTime}
                  </Text>
                </Pressable>
              );
            })}
            {errors.slotId ? <ErrorText>{t(errors.slotId)}</ErrorText> : null}
          </Card>
        ) : null}

        <Card>
          <Field
            label={t("offerCode")}
            value={form.offerCode}
            onChangeText={(v) => set("offerCode", v)}
            autoCapitalize="characters"
            editable={!offer}
          />
          {offer ? (
            <View style={styles.switchRow}>
              <Text style={[styles.ok, { flex: 1 }]}>
                {t("offerApplied")}: {offer.code}
              </Text>
              <Button label={t("removeOffer")} variant="text" onPress={removeOffer} />
            </View>
          ) : (
            <Button label={t("apply")} variant="outline" onPress={applyOffer} busy={offerBusy} disabled={!form.offerCode.trim()} />
          )}
          <ErrorText>{offerError}</ErrorText>
        </Card>

        {totals && catalog ? (
          <Card>
            <Text style={styles.section}>{t("priceSummary")}</Text>
            <Row label={t("basePrice")} value={formatPaise(plan.pricePaise)} />
            {offer ? <Row label={t("discount")} value={`- ${formatPaise(offer.discountPaise)}`} /> : null}
            <Row label={`${t("gstLine")} (${gstLabel(catalog.gstRateBasisPoints)}%)`} value={formatPaise(totals.gst)} />
            <Row label={t("total")} value={formatPaise(totals.net)} bold />
            <Text style={styles.sub}>{t("totalNote")}</Text>
          </Card>
        ) : null}

        <ErrorText>{formError}</ErrorText>
        <Button label={t("placeOrder")} onPress={submit} busy={busy} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowText, bold && styles.bold]}>{label}</Text>
      <Text style={[styles.rowText, bold && styles.bold]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, gap: space.md, paddingBottom: space.xxl * 2 },
  title: { fontSize: 20, fontWeight: "700", color: colors.heading },
  sub: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  section: { fontSize: 16, fontWeight: "700", color: colors.heading },
  label: { fontSize: 13, fontWeight: "700", color: colors.textMuted },
  switchRow: { flexDirection: "row", alignItems: "center", gap: space.md },
  slot: {
    minHeight: TOUCH,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    backgroundColor: colors.card,
  },
  slotText: { fontSize: 15, color: colors.text, fontWeight: "600" },
  ok: { color: colors.success, fontWeight: "700", fontSize: 14 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: space.md },
  rowText: { fontSize: 15, color: colors.text },
  bold: { fontWeight: "800", color: colors.heading, fontSize: 17 },
});
