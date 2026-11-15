import type { Metadata } from "next";

export const SITE_NAME = "Maharshi Kanad Jyotish Kendra";
export const SITE_NAME_HI = "महर्षि कणाद ज्योतिष केंद्र";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXTAUTH_URL ||
  "https://maharshikanadjyotishkendra.com"
).replace(/\/$/, "");

export const LOCALES = ["hi", "en"] as const;
export type SiteLocale = (typeof LOCALES)[number];

/** Hindi is the default locale and has no URL prefix (localePrefix: "as-needed"). */
export function localizedPath(locale: string, path = ""): string {
  const clean = path === "/" ? "" : path;
  if (locale === "en") return `/en${clean}` || "/en";
  return clean || "/";
}

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path}`;
}

/** Canonical + hreflang alternates for a route that exists in both languages. */
export function pageAlternates(locale: string, path = ""): NonNullable<Metadata["alternates"]> {
  return {
    canonical: absoluteUrl(localizedPath(locale, path)),
    languages: {
      hi: absoluteUrl(localizedPath("hi", path)),
      en: absoluteUrl(localizedPath("en", path)),
      "x-default": absoluteUrl(localizedPath("hi", path)),
    },
  };
}

/** Serialises structured data so it cannot break out of the script element. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/**
 * Older addresses of this website. They must never be shown on their own: every request to them is sent,
 * permanently, to the same page on the real address. Add more with LEGACY_HOSTS (comma separated).
 */
const BUILT_IN_LEGACY_HOSTS = ["maharshikanadjyotishkendra.online", "www.maharshikanadjyotishkendra.online", "kanadjyotishkendra.vercel.app", "kanad-jyotish-kendra.vercel.app"];

export function legacyHosts(): string[] {
  const extra = (process.env.LEGACY_HOSTS || "").split(",").map((h) => h.trim().toLowerCase()).filter(Boolean);
  return [...BUILT_IN_LEGACY_HOSTS, ...extra];
}

/** Where a request on an old address (or on www of the real one) should go, or null when it is already on the real address. */
export function canonicalRedirect(host: string | null | undefined, pathAndQuery: string, siteUrl: string = SITE_URL): string | null {
  const h = (host || "").toLowerCase().replace(/:d+$/, "");
  if (!h) return null;
  let canonicalHost = "";
  try {
    canonicalHost = new URL(siteUrl).host.toLowerCase();
  } catch {
    return null;
  }
  if (h === canonicalHost) return null;
  const isWwwOfCanonical = h === `www.${canonicalHost}`;
  if (!isWwwOfCanonical && !legacyHosts().includes(h)) return null;
  return `${siteUrl}${pathAndQuery.startsWith("/") ? pathAndQuery : `/${pathAndQuery}`}`;
}
