import { getSection } from "@/lib/siteConfig/service";

/**
 * The Panchang, Kundli and Kundli matching tools the website shows inside its pages. The admin switches
 * them on or off and can change their address in the site settings; the app reads the same settings.
 */

const DEFAULTS = {
  panchang: "https://panchang.astrosage.com/?language={lang}",
  kundli: "https://www.astrosage.com/freekundli/",
  matching: "https://www.astrosage.com/freechart/matchmaking.asp",
} as const;

/** Fills the language placeholder and keeps only secure web addresses (anything else falls back to the standard tool). */
export function toolAddress(raw: string | undefined, fallback: string, lang: "hi" | "en"): string {
  const value = (raw || "").trim() || fallback;
  const filled = value.replace(/\{lang\}/g, lang).replace(/([?&]language=)(hi|en)\b/i, `$1${lang}`);
  return /^https:\/\//i.test(filled) ? filled : fallback.replace(/\{lang\}/g, lang);
}

export async function loadTools() {
  const cfg = await getSection("tools");
  const tech = await getSection("technology");
  const note = (lang: "hi" | "en") =>
    [tech[lang === "hi" ? "calcMethodHi" : "calcMethodEn"], tech[lang === "hi" ? "accuracyNoteHi" : "accuracyNoteEn"]]
      .map((x) => String(x || "").trim())
      .filter(Boolean)
      .join("\n\n");
  const one = (enabledKey: string, urlKey: string, fallback: string) => ({
    enabled: cfg[enabledKey] !== false,
    urlEn: toolAddress(String(cfg[urlKey] || ""), fallback, "en"),
    urlHi: toolAddress(String(cfg[urlKey] || ""), fallback, "hi"),
  });
  return {
    panchang: one("panchangEnabled", "panchangUrl", DEFAULTS.panchang),
    kundli: one("kundliEnabled", "kundliUrl", DEFAULTS.kundli),
    matching: one("matchingEnabled", "matchingUrl", DEFAULTS.matching),
    noteEn: note("en"),
    noteHi: note("hi"),
  };
}
