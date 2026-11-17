import { useCallback, useEffect, useMemo, useState } from "react";
import { Linking, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Text } from "@/components/Text";
import { RichText } from "@/components/ContentKit";
import { Button, Card, EmptyState, ErrorText, Pill, SearchField, SectionTitle, SkeletonList, TapCard } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { formatDay } from "@/lib/booking";
import { filterFaq, useContent, type FaqContent } from "@/lib/content";
import { useHome } from "@/lib/home";
import { whatsappUrl } from "@/lib/links";
import { ticketStatusLabel, useLanguage } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { ticketTone, type Ticket } from "@/lib/tickets";
import { colors, space } from "@/theme";

/** The person's support tickets. */
export default function TicketsScreen() {
  const { api } = useSession();
  const { t, lang, pick } = useLanguage();
  const faq = useContent<FaqContent>("faq");
  const home = useHome();
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const answers = useMemo(() => filterFaq(faq.data?.items ?? [], query).slice(0, query.trim() ? 8 : 4), [faq.data, query]);
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
      {home.data ? (
        <View style={styles.contactRow}>
          <View style={{ flex: 1 }}>
            <Button label={t("callUs")} variant="outline" onPress={() => Linking.openURL(`tel:${home.data!.contact.phone.replace(/[^+\d]/g, "")}`).catch(() => undefined)} />
          </View>
          <View style={{ flex: 1 }}>
            <Button label={t("whatsappUs")} variant="outline" onPress={() => Linking.openURL(whatsappUrl(home.data!.contact.whatsapp, t("waHello"))).catch(() => undefined)} />
          </View>
        </View>
      ) : null}
      {faq.data && faq.data.items.length > 0 ? (
        <>
          <SectionTitle>{t("helpCenter")}</SectionTitle>
          <SearchField value={query} onChangeText={setQuery} placeholder={t("helpSearch")} />
          {answers.map((q) => (
            <Card key={q.id} style={{ padding: 0 }}>
              <TapCard onPress={() => setOpenId(openId === q.id ? null : q.id)} style={{ borderWidth: 0, shadowOpacity: 0, elevation: 0 }}>
                <Text style={styles.title}>{pick(q.questionEn, q.questionHi)}</Text>
              </TapCard>
              {openId === q.id ? (
                <View style={{ padding: space.lg, paddingTop: 0 }}>
                  <RichText text={pick(q.answerEn, q.answerHi)} />
                </View>
              ) : null}
            </Card>
          ))}
          {query.trim() && answers.length === 0 ? <Text style={styles.note}>{t("noMatches")}</Text> : null}
          <Text style={styles.note}>{t("helpNoAnswer")}</Text>
        </>
      ) : null}
      <Button label={t("newTicket")} onPress={() => router.push("/tickets/new")} />
      {tickets && tickets.length > 0 ? <SectionTitle>{t("yourTickets")}</SectionTitle> : null}
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
  contactRow: { flexDirection: "row", gap: space.md },
  top: { flexDirection: "row", justifyContent: "space-between" },
  meta: { fontSize: 12, color: colors.textMuted, fontWeight: "500" },
  title: { fontSize: 15, fontWeight: "600", color: colors.heading, lineHeight: 22 },
});
