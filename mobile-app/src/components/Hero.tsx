import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/Text";
import { colors, gradients, radius, space } from "@/theme";

/**
 * The deep-maroon header of a main screen, like the website's: a title, an optional line under it
 * and room on the right (for example the language switch). It sits under the status bar by itself.
 */
export function Hero({
  title,
  subtitle,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, { paddingTop: insets.top + space.md }]}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text serif style={styles.title}>
            {title}
          </Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {right}
      </View>
      {children}
      <View style={styles.goldLine} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: space.lg,
    paddingBottom: space.xl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    gap: space.md,
  },
  row: { flexDirection: "row", alignItems: "center", gap: space.md },
  title: { fontSize: 28, color: colors.onMaroon, lineHeight: 34 },
  subtitle: { fontSize: 13, color: colors.goldSoft, marginTop: 2 },
  goldLine: { height: 3, width: 56, borderRadius: 2, backgroundColor: colors.gold },
});
