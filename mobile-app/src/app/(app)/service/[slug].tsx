import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "@/components/Text";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { Button, Card, ErrorText } from "@/components/ui";
import { useLanguage } from "@/lib/i18n";
import { useCatalog } from "@/lib/useCatalog";
import { formatPaise } from "@/lib/validation";
import { colors, space } from "@/theme";

/** One service with its plans; choosing a plan goes to the booking form. */
export default function ServiceScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { t, pick } = useLanguage();
  const { catalog, error, reload, loading } = useCatalog();
  const service = catalog?.services.find((s) => s.slug === slug);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: service ? pick(service.titleEn, service.titleHi) : t("services") }} />
      {loading ? <ActivityIndicator color={colors.brand} style={{ marginTop: space.xl }} /> : null}
      <ErrorText>{error}</ErrorText>
      {error ? <Button label={t("retry")} variant="outline" onPress={reload} /> : null}
      {catalog && !service ? <Text style={styles.note}>{t("noPlans")}</Text> : null}
      {service ? (
        <>
          <Text style={styles.title}>{pick(service.titleEn, service.titleHi)}</Text>
          <Text style={styles.heading}>{t("choosePlan")}</Text>
          {service.plans.map((p) => {
            const facts = [
              p.deliveryDays ? `${t("deliveryIn")} ${p.deliveryDays} ${t("days")}` : "",
              p.pages ? `${p.pages} ${t("pagesWord")}` : "",
              p.hasCall ? (p.callDurationMinutes ? `${t("callOf")} ${p.callDurationMinutes} ${t("minutes")}` : t("includesCall")) : "",
            ].filter(Boolean);
            return (
              <Card key={p.id}>
                <Text style={styles.planTitle}>{pick(p.titleEn, p.titleHi)}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.price}>{formatPaise(p.pricePaise)}</Text>
                  {p.originalPricePaise && p.originalPricePaise > p.pricePaise ? (
                    <Text style={styles.was}>{formatPaise(p.originalPricePaise)}</Text>
                  ) : null}
                </View>
                {facts.map((f) => (
                  <Text key={f} style={styles.fact}>
                    • {f}
                  </Text>
                ))}
                <Button
                  label={t("bookThisPlan")}
                  onPress={() => router.push({ pathname: "/book", params: { slug: service.slug, plan: p.slug } })}
                />
              </Card>
            );
          })}
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, gap: space.md },
  title: { fontSize: 20, fontWeight: "700", color: colors.heading },
  heading: { fontSize: 16, fontWeight: "700", color: colors.heading, marginTop: space.sm },
  note: { fontSize: 14, color: colors.textMuted },
  planTitle: { fontSize: 16, fontWeight: "700", color: colors.heading },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: space.sm },
  price: { fontSize: 22, fontWeight: "800", color: colors.primary },
  was: { fontSize: 14, color: colors.textMuted, textDecorationLine: "line-through" },
  fact: { fontSize: 14, color: colors.text },
});
