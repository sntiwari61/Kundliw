import { Pressable, StyleSheet } from "react-native";
import { Text } from "@/components/Text";
import { useLanguage } from "@/lib/i18n";
import { colors, radius, space } from "@/theme";

/** A small switch between Hindi and English, for the maroon header. */
export function LangChip() {
  const { lang, setLang } = useLanguage();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={lang === "hi" ? "Switch to English" : "हिन्दी में बदलें"}
      onPress={() => setLang(lang === "hi" ? "en" : "hi")}
      style={({ pressed }) => [styles.chip, pressed && { opacity: 0.8 }]}
    >
      <Text style={styles.text}>{lang === "hi" ? "EN" : "हिन्दी"}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 36,
    minWidth: 56,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { color: colors.goldSoft, fontSize: 13, fontWeight: "600" },
});
