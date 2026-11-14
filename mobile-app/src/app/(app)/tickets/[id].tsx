import { useCallback, useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Text } from "@/components/Text";
import { Button, Card, ErrorText, Field, Pill, SkeletonList } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { formatDay } from "@/lib/booking";
import { ticketStatusLabel, useLanguage } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { ticketTone, type TicketDetail } from "@/lib/tickets";
import { colors, radius, space } from "@/theme";

/** One ticket: the conversation with the Kendra, and a box to reply. */
export default function TicketScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { api } = useSession();
  const { t, lang } = useLanguage();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [error, setError] = useState("");
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setTicket((await api.request<{ ticket: TicketDetail }>(`/api/mobile/v1/tickets/${id}`)).ticket);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    }
  }, [api, id]);

  useEffect(() => {
    load();
  }, [load]);

  const send = async () => {
    if (!reply.trim()) return;
    setBusy(true);
    setError("");
    try {
      await api.request(`/api/tickets/${id}`, { method: "POST", body: { message: reply.trim() } });
      setReply("");
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {!ticket && !error ? <SkeletonList count={2} height={100} /> : null}
        {ticket ? (
          <>
            <Card style={{ gap: space.sm }}>
              <Text style={styles.meta}>{ticket.ticketNumber}</Text>
              <Text style={styles.title}>{ticket.subject}</Text>
              <Pill label={ticketStatusLabel(lang, ticket.status)} tone={ticketTone(ticket.status)} />
            </Card>
            {ticket.messages.map((m) => (
              <View key={m.id} style={[styles.bubble, m.fromAdmin ? styles.theirs : styles.mine]}>
                <Text style={[styles.who, !m.fromAdmin && { color: colors.goldSoft }]}>
                  {m.fromAdmin ? t("kendraName") : t("fromYou")} · {formatDay(m.createdAt.slice(0, 10), lang)}
                </Text>
                <Text style={[styles.text, !m.fromAdmin && { color: colors.onMaroon }]}>{m.body}</Text>
              </View>
            ))}
            <Card>
              <Field label={t("writeReply")} value={reply} onChangeText={setReply} multiline maxLength={3000} style={{ minHeight: 90, textAlignVertical: "top" }} />
              <ErrorText>{error}</ErrorText>
              <Button label={t("sendReply")} onPress={send} busy={busy} disabled={!reply.trim()} />
            </Card>
          </>
        ) : (
          <ErrorText>{error}</ErrorText>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  body: { padding: space.lg, gap: space.md, paddingBottom: space.xxl * 2 },
  meta: { fontSize: 12, color: colors.textMuted, fontWeight: "500" },
  title: { fontSize: 17, fontWeight: "700", color: colors.heading, lineHeight: 24 },
  bubble: { borderRadius: radius.lg, padding: space.md, gap: space.xs, maxWidth: "92%" },
  mine: { backgroundColor: colors.maroon, alignSelf: "flex-end", borderBottomRightRadius: radius.sm },
  theirs: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.outlineVariant, alignSelf: "flex-start", borderBottomLeftRadius: radius.sm },
  who: { fontSize: 11, color: colors.textMuted, fontWeight: "500" },
  text: { fontSize: 15, color: colors.text, lineHeight: 22 },
});
