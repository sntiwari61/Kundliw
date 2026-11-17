import type { Lang } from "./i18n";

/** Today's Panchang as the website's own calculation sends it (GET /api/astro/panchang). */
export interface Panchang {
  date: string;
  vaar: string;
  tithi: string;
  paksha: string;
  nakshatra: string;
  yoga: string;
  karana: string;
  sunrise: string;
  sunset: string;
  rahuKaal: string;
  abhijitMuhurat: string;
  parts?: { tithiEn: string; tithiHi: string; pakshaEn: string; pakshaHi: string; masaEn: string; masaHi: string };
}

/** "Panchami, Shukla" in the chosen language; the plain tithi when the parts are missing. */
export function tithiLine(p: Panchang, lang: Lang): string {
  if (p.parts) {
    const tithi = lang === "hi" ? p.parts.tithiHi : p.parts.tithiEn;
    const paksha = lang === "hi" ? p.parts.pakshaHi : p.parts.pakshaEn;
    return [tithi, paksha].filter(Boolean).join(", ");
  }
  return [p.tithi, p.paksha].filter(Boolean).join(", ");
}

/** The facts shown on the Home card, in order, leaving out any the calculation did not give. */
export function panchangFacts(p: Panchang): { key: "nakshatraLabel" | "yogaLabel" | "karanaLabel" | "sunriseLabel" | "sunsetLabel" | "rahuKaalLabel" | "abhijitLabel"; value: string }[] {
  const rows = [
    { key: "nakshatraLabel", value: p.nakshatra },
    { key: "yogaLabel", value: p.yoga },
    { key: "karanaLabel", value: p.karana },
    { key: "sunriseLabel", value: p.sunrise },
    { key: "sunsetLabel", value: p.sunset },
    { key: "rahuKaalLabel", value: p.rahuKaal },
    { key: "abhijitLabel", value: p.abhijitMuhurat },
  ] as const;
  return rows.filter((r) => typeof r.value === "string" && r.value.trim()).map((r) => ({ key: r.key, value: r.value.trim() }));
}
