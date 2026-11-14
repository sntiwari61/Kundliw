import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Text } from "@/components/Text";
import { Button, EmptyState, ErrorText, Pill, SkeletonList, TapCard } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { formatDay } from "@/lib/booking";
import { ticketStatusLabel, useLanguage } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { ticketTone, type Ticket } from "@/lib/tickets";
import { colors, space } from "@/theme";

/** The person's support tickets. */
export default function TicketsScreen() {
  const { api } = useSession();
  const { t, lang } = useLanguage();
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      setTickets((await api.request<{ tickets: Ticket[] }>("/api/mobile/v1/tickets")).tickets);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
      setTickets((x) => x ?? []);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ScrollView
      contentContainerStyle={styles.body}
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
      <Text style={styles.note}>{t("helpCall")}</Text>
      <Button label={t("newTicket")} onPress={() => router.push("/tickets/new")} />
      <ErrorText>{error}</ErrorText>
      {tickets === null ? <SkeletonList count={3} height={86} /> : null}
      {tickets?.length === 0 && !error ? <EmptyState title={t("noTickets")} note={t("noTicketsNote")} /> : null}
      {tickets?.map((k) => (
        <TapCard key={k.id} onPress={() => router.push({ pathname: "/tickets/[id]", params: { id: k.id } })} style={{ gap: space.sm }}>
          <View style={styles.top}>
            <Text style={styles.meta}>{k.ticketNumber}</Text>
            <Text style={styles.meta}>{formatDay(k.updatedAt.slice(0, 10), lang)}</Text>
          </View>
          <Text style={styles.title} numberOfLines={2}>
            {k.subject}
          </Text>
          <Pill label={ticketStatusLabel(lang, k.status)} tone={ticketTone(k.status)} />
        </TapCard>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: space.lg, gap: space.md, paddingBottom: space.xxl },
  note: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  top: { flexDirection: "row", justifyContent: "space-between" },
  meta: { fontSize: 12, color: colors.textMuted, fontWeight: "500" },
  title: { fontSize: 15, fontWeight: "600", color: colors.heading, lineHeight: 22 },
});
