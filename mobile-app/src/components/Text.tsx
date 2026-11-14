import { StyleSheet, Text as RNText, type TextProps } from "react-native";
import { fonts } from "@/theme";

/**
 * The app's text. It picks the right Poppins file for the weight asked for: on Android a custom font has
 * one file per weight, so `fontWeight` alone would show the regular weight.
 */
export function familyFor(weight: string | number | undefined, serif?: boolean): string {
  if (serif) return fonts.serif;
  const w = String(weight ?? "400");
  if (w === "700" || w === "800" || w === "900" || w === "bold") return fonts.bold;
  if (w === "600") return fonts.semibold;
  if (w === "500") return fonts.medium;
  return fonts.regular;
}

export function Text({ style, serif, ...rest }: TextProps & { serif?: boolean }) {
  const flat = StyleSheet.flatten(style) ?? {};
  const { fontWeight, fontFamily, ...others } = flat;
  return <RNText {...rest} style={[others, { fontFamily: fontFamily ?? familyFor(fontWeight, serif) }]} />;
}
