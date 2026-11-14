import { useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { Hero } from "@/components/Hero";
import { LangChip } from "@/components/LangChip";
import { ServiceCard } from "@/components/ServiceCard";
import { Text } from "@/components/Text";
import { Button, EmptyState, ErrorText, SkeletonList } from "@/components/ui";
import { useLanguage } from "@/lib/i18n";
import { useCatalog } from "@/lib/useCatalog";
import { colors, space } from "@/theme";

/** Every service the Kendra offers; choosing one shows its plans and booking. */
export default function ServicesScreen() {
  const { t } = useLanguage();
  const { catalog, error, reload, loading } = useCatalog();
  const [refreshing, setRefreshing] = useState(false);

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
        {loading ? <SkeletonList count={4} /> : null}
        {catalog?.services.map((s) => <ServiceCard key={s.slug} service={s} />)}
        {catalog && catalog.services.length === 0 ? <EmptyState title={t("noServices")} /> : null}
        {!loading && !catalog && !error ? <Text>{t("loading")}</Text> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: space.lg, gap: space.md },
});
