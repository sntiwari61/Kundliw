import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Linking, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Button, ErrorText } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { siteUrl } from "@/lib/config";
import { useLanguage } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { formatPaise } from "@/lib/validation";
import { colors, radius, space, TOUCH } from "@/theme";

interface CatalogService {
  slug: string;
  titleEn: string;
  titleHi: string;
  plans: { id: string; pricePaise: number }[];
}

export default function HomeScreen() {
  const { user, api } = useSession();
  const { t, lang, pick } = useLanguage();
  const [services, setServices] = useState<CatalogService[] | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const data = await api.request<{ services: CatalogService[] }>("/api/booking/catalog", { auth: false });
      setServices(data.services);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
      setServices((s) => s ?? []);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <FlatList
      contentContainerStyle={styles.content}
      data={services ?? []}
      keyExtractor={(s) => s.slug}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
      ListHeaderComponent={
        <View style={{ gap: space.md }}>
          <View style={styles.hello}>
            <View style={{ flex: 1 }}>
              <Text style={styles.namaste}>{t("namaste")}</Text>
              <Text style={styles.name}>{user?.name || user?.phone || user?.email}</Text>
            </View>
            <Button label={t("account")} variant="outline" onPress={() => router.push("/account")} />
          </View>
          <Text style={styles.heading}>{t("services")}</Text>
          <Text style={styles.note}>{t("bookOnWebsite")}</Text>
          <ErrorText>{error}</ErrorText>
          {error ? <Button label={t("retry")} variant="outline" onPress={load} /> : null}
        </View>
      }
      ListEmptyComponent={
        services === null ? <ActivityIndicator color={colors.brand} style={{ marginTop: space.xl }} /> : error ? undefined : <Text style={styles.note}>{t("noServices")}</Text>
      }
      renderItem={({ item }) => {
        const min = item.plans.length ? Math.min(...item.plans.map((p) => p.pricePaise)) : null;
        return (
          <Pressable
            accessibilityRole="link"
            onPress={() => Linking.openURL(siteUrl(`/services/${item.slug}`, lang))}
            style={({ pressed }) => [styles.service, pressed && { backgroundColor: colors.surfaceContainer }]}
          >
            <Text style={styles.serviceTitle}>{pick(item.titleEn, item.titleHi)}</Text>
            <Text style={styles.serviceMeta}>
              {min !== null ? `${t("from")} ${formatPaise(min)} · ` : ""}
              {item.plans.length} {t("plans")}
            </Text>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, gap: space.md },
  hello: { flexDirection: "row", alignItems: "center", gap: space.md },
  namaste: { fontSize: 14, color: colors.textMuted },
  name: { fontSize: 20, fontWeight: "700", color: colors.heading },
  heading: { fontSize: 18, fontWeight: "700", color: colors.heading, marginTop: space.sm },
  note: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  service: {
    minHeight: TOUCH,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.xs,
  },
  serviceTitle: { fontSize: 16, fontWeight: "700", color: colors.heading },
  serviceMeta: { fontSize: 14, color: colors.primary, fontWeight: "600" },
});
