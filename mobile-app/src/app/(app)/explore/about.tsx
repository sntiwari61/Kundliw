import { View } from "react-native";
import { router } from "expo-router";
import { Text } from "@/components/Text";
import { Blocks, ContentScreen, FadeIn, Highlight, RichText } from "@/components/ContentKit";
import { Button } from "@/components/ui";
import { useContent, type AboutContent } from "@/lib/content";
import { useLanguage } from "@/lib/i18n";
import { colors, space } from "@/theme";

export default function AboutScreen() {
  const { t, pick } = useLanguage();
  const { data, error, reload, loading } = useContent<AboutContent>("about");
  const body = data ? pick(data.shortEn, data.shortHi) || t("aboutDefault") : "";
  const mission = data ? pick(data.missionEn, data.missionHi) : "";
  return (
    <View style={{ flex: 1 }}>
      <ContentScreen loading={loading} error={error} reload={reload}>
        {data ? (
          <>
            <Text serif style={{ fontSize: 28, color: colors.heading, lineHeight: 34 }}>{pick(data.titleEn, data.titleHi)}</Text>
            <FadeIn>
              <RichText text={body} />
            </FadeIn>
            {mission ? (
              <FadeIn index={1}>
                <Highlight>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: colors.primary, letterSpacing: 1 }}>{t("ourMission").toUpperCase()}</Text>
                  <RichText text={mission} />
                </Highlight>
              </FadeIn>
            ) : null}
            <Blocks blocks={data.blocks} />
            <View style={{ gap: space.md }}>
              <Button label={t("tabServices")} onPress={() => router.push("/services")} />
              <Button label={t("founderTitle")} variant="outline" onPress={() => router.push("/explore/founder" as never)} />
            </View>
          </>
        ) : null}
      </ContentScreen>
    </View>
  );
}
