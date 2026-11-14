import { prisma } from "@/lib/prisma";
import { getActiveSocialLinks, getSection } from "@/lib/siteConfig/service";
import { isSafeImageSrc, normalizeBlocks, normalizeLinks } from "@/lib/content/media";

/**
 * The public pages of the website, shaped for the app. Everything is read from the same places
 * the website reads (so the admin panel controls both) and carries both languages, so the app
 * can switch language without asking again. Pictures keep their address as stored: the app
 * adds the website address in front of the ones that start with "/".
 */

const image = (v: string | null | undefined) => (isSafeImageSrc(v) ? (v as string).trim() : null);
const text = (v: unknown) => (typeof v === "string" ? v : "");
const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);

export const CONTENT_SECTIONS = ["about", "founder", "faq", "gallery", "blogs", "testimonials", "offers", "contact"] as const;
export type ContentSection = (typeof CONTENT_SECTIONS)[number];

const isTemplate = (value?: string | null) => !value || /admin panel|एडमिन पैनल/i.test(value);

function shapeBlocks(raw: unknown) {
  return normalizeBlocks(raw)
    .filter((b) => b.isActive)
    .map((b) => ({
      id: b.id,
      type: b.type,
      textEn: b.textEn,
      textHi: b.textHi,
      url: b.type === "image" ? image(b.url) : b.url,
      labelEn: b.labelEn,
      labelHi: b.labelHi,
    }));
}

async function about() {
  const cfg = await getSection("content");
  const page = await prisma.staticPage.findUnique({ where: { slug: "about" } }).catch(() => null);
  const body = (en: boolean) => {
    const custom = en ? page?.contentEn : page?.contentHi;
    return isTemplate(custom) ? "" : (custom as string);
  };
  return {
    titleEn: page?.titleEn || "Maharshi Kanad Jyotish Kendra",
    titleHi: page?.titleHi || "महर्षि कणाद ज्योतिष केंद्र",
    shortEn: text(cfg.aboutShortEn).trim() || body(true),
    shortHi: text(cfg.aboutShortHi).trim() || body(false),
    missionEn: text(cfg.missionTextEn).trim(),
    missionHi: text(cfg.missionTextHi).trim(),
    blocks: shapeBlocks(page?.blocks),
  };
}

async function founder() {
  const f = await prisma.founderProfile.findUnique({ where: { id: "default" } }).catch(() => null);
  const configured =
    !!f && f.isActive && f.nameEn.trim() !== "" && f.nameEn !== "Founder Name" && !/admin panel/i.test(f.bioEn) && !/एडमिन/.test(f.bioHi);
  if (!configured || !f) return { founder: null, team: [] };
  const team = await prisma.teamMember
    .findMany({ where: { isActive: true }, orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }] })
    .catch(() => []);
  return {
    founder: {
      nameEn: f.nameEn,
      nameHi: f.nameHi,
      designationEn: f.designationEn,
      designationHi: f.designationHi,
      roleEn: f.roleEn,
      roleHi: f.roleHi,
      photoUrl: image(f.photoUrl),
      bioEn: f.bioEn,
      bioHi: f.bioHi,
      youtubeUrl: f.youtubeUrl,
      footerNoteEn: f.footerNoteEn,
      footerNoteHi: f.footerNoteHi,
      links: normalizeLinks(f.additionalLinks),
      blocks: shapeBlocks(f.blocks),
    },
    team: team.map((m) => ({
      id: m.id,
      nameEn: m.nameEn,
      nameHi: m.nameHi,
      roleEn: m.roleEn,
      roleHi: m.roleHi,
      bioEn: m.bioEn,
      bioHi: m.bioHi,
      photoUrl: image(m.photoUrl),
    })),
  };
}

async function faq() {
  const items = await prisma.faqItem
    .findMany({ where: { isActive: true }, orderBy: [{ category: "asc" }, { orderIndex: "asc" }, { createdAt: "desc" }] })
    .catch(() => []);
  return {
    items: items.map((i) => ({
      id: i.id,
      category: i.category,
      questionEn: i.questionEn,
      questionHi: i.questionHi,
      answerEn: i.answerEn,
      answerHi: i.answerHi,
    })),
  };
}

async function gallery() {
  const items = await prisma.mediaGalleryItem.findMany({ where: { isActive: true }, orderBy: { orderIndex: "asc" } }).catch(() => []);
  return {
    items: items.map((i) => ({
      id: i.id,
      titleEn: i.titleEn,
      titleHi: i.titleHi,
      captionEn: i.captionEn,
      captionHi: i.captionHi,
      imageUrl: image(i.imageUrl),
      videoUrl: i.videoUrl,
      mediaType: i.mediaType,
      externalLink: i.externalLink,
    })),
  };
}

