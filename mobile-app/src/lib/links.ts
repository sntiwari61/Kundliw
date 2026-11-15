import { Linking } from "react-native";
import { router } from "expo-router";
import { API_URL } from "./config";

/**
 * Turns an address the admin typed for a button (a page of the website like "/services" or a full web address)
 * into the matching screen of the app, or opens it outside the app when the app has no such screen.
 */
export type Destination = { type: "route"; path: string } | { type: "external"; url: string } | { type: "none" };

const ROUTES: [RegExp, (m: RegExpMatchArray) => string][] = [
  [/^\/(?:hi|en)?\/?$/, () => "/"],
  [/^\/services\/?$/, () => "/services"],
  [/^\/services\/([\w-]+)\/?$/, (m) => `/service/${m[1]}`],
  [/^\/kundli\/?$/, () => "/explore/tool/kundli"],
  [/^\/kundli\/matching\/?$/, () => "/explore/tool/matching"],
  [/^\/kundli\/prashna\/?$/, () => "/explore/request/prashna"],
  [/^\/panchang\/?$/, () => "/explore/tool/panchang"],
  [/^\/about\/?$/, () => "/explore/about"],
  [/^\/founder\/?$/, () => "/explore/founder"],
  [/^\/offers\/?$/, () => "/explore/offers"],
  [/^\/gallery\/?$/, () => "/explore/gallery"],
  [/^\/blogs\/?$/, () => "/explore/blogs"],
  [/^\/blogs\/([\w-]+)\/?$/, (m) => `/explore/blog/${m[1]}`],
  [/^\/testimonials\/?$/, () => "/explore/testimonials"],
  [/^\/faq\/?$/, () => "/explore/faq"],
  [/^\/contact\/?$/, () => "/explore/contact"],
  [/^\/vault\/?$/, () => "/vault"],
  [/^\/(?:tickets|help)\/?$/, () => "/tickets"],
];

export function resolveLink(raw: string | null | undefined): Destination {
  const v = (raw || "").trim();
  if (!v) return { type: "none" };
  if (/^https:\/\/[^\s]+$/i.test(v)) {
    // A page of our own website opens the matching screen
    if (v.startsWith(API_URL)) return resolveLink(v.slice(API_URL.length) || "/");
    return { type: "external", url: v };
  }
  if (/^(tel|mailto):[^\s]+$/i.test(v)) return { type: "external", url: v };
  if (v.startsWith("/") && !v.startsWith("//")) {
    // Drop a language prefix and anything after ? or #
    const path = v.replace(/^\/(hi|en)(?=\/|$)/, "").split(/[?#]/)[0] || "/";
    for (const [re, to] of ROUTES) {
      const m = path.match(re);
      if (m) return { type: "route", path: to(m) };
    }
    return { type: "external", url: `${API_URL}${v}` };
  }
  return { type: "none" };
}

export function openLink(raw: string | null | undefined) {
  const dest = resolveLink(raw);
  if (dest.type === "route") router.push(dest.path as never);
  else if (dest.type === "external") Linking.openURL(dest.url).catch(() => undefined);
}

/** A WhatsApp chat address from a phone number and a first message. */
export function whatsappUrl(phone: string, message: string): string {
  const digits = (phone || "").replace(/\D/g, "");
  const full = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${full}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}
