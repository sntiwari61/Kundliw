/**
 * The server the app talks to. Set EXPO_PUBLIC_API_URL in a .env.local file to point a development
 * build at another server (for example http://192.168.1.5:3000). Nothing secret belongs in the app.
 */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || "https://maharshikanadjyotishkendra.com").replace(/\/+$/, "");

/** A page of the website, in the chosen language (legal pages open in the browser). */
export function siteUrl(path: string, lang: "hi" | "en"): string {
  return `${API_URL}/${lang}${path.startsWith("/") ? path : `/${path}`}`;
}
