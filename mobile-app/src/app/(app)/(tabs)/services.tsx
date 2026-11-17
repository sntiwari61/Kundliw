import { useMemo, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Hero } from "@/components/Hero";
import { LangChip } from "@/components/LangChip";
import { ServiceCard } from "@/components/ServiceCard";
import { Text } from "@/components/Text";
import { Button, EmptyState, ErrorText, FilterChips, SearchField, SkeletonList } from "@/components/ui";
import { useLanguage } from "@/lib/i18n";
import { filterServices, type ServiceFilter } from "@/lib/booking";
import { useSaved } from "@/lib/services";
import { useCatalog } from "@/lib/useCatalog";
import { colors, space } from "@/theme";

/** Every service the Kendra offers; choosing one shows its plans and booking. */
export default function ServicesScreen() {
  const { t } = useLanguage();
  const { catalog, error, reload, loading } = useCatalog();
  const { saved } = useSaved();
  const [refreshing, setRefreshing] = useState(false);
  const params = useLocalSearchParams<{ filter?: string }>();
  const [filter, setFilter] = useState<ServiceFilter>(params.filter === "saved" ? "SAVED" : "ALL");
  const [query, setQuery] = useState("");
  const shown = useMemo(() => filterServices(catalog?.services ?? [], filter, query, saved), [catalog, filter, query, saved]);

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
            await reload();
            setRefreshing(false);
          }}
        />
      }
    >
      <Hero title={t("services")} subtitle={t("tapToBook")} right={<LangChip />} />
      <View style={styles.body}>
        <ErrorText>{error}</ErrorText>
        {error ? <Button label={t("retry")} variant="outline" onPress={reload} /> : null}
        {catalog && catalog.services.length > 0 ? (
          <>
            <SearchField value={query} onChangeText={setQuery} placeholder={t("searchServices")} />
            <FilterChips
              value={filter}
              onChange={setFilter}
              options={[
                { value: "ALL", label: t("filterAll"), count: catalog.services.length },
                { value: "SAVED", label: t("saved"), count: saved.filter((x) => catalog.services.some((s) => s.slug === x)).length },
              ]}
            />
          </>
        ) : null}
        {loading ? <SkeletonList count={4} /> : null}
        {shown.map((s) => <ServiceCard key={s.slug} service={s} />)}
        {catalog && catalog.services.length > 0 && shown.length === 0 ? <EmptyState title={filter === "SAVED" && !query.trim() ? t("noSaved") : t("noMatches")} /> : null}
        {catalog && catalog.services.length === 0 ? <EmptyState title={t("noServices")} /> : null}
        {!loading && !catalog && !error ? <Text>{t("loading")}</Text> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: space.lg, gap: space.md },
});
