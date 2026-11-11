import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { colors, radius, space, TOUCH } from "@/theme";

/** The app's few building blocks, so every screen has the same buttons, fields and messages. */

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
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!busy }}
      disabled={off}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === "filled" && { backgroundColor: pressed ? colors.brandPressed : colors.brand },
        variant === "danger" && { backgroundColor: colors.error },
        variant === "outline" && styles.buttonOutline,
        variant === "text" && styles.buttonText,
        off && { opacity: 0.5 },
      ]}
    >
      {busy ? (
        <ActivityIndicator color={variant === "outline" || variant === "text" ? colors.primary : colors.onBrand} />
      ) : (
        <Text style={[styles.buttonLabel, (variant === "outline" || variant === "text") && { color: colors.primary }]}>{label}</Text>
      )}
    </Pressable>
  );
}

export function Field({ label, ...input }: { label: string } & TextInputProps) {
  return (
    <View style={{ gap: space.xs }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput accessibilityLabel={label} placeholderTextColor={colors.textMuted} style={styles.input} {...input} />
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
    <Text accessibilityRole="alert" style={styles.error}>
      {children}
    </Text>
  );
}

export function Card({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  button: {
    minHeight: TOUCH,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonOutline: { borderWidth: 1, borderColor: colors.maroon, backgroundColor: "transparent" },
  buttonText: { backgroundColor: "transparent" },
  buttonLabel: { color: colors.onBrand, fontSize: 16, fontWeight: "700" },
  fieldLabel: { fontSize: 13, fontWeight: "700", color: colors.textMuted },
  input: {
    minHeight: TOUCH,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    paddingHorizontal: space.md,
    fontSize: 16,
    color: colors.text,
  },
  segmented: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.card,
  },
  segment: { flex: 1, minHeight: TOUCH, alignItems: "center", justifyContent: "center", paddingHorizontal: space.sm },
  segmentLabel: { fontSize: 14, fontWeight: "700", color: colors.text, textAlign: "center" },
  error: { color: colors.error, fontSize: 14, fontWeight: "600" },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.md,
  },
});
