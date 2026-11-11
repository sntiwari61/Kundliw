/** The website's colours (tailwind.config.ts), so the app and the site look like one product. */
export const colors = {
  brand: "#C0481B",
  brandPressed: "#A51F1B",
  onBrand: "#FFFFFF",
  maroon: "#800000",
  onMaroon: "#FFF8EC",
  surface: "#FFFAF3",
  surfaceContainer: "#F3E9DF",
  card: "#FFFFFF",
  text: "#47342D",
  textMuted: "#7B6861",
  heading: "#40241C",
  primary: "#B84A1C",
  outline: "#8A756D",
  outlineVariant: "#E4D8CC",
  error: "#B3261E",
  onError: "#FFFFFF",
  success: "#1E6B3A",
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 6, md: 10, lg: 16 } as const;
/** Every tappable control is at least this tall. */
export const TOUCH = 48;
