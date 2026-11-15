import { prisma } from "@/lib/prisma";
import { getSection } from "@/lib/siteConfig/service";
import { HERO_SLIDES_KEY, normalizeHeroSlides, slideIsShowable } from "@/lib/content/heroSlides";
import { isSafeImageSrc } from "@/lib/content/media";

/**
 * Everything the app's Home screen shows, from the same settings the website's home page uses
 * (so the admin changes both at once) plus the app's own switches (Settings > Android app).
 * Texts that are left empty come back empty: the app then uses its own standard wording.
 */

const image = (v: unknown) => (typeof v === "string" && isSafeImageSrc(v) ? v.trim() : null);
const str = (v: unknown) => (typeof v === "string" ? v : "");
const flag = (v: unknown, def = true) => (typeof v === "boolean" ? v : def);

/** Keeps only the text, switch and picture values of a settings section (no unknown keys). */
function pickValues(values: Record<string, unknown>, imageKeys: string[] = []): Record<string, string | boolean | number | null> {
  const out: Record<string, string | boolean | number | null> = {};
  for (const [k, v] of Object.entries(values)) {
    if (imageKeys.includes(k)) out[k] = image(v);
    else if (typeof v === "string" || typeof v === "boolean" || typeof v === "number") out[k] = v;
  }
  return out;
}

export async function loadAppConfig() {
  const app = await getSection("appSettings");
  const store = await getSection("mobileApp");
  return {
    maintenanceOn: flag(app.maintenanceOn, false),
    maintenanceTextEn: str(app.maintenanceTextEn).trim(),
    maintenanceTextHi: str(app.maintenanceTextHi).trim(),
    minVersion: str(app.minVersion).trim(),
    updateTextEn: str(app.updateTextEn).trim(),
    updateTextHi: str(app.updateTextHi).trim(),
    playStoreUrl: str(store.playStoreUrl).trim() || null,
    allowBooking: flag(app.allowBooking, true),
    bookingUrl: str(app.bookingUrl).trim() || "/services",
  };
}

export async function loadHome() {
  const [app, hero, cards, servicesCfg, process, contactCfg, extras, sections, floating] = await Promise.all([
    getSection("appSettings"),
    getSection("homeHero"),
    getSection("homeCards"),
    getSection("homeServices"),
    getSection("homeProcess"),
    getSection("homeContact"),
    getSection("homeExtras"),
    getSection("homeSections"),
    getSection("floating"),
  ]);

  const now = new Date();
  const [services, slidesRaw, marquee, offers, others, testimonials, posts, faqs, gallery, settings] = await Promise.all([
    prisma.service.findMany({ where: { isActive: true }, select: { slug: true, imageUrl: true } }).catch(() => []),
    prisma.siteConfig.findUnique({ where: { key: HERO_SLIDES_KEY } }).then((r) => normalizeHeroSlides(r?.value)).catch(() => []),
    prisma.marqueeItem.findMany({ where: { isActive: true }, orderBy: { orderIndex: "asc" } }).catch(() => []),
    prisma.offer
      .findMany({
        where: { isActive: true, showInPopup: true, validFrom: { lte: now }, OR: [{ validUntil: null }, { validUntil: { gte: now } }] },
        orderBy: { createdAt: "desc" },
        take: 6,
      })
      .catch(() => []),
    prisma.otherService.findMany({ where: { isActive: true }, orderBy: { orderIndex: "asc" } }).catch(() => []),
    prisma.testimonial.findMany({ where: { isActive: true, isVerified: true }, orderBy: { orderIndex: "asc" }, take: 6 }).catch(() => []),
    prisma.blogPost.findMany({ where: { isPublished: true }, orderBy: { createdAt: "desc" }, take: 4 }).catch(() => []),
    prisma.faqItem.findMany({ where: { isActive: true }, orderBy: { orderIndex: "asc" }, take: 6 }).catch(() => []),
    prisma.mediaGalleryItem.findMany({ where: { isActive: true, mediaType: "IMAGE" }, orderBy: { orderIndex: "asc" }, take: 8 }).catch(() => []),
    prisma.adminSettings.findFirst({ select: { phone1: true, phone2: true, email: true, whatsappNumber: true, socialWhatsapp: true } }).catch(() => null),
  ]);

  const serviceImage = new Map(services.map((s) => [s.slug, s.imageUrl]));
  const slides = slidesRaw
    .filter((s) => slideIsShowable(s, serviceImage.get(s.serviceSlug)))
    .map((s) => ({
      id: s.id,
      imageUrl: image(s.imageUrl) || image(serviceImage.get(s.serviceSlug)),
      titleEn: s.titleEn,
      titleHi: s.titleHi,
      descEn: s.descEn,
      descHi: s.descHi,
      youtubeUrl: s.youtubeUrl || null,
      serviceSlug: s.serviceSlug || null,
      titleColor: s.titleColor || null,
    }));

  const phone = settings?.phone1 || "+91 98279 91224";
  const whatsapp = str(floating.whatsappNumber).trim() || settings?.whatsappNumber || settings?.socialWhatsapp || phone;

  return {
    app: pickValues(app),
    hero: pickValues(hero, ["image1", "image2"]),
    cards: pickValues(cards, ["aboutImage"]),
    servicesCfg: pickValues(servicesCfg),
    process: pickValues(process),
    contactCfg: pickValues(contactCfg),
    extras: pickValues(extras),
    sections: pickValues(sections),
    slides,
    notices: marquee.map((m) => ({ id: m.id, textEn: m.textEn, textHi: m.textHi })),
    offers: offers.map((o) => ({
      id: o.id,
      code: o.code,
      titleEn: o.titleEn,
      titleHi: o.titleHi,
      discountType: o.discountType,
      discountValuePaise: o.discountValuePaise,
      maxDiscountPaise: o.maxDiscountPaise,
      autoApply: o.autoApply,
    })),
    otherServices: others.map((o) => ({
      slug: o.slug,
      titleEn: o.titleEn,
      titleHi: o.titleHi,
      descEn: o.descriptionEn,
      descHi: o.descriptionHi,
      imageUrl: image(o.imageUrl),
      actionUrl: o.actionUrl && /^https:\/\//i.test(o.actionUrl) ? o.actionUrl : null,
    })),
    testimonials: testimonials.map((t) => ({
      id: t.id,
      authorNameEn: t.authorNameEn,
      authorNameHi: t.authorNameHi,
      cityEn: t.cityEn,
      cityHi: t.cityHi,
      quoteEn: t.quoteEn,
      quoteHi: t.quoteHi,
      rating: t.rating,
      photoUrl: image(t.photoUrl),
    })),
    posts: posts.map((p) => ({
      slug: p.slug,
      titleEn: p.titleEn,
      titleHi: p.titleHi,
      excerptEn: p.excerptEn,
      excerptHi: p.excerptHi,
      coverImage: image(p.coverImage),
    })),
    faqs: faqs.map((f) => ({ id: f.id, questionEn: f.questionEn, questionHi: f.questionHi, answerEn: f.answerEn, answerHi: f.answerHi })),
    gallery: gallery.map((g) => ({ id: g.id, titleEn: g.titleEn, titleHi: g.titleHi, imageUrl: image(g.imageUrl) })),
    contact: { phone, phone2: settings?.phone2 ?? null, email: settings?.email ?? null, whatsapp },
  };
}
