import { prisma } from "@/lib/prisma";
import { DEFAULT_GUIDES, guidePageSlug, type GuideSlug } from "@/lib/guides/defaults";
import { loadGuideVisuals } from "@/lib/guides/visuals";

/** The guides the app can show. The admin guide stays on the website. */
export const APP_GUIDES = ["user", "associate"] as const;
export type AppGuide = (typeof APP_GUIDES)[number];

export const isAppGuide = (v: string): v is AppGuide => (APP_GUIDES as readonly string[]).includes(v);

/**
 * One guide in both languages: the words the admin wrote (Admin > Pages & legal, "Guide: ...") or
 * the standard text, and the pictures and videos attached to it (Admin > Guides & visuals).
 */
export async function getGuide(slug: AppGuide) {
  const guideSlug: GuideSlug = slug;
  const stored = await prisma.staticPage.findUnique({ where: { slug: guidePageSlug(guideSlug) } }).catch(() => null);
  const fallback = DEFAULT_GUIDES[guideSlug];
  const visuals = await loadGuideVisuals(guideSlug).catch(() => []);
  return {
    slug,
    titleEn: stored?.titleEn || fallback.titleEn || "User Guide",
    titleHi: stored?.titleHi || fallback.titleHi || "उपयोग गाइड",
    contentEn: stored?.contentEn || fallback.contentEn || "",
    contentHi: stored?.contentHi || fallback.contentHi || "",
    visuals: visuals.map((v) => ({ kind: v.kind, labelEn: v.labelEn, labelHi: v.labelHi, url: v.url })),
  };
}