async function blogs() {
  const posts = await prisma.blogPost.findMany({ where: { isPublished: true }, orderBy: { createdAt: "desc" } }).catch(() => []);
  return {
    posts: posts.map((p) => ({
      slug: p.slug,
      titleEn: p.titleEn,
      titleHi: p.titleHi,
      excerptEn: p.excerptEn,
      excerptHi: p.excerptHi,
      coverImage: image(p.coverImage),
      publishedAt: iso(p.publishedAt ?? p.createdAt),
    })),
  };
}

/** One full article */
export async function getBlogPost(slug: string) {
  const p = await prisma.blogPost.findUnique({ where: { slug } }).catch(() => null);
  if (!p || !p.isPublished) return null;
  return {
    slug: p.slug,
    titleEn: p.titleEn,
    titleHi: p.titleHi,
    excerptEn: p.excerptEn,
    excerptHi: p.excerptHi,
    contentEn: p.contentEn,
    contentHi: p.contentHi,
    coverImage: image(p.coverImage),
    youtubeUrl: p.youtubeUrl,
    links: normalizeLinks(p.additionalLinks),
    publishedAt: iso(p.publishedAt ?? p.createdAt),
  };
}

async function testimonials() {
  const items = await prisma.testimonial
    .findMany({ where: { isActive: true, isVerified: true }, orderBy: { orderIndex: "asc" } })
    .catch(() => []);
  return {
    items: items.map((t) => ({
      id: t.id,
      authorNameEn: t.authorNameEn,
      authorNameHi: t.authorNameHi,
      authorTitleEn: t.authorTitleEn,
      authorTitleHi: t.authorTitleHi,
      cityEn: t.cityEn,
      cityHi: t.cityHi,
      quoteEn: t.quoteEn,
      quoteHi: t.quoteHi,
      rating: t.rating,
      photoUrl: image(t.photoUrl),
      youtubeUrl: t.youtubeUrl,
    })),
  };
}

async function offers() {
  const now = new Date();
  const list = await prisma.offer
    .findMany({
      where: { isActive: true, validFrom: { lte: now }, OR: [{ validUntil: null }, { validUntil: { gte: now } }] },
      orderBy: { createdAt: "desc" },
    })
    .catch(() => []);
  return {
    offers: list.map((o) => ({
      id: o.id,
      code: o.code,
      titleEn: o.titleEn,
      titleHi: o.titleHi,
      discountType: o.discountType,
      discountValuePaise: o.discountValuePaise,
      maxDiscountPaise: o.maxDiscountPaise,
      minOrderValuePaise: o.minOrderValuePaise,
      autoApply: o.autoApply,
      validUntil: iso(o.validUntil),
    })),
  };
}

async function contact() {
  const s = await prisma.adminSettings
    .findFirst({
      select: {
        siteNameEn: true,
        siteNameHi: true,
        phone1: true,
        phone2: true,
        email: true,
        addressEn: true,
        addressHi: true,
        city: true,
        mapEnabled: true,
        mapLatitude: true,
        mapLongitude: true,
        mapLabelEn: true,
        mapLabelHi: true,
      },
    })
    .catch(() => null);
  const cfg = await getSection("contact");
  const social = (await getActiveSocialLinks()).map(({ id, name, url }) => ({ id, name, url }));
  return {
    siteNameEn: s?.siteNameEn ?? null,
    siteNameHi: s?.siteNameHi ?? null,
    phone1: s?.phone1 ?? null,
    phone2: s?.phone2 ?? null,
    email: s?.email ?? null,
    addressEn: s?.addressEn ?? null,
    addressHi: s?.addressHi ?? null,
    city: s?.city ?? null,
    map: s?.mapEnabled && s.mapLatitude != null && s.mapLongitude != null ? { lat: Number(s.mapLatitude), lng: Number(s.mapLongitude), labelEn: s.mapLabelEn, labelHi: s.mapLabelHi } : null,
    workingHoursEn: text(cfg.workingHoursEn).trim(),
    workingHoursHi: text(cfg.workingHoursHi).trim(),
    noteEn: text(cfg.contactNoteEn).trim(),
    noteHi: text(cfg.contactNoteHi).trim(),
    social,
  };
}

const LOADERS: Record<ContentSection, () => Promise<unknown>> = { about, founder, faq, gallery, blogs, testimonials, offers, contact };

export function isContentSection(v: string): v is ContentSection {
  return (CONTENT_SECTIONS as readonly string[]).includes(v);
}

export async function loadContent(section: ContentSection): Promise<unknown> {
  return LOADERS[section]();
}
