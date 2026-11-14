/** The website's colours (tailwind.config.ts), so the app and the site look like one product. */
export const colors = {
  brand: "#C0481B",
  brandPressed: "#A51F1B",
  saffron: "#D95A24",
  onBrand: "#FFFFFF",
  maroon: "#800000",
  maroonDeep: "#5C0000",
  onMaroon: "#FFF8EC",
  gold: "#D8A341",
  goldSoft: "#F3DFB0",
  surface: "#FFFAF3",
  surfaceLow: "#FBF3EA",
  surfaceContainer: "#F3E9DF",
  card: "#FFFFFF",
  text: "#47342D",
  textMuted: "#7B6861",
  heading: "#40241C",
  primary: "#B84A1C",
  primaryContainer: "#F6DFCC",
  outline: "#8A756D",
  outlineVariant: "#E4D8CC",
  error: "#B3261E",
  errorContainer: "#FBE3E0",
  onError: "#FFFFFF",
  success: "#1E6B3A",
  successContainer: "#DDF0E3",
  warning: "#8A5A00",
  warningContainer: "#FFF0CC",
} as const;

/** Colour pairs for the soft gradients the website uses on buttons and headers. */
export const gradients = {
  /** buttons and highlights: saffron flowing into the deeper red */
  brand: ["#D95A24", "#A51F1B"] as const,
  /** the maroon header */
  hero: ["#800000", "#5C0000"] as const,
  /** gold accents */
  gold: ["#E9C46A", "#D8A341"] as const,
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 18, xl: 24, pill: 999 } as const;
/** Every tappable control is at least this tall. */
export const TOUCH = 48;

/** The soft shadow of a raised card (the same on Android and iOS). */
export const shadow = {
  card: {
    shadowColor: "#40241C",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  strong: {
    shadowColor: "#40241C",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
} as const;

/** Poppins like the website. Hindi letters use the phone's own Devanagari font. */
export const fonts = {
  regular: "Poppins_400Regular",
  medium: "Poppins_500Medium",
  semibold: "Poppins_600SemiBold",
  bold: "Poppins_700Bold",
  serif: "CormorantGaramond_700Bold",
} as const;
