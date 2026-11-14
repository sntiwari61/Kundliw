import { useEffect, useRef, useState, type ReactNode } from "react";
import { ActivityIndicator, Animated, Pressable, StyleSheet, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Text } from "@/components/Text";
import { colors, fonts, gradients, radius, shadow, space, TOUCH } from "@/theme";

/** The app's building blocks, so every screen has the same buttons, fields, cards and messages. */

export function Button({
  label,
  onPress,
  variant = "filled",
  disabled,
  busy,
}: {
  label: string;
  onPress: () => void;
  variant?: "filled" | "outline" | "danger" | "text";
  disabled?: boolean;
  busy?: boolean;
}) {
  const off = disabled || busy;
  const light = variant === "outline" || variant === "text";
  const content = busy ? (
    <ActivityIndicator color={light ? colors.primary : colors.onBrand} />
  ) : (
    <Text style={[styles.buttonLabel, light && { color: colors.primary }]}>{label}</Text>
  );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!off, busy: !!busy }}
      disabled={off}
      onPress={onPress}
      style={({ pressed }) => [
        variant === "filled" && shadow.card,
        { borderRadius: radius.md },
        pressed && { transform: [{ scale: 0.98 }], opacity: 0.92 },
        off && { opacity: 0.5 },
      ]}
    >
      {variant === "filled" ? (
        <LinearGradient colors={gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.button}>
          {content}
        </LinearGradient>
      ) : (
        <View
          style={[
            styles.button,
            variant === "danger" && { backgroundColor: colors.error },
            variant === "outline" && styles.buttonOutline,
          ]}
        >
          {content}
        </View>
      )}
    </Pressable>
  );
}

export function Field({ label, style, onFocus, onBlur, ...input }: { label: string } & TextInputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: space.xs }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.brand}
        style={[styles.input, focused && styles.inputFocused, style]}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...input}
      />
    </View>
  );
}

/** Two or more choices in a row; the chosen one is filled. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.segmented} accessibilityRole="tablist">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.value)}
            style={[styles.segment, on && { backgroundColor: colors.maroon }]}
          >
            <Text style={[styles.segmentLabel, on && { color: colors.onMaroon }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <View accessibilityRole="alert" style={styles.errorBox}>
      <Text style={styles.error}>{children}</Text>
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/** A card that can be tapped. */
export function TapCard({ children, onPress, style }: { children: ReactNode; onPress: () => void; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { transform: [{ scale: 0.985 }], backgroundColor: colors.surfaceLow }, style]}
    >
      {children}
    </Pressable>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <View style={styles.sectionRow}>
      <View style={styles.sectionBar} />
      <Text style={styles.sectionTitle}>{children}</Text>
      {action}
    </View>
  );
}

type Tone = "success" | "warning" | "error" | "neutral" | "brand";
const TONES: Record<Tone, { bg: string; fg: string }> = {
  success: { bg: colors.successContainer, fg: colors.success },
  warning: { bg: colors.warningContainer, fg: colors.warning },
  error: { bg: colors.errorContainer, fg: colors.error },
  neutral: { bg: colors.surfaceContainer, fg: colors.text },
  brand: { bg: colors.primaryContainer, fg: colors.primary },
};

/** A small coloured label for a status. */
export function Pill({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  const c = TONES[tone];
  return (
    <View style={[styles.pill, { backgroundColor: c.bg }]}>
      <Text style={[styles.pillText, { color: c.fg }]}>{label}</Text>
    </View>
  );
}

/** A grey block that pulses while something loads, so the screen keeps its shape. */
export function Skeleton({ height = 80, style }: { height?: number; style?: StyleProp<ViewStyle> }) {
  const opacity = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return <Animated.View style={[{ height, borderRadius: radius.lg, backgroundColor: colors.surfaceContainer, opacity }, style]} />;
}

export function SkeletonList({ count = 3, height = 90 }: { count?: number; height?: number }) {
  return (
    <View style={{ gap: space.md }}>
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} height={height} />
      ))}
    </View>
  );
}

/** A friendly note shown instead of an empty list. */
export function EmptyState({ title, note, action }: { title: string; note?: string; action?: ReactNode }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyOm}>
        <Text style={styles.emptyOmText}>ॐ</Text>
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {note ? <Text style={styles.emptyNote}>{note}</Text> : null}
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: TOUCH + 2,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonOutline: { borderWidth: 1.5, borderColor: colors.maroon, backgroundColor: colors.card },
  buttonLabel: { color: colors.onBrand, fontSize: 16, fontWeight: "700" },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: colors.textMuted },
  input: {
    minHeight: TOUCH + 2,
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    paddingHorizontal: space.md,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  inputFocused: { borderColor: colors.brand, backgroundColor: "#FFFDF9" },
  segmented: {
    flexDirection: "row",
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.card,
  },
  segment: { flex: 1, minHeight: TOUCH, alignItems: "center", justifyContent: "center", paddingHorizontal: space.sm },
  segmentLabel: { fontSize: 14, fontWeight: "600", color: colors.text, textAlign: "center" },
  errorBox: { backgroundColor: colors.errorContainer, borderRadius: radius.sm, paddingHorizontal: space.md, paddingVertical: space.sm },
  error: { color: colors.error, fontSize: 14, fontWeight: "500", lineHeight: 20 },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.md,
    ...shadow.card,
  },
  sectionRow: { flexDirection: "row", alignItems: "center", gap: space.sm },
  sectionBar: { width: 4, height: 20, borderRadius: 2, backgroundColor: colors.gold },
  sectionTitle: { flex: 1, fontSize: 17, fontWeight: "700", color: colors.heading },
  pill: { alignSelf: "flex-start", borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: 4 },
  pillText: { fontSize: 12, fontWeight: "600" },
  empty: { alignItems: "center", gap: space.md, paddingVertical: space.xxl, paddingHorizontal: space.lg },
  emptyOm: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.goldSoft, alignItems: "center", justifyContent: "center" },
  emptyOmText: { fontSize: 30, color: colors.maroon },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: colors.heading, textAlign: "center" },
  emptyNote: { fontSize: 14, color: colors.textMuted, textAlign: "center", lineHeight: 20 },
});
