import { Linking, StyleSheet, View } from "react-native";
import { Text } from "@/components/Text";
import { Blocks, ContentScreen, FadeIn, Picture, RichText } from "@/components/ContentKit";
import { Button, Card, SectionTitle } from "@/components/ui";
import { safeExternal, useContent, type FounderContent } from "@/lib/content";
import { useLanguage } from "@/lib/i18n";
import { colors, space } from "@/theme";

export default function FounderScreen() {
  const { t, pick } = useLanguage();
  const { data, error, reload, loading } = useContent<FounderContent>("founder");
  const f = data?.founder;
  return (
    <ContentScreen loading={loading} error={error} reload={reload}>
      {data && !f ? <Text style={styles.soon}>{t("founderSoon")}</Text> : null}
      {f ? (
        <>
          <FadeIn>
            <Picture src={f.photoUrl} height={220} round />
            <Text serif style={styles.name}>{pick(f.nameEn, f.nameHi)}</Text>
            <Text style={styles.designation}>{pick(f.designationEn, f.designationHi)}</Text>
            <Text style={styles.role}>{pick(f.roleEn, f.roleHi)}</Text>
          </FadeIn>
          <FadeIn index={1}>
            <RichText text={pick(f.bioEn, f.bioHi)} />
          </FadeIn>
          <Blocks blocks={f.blocks} />
          {safeExternal(f.youtubeUrl) ? <Button label={t("watchVideo")} variant="outline" onPress={() => Linking.openURL(f.youtubeUrl as string).catch(() => undefined)} /> : null}
          {f.links.map((l) => (
            <Button key={l.url} label={pick(l.labelEn, l.labelHi)} variant="outline" onPress={() => Linking.openURL(l.url).catch(() => undefined)} />
          ))}
          {pick(f.footerNoteEn ?? "", f.footerNoteHi ?? "") ? <Text style={styles.note}>{pick(f.footerNoteEn ?? "", f.footerNoteHi ?? "")}</Text> : null}
        </>
      ) : null}
      {data && data.team.length > 0 ? (
        <>
          <SectionTitle>{t("ourTeam")}</SectionTitle>
          {data.team.map((m, i) => (
            <FadeIn key={m.id} index={i}>
              <Card>
                <View style={{ gap: space.sm }}>
                  <Picture src={m.photoUrl} height={160} />
                  <Text style={styles.memberName}>{pick(m.nameEn, m.nameHi)}</Text>
                  <Text style={styles.designation}>{pick(m.roleEn, m.roleHi)}</Text>
                  {pick(m.bioEn ?? "", m.bioHi ?? "") ? <RichText text={pick(m.bioEn ?? "", m.bioHi ?? "")} /> : null}
                </View>
              </Card>
            </FadeIn>
          ))}
        </>
      ) : null}
    </ContentScreen>
  );
}

const styles = StyleSheet.create({
  soon: { fontSize: 15, color: colors.textMuted, textAlign: "center", marginTop: space.xl },
  name: { fontSize: 28, color: colors.heading, textAlign: "center", marginTop: space.md },
  designation: { fontSize: 14, fontWeight: "600", color: colors.primary, textAlign: "center" },
  role: { fontSize: 13, color: colors.textMuted, textAlign: "center", marginTop: 2 },
  memberName: { fontSize: 17, fontWeight: "700", color: colors.heading },
  note: { fontSize: 13, color: colors.textMuted, textAlign: "center", lineHeight: 19 },
});
