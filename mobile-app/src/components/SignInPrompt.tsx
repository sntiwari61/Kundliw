import { View } from "react-native";
import { router } from "expo-router";
import { Hero } from "@/components/Hero";
import { LangChip } from "@/components/LangChip";
import { Button, EmptyState } from "@/components/ui";
import { useLanguage } from "@/lib/i18n";
import { space } from "@/theme";

/** Shown in place of a signed-in screen when the visitor is only browsing. */
export function SignInPrompt({ title }: { title: string }) {
  const { t } = useLanguage();
  return (
    <View style={{ flex: 1 }}>
      <Hero title={title} right={<LangChip />} />
      <EmptyState
        title={title}
        note={t("guestNote")}
        action={
          <View style={{ gap: space.sm, alignSelf: "stretch", paddingHorizontal: space.lg }}>
            <Button label={t("signIn")} onPress={() => router.push("/sign-in")} />
            <Button label={t("createAccount")} variant="outline" onPress={() => router.push("/register")} />
          </View>
        }
      />
    </View>
  );
}
