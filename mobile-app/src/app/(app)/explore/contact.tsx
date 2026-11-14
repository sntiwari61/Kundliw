import { Linking, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Text } from "@/components/Text";
import { ContentScreen, FadeIn } from "@/components/ContentKit";
import { Button, Card } from "@/components/ui";
import { safeExternal, useContent, type ContactContent } from "@/lib/content";
import { useLanguage } from "@/lib/i18n";
import { colors, space } from "@/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

function Row({ icon, label, value, onPress }: { icon: IconName; label: string; value: string; onPress?: () => void }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={20} color={colors.maroon} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={[styles.rowValue, onPress && { color: colors.primary }]} onPress={onPress}>
          {value}
        </Text>
      </View>
    </View>
  );
}

export default function ContactScreen() {
  const { t, pick } = useLanguage();
  const { data, error, reload, loading } = useContent<ContactContent>("contact");
  const open = (url: string) => Linking.openURL(url).catch(() => undefined);
  const phones = [data?.phone1, data?.phone2].filter((p): p is string => !!p);
  const address = data ? pick(data.addressEn ?? "", data.addressHi ?? "") : "";
  const hours = data ? pick(data.workingHoursEn, data.workingHoursHi) : "";
  const note = data ? pick(data.noteEn, data.noteHi) : "";

  return (
    <ContentScreen loading={loading} error={error} reload={reload}>
      {data ? (
        <>
          <FadeIn>
            <Card>
              {phones.map((p) => (
                <Row key={p} icon="call" label={t("callUs")} value={p} onPress={() => open(`tel:${p.replace(/[^\d+]/g, "")}`)} />
              ))}
              {data.email ? <Row icon="mail" label={t("emailUs")} value={data.email} onPress={() => open(`mailto:${data.email}`)} /> : null}
              {address ? (
                <Row
                  icon="location"
                  label={t("addressLabel")}
                  value={[address, data.city].filter(Boolean).join(", ")}
                  onPress={data.map ? () => open(`https://www.google.com/maps/search/?api=1&query=${data.map?.lat},${data.map?.lng}`) : undefined}
                />
              ) : null}
              {hours ? <Row icon="time" label={t("workingHours")} value={hours} /> : null}
            </Card>
          </FadeIn>
          {note ? <Text style={styles.note}>{note}</Text> : null}
          {data.map ? <Button label={t("openMap")} variant="outline" onPress={() => open(`https://www.google.com/maps/search/?api=1&query=${data.map?.lat},${data.map?.lng}`)} /> : null}
          <Button label={t("askQuestion")} onPress={() => router.push("/tickets")} />
          {data.social.length > 0 ? (
            <FadeIn index={1}>
              <Text style={styles.follow}>{t("followUs")}</Text>
              <View style={styles.social}>
                {data.social
                  .filter((s) => safeExternal(s.url))
                  .map((s) => (
                    <View key={s.id} style={{ minWidth: 120 }}>
                      <Button label={s.name} variant="outline" onPress={() => open(safeExternal(s.url) as string)} />
                    </View>
                  ))}
              </View>
            </FadeIn>
          ) : null}
        </>
      ) : null}
    </ContentScreen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: space.md, paddingVertical: space.xs },
  rowIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.goldSoft, alignItems: "center", justifyContent: "center" },
  rowLabel: { fontSize: 12, color: colors.textMuted },
  rowValue: { fontSize: 15, fontWeight: "600", color: colors.heading },
  note: { fontSize: 14, color: colors.textMuted, lineHeight: 21 },
  follow: { fontSize: 13, fontWeight: "700", color: colors.heading, marginBottom: space.sm },
  social: { flexDirection: "row", flexWrap: "wrap", gap: space.md },
});
