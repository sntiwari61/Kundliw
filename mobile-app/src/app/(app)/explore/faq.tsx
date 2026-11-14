import { useState } from "react";
import { LayoutAnimation, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Text } from "@/components/Text";
import { ContentScreen, FadeIn, RichText } from "@/components/ContentKit";
import { Button, Card } from "@/components/ui";
import { useContent, type FaqContent } from "@/lib/content";
import { useLanguage } from "@/lib/i18n";
import { colors, space } from "@/theme";

export default function FaqScreen() {
  const { t, pick } = useLanguage();
  const { data, error, reload, loading } = useContent<FaqContent>("faq");
  const [open, setOpen] = useState<string | null>(null);
  return (
    <ContentScreen loading={loading} error={error} reload={reload} empty={!!data && data.items.length === 0}>
      {data?.items.map((q, i) => {
        const isOpen = open === q.id;
        return (
          <FadeIn key={q.id} index={i}>
            <Card style={{ padding: 0 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: isOpen }}
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setOpen(isOpen ? null : q.id);
                }}
                style={styles.row}
              >
                <Text style={styles.question}>{pick(q.questionEn, q.questionHi)}</Text>
                <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={20} color={colors.primary} />
              </Pressable>
              {isOpen ? (
                <View style={styles.answer}>
                  <RichText text={pick(q.answerEn, q.answerHi)} />
                </View>
              ) : null}
            </Card>
          </FadeIn>
        );
      })}
      {data ? <Button label={t("askQuestion")} variant="outline" onPress={() => router.push("/tickets")} /> : null}
    </ContentScreen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: space.md, padding: space.lg },
  question: { flex: 1, fontSize: 15, fontWeight: "600", color: colors.heading, lineHeight: 22 },
  answer: { paddingHorizontal: space.lg, paddingBottom: space.lg },
});
