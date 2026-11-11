import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { isCorePageSlug } from "@/lib/content/pages";
import { LOCALES, absoluteUrl, localizedPath } from "@/lib/seo";
import { LEGAL_DEFAULT_SLUGS } from "@/lib/legal/defaults";

export const dynamic = "force-dynamic";

const STATIC_ROUTES: { path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" }[] = [
  { path: "", priority: 1, changeFrequency: "daily" },
  { path: "/services", priority: 0.9, changeFrequency: "weekly" },
  { path: "/kundli", priority: 0.8, changeFrequency: "monthly" },
  { path: "/kundli/matching", priority: 0.8, changeFrequency: "monthly" },
  { path: "/kundli/prashna", priority: 0.8, changeFrequency: "monthly" },
  { path: "/panchang", priority: 0.7, changeFrequency: "daily" },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" },
  { path: "/founder", priority: 0.6, changeFrequency: "monthly" },
  { path: "/gallery", priority: 0.5, changeFrequency: "weekly" },
  { path: "/blogs", priority: 0.6, changeFrequency: "weekly" },
  { path: "/testimonials", priority: 0.5, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.7, changeFrequency: "monthly" },
  { path: "/help", priority: 0.5, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.7, changeFrequency: "monthly" },
  { path: "/other-services", priority: 0.6, changeFrequency: "monthly" },
  { path: "/offers", priority: 0.6, changeFrequency: "weekly" },
  { path: "/credentials", priority: 0.5, changeFrequency: "monthly" },
  { path: "/app", priority: 0.4, changeFrequency: "monthly" },
];

function entriesFor(path: string, lastModified: Date | undefined, priority: number, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(LOCALES.map((l) => [l, absoluteUrl(localizedPath(l, path))]));
  return LOCALES.map((locale) => ({
    url: absoluteUrl(localizedPath(locale, path)),
    lastModified,
    changeFrequency,
    priority,
    alternates: { languages },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [services, posts, legal, custom] = await Promise.all([
    prisma.service
      .findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } })
      .catch(() => []),
    prisma.blogPost
      .findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } })
      .catch(() => []),
    prisma.staticPage
      .findMany({ where: { isActive: true, slug: { startsWith: "legal/" } }, select: { slug: true, updatedAt: true } })
      .catch(() => []),
    prisma.staticPage
      .findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } })
      .then((rows) => rows.filter((r) => !isCorePageSlug(r.slug) && !r.slug.startsWith("legal/")))
      .catch(() => []),
  ]);

  return [
    ...STATIC_ROUTES.flatMap((r) => entriesFor(r.path, undefined, r.priority, r.changeFrequency)),
    ...services.flatMap((s) => entriesFor(`/services/${s.slug}`, s.updatedAt, 0.8, "weekly")),
    ...posts.flatMap((p) => entriesFor(`/blogs/${p.slug}`, p.updatedAt, 0.6, "monthly")),
    ...custom.flatMap((p) => entriesFor(`/pages/${p.slug}`, p.updatedAt, 0.5, "monthly")),
    ...legal.flatMap((p) => entriesFor(`/${p.slug}`, p.updatedAt, 0.3, "yearly")),
    // standard legal pages the admin has not saved yet
    ...LEGAL_DEFAULT_SLUGS.filter((d) => !legal.some((p) => p.slug === `legal/${d}`)).flatMap((d) => entriesFor(`/legal/${d}`, undefined, 0.3, "yearly")),
  ];
}
