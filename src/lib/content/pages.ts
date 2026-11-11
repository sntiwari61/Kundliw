/** Pages the site itself links to. They can be edited but never removed. */
export const CORE_PAGE_SLUGS = [
  "about",
  "founder",
  "help",
  "terms",
  "privacy",
  "refund",
  "cancellation",
  "platform-guidelines",
  "member-agreement",
  "rules-regulations",
  "ephemeris-sources",
  "guide-user",
  "guide-associate",
  "guide-admin",
] as const;

export function isCorePageSlug(slug: string): boolean {
  return (CORE_PAGE_SLUGS as readonly string[]).includes(slug) || slug.startsWith("legal/");
}
