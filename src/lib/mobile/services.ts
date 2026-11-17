import { prisma } from "@/lib/prisma";
import { bookedSeatsByPackage, computeAvailability } from "@/lib/booking/packageAvailability";
import { activePlanWhere } from "@/lib/content/packages";
import { isSafeImageSrc, normalizeLinks } from "@/lib/content/media";
import { normalizeDemos } from "@/lib/content/demos";

/**
 * The full page of one service (and of one "other service" card) for the app, read from the same
 * places as the website so the admin controls both. Everything comes in English and Hindi.
 */

const image = (v: string | null | undefined) => (isSafeImageSrc(v) && !/placehold\.co/i.test(v) ? (v as string).trim() : null);
const str = (v: unknown) => (typeof v === "string" ? v : "");

export interface ItineraryDay {
  titleEn: string;
  titleHi: string;
  detailsEn: string;
  detailsHi: string;
}

/** The programme the admin writes day by day: anything that is not a list of days is dropped */
export function normalizeDays(raw: unknown): ItineraryDay[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((d) => {
      const r = (d ?? {}) as Record<string, unknown>;
      return { titleEn: str(r.titleEn), titleHi: str(r.titleHi), detailsEn: str(r.detailsEn), detailsHi: str(r.detailsHi) };
    })
    .filter((d) => d.titleEn || d.titleHi || d.detailsEn || d.detailsHi);
}

const iso = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : null);
const list = (v: string[] | null | undefined) => (Array.isArray(v) ? v.filter((x) => typeof x === "string" && x.trim()) : []);

export async function getServiceDetail(slug: string) {
  const s = await prisma.service
    .findFirst({
      where: { slug, isActive: true, externalPayUrl: null },
      include: {
        plans: { where: activePlanWhere, orderBy: { orderIndex: "asc" } },
        packages: { where: { isActive: true }, orderBy: { orderIndex: "asc" } },
      },
    })
    .catch(() => null);
  if (!s) return null;
  const booked = await bookedSeatsByPackage(s.packages.map((k) => k.id)).catch(() => ({}) as Record<string, number>);
  const packageIds = new Set(s.packages.map((k) => k.id));
  return {
    slug: s.slug,
    titleEn: s.titleEn,
    titleHi: s.titleHi,
    taglineEn: s.taglineEn ?? null,
    taglineHi: s.taglineHi ?? null,
    descriptionEn: s.descriptionEn,
    descriptionHi: s.descriptionHi,
    highlightsEn: list(s.highlightsEn),
    highlightsHi: list(s.highlightsHi),
    notesEn: s.notesEn ?? "",
    notesHi: s.notesHi ?? "",
    itineraryEn: s.itineraryEn ?? "",
    itineraryHi: s.itineraryHi ?? "",
    samagriEn: s.samagriEn ?? "",
    samagriHi: s.samagriHi ?? "",
    imageUrl: image(s.imageUrl),
    youtubeUrl: s.youtubeUrl ?? null,
    links: normalizeLinks(s.additionalLinks),
    demos: normalizeDemos(s.demos),
    packages: s.packages.map((k) => ({
      id: k.id,
      titleEn: k.titleEn,
      titleHi: k.titleHi,
      descriptionEn: k.descriptionEn ?? "",
      descriptionHi: k.descriptionHi ?? "",
      numberOfDays: k.numberOfDays ?? null,
      startDate: iso(k.startDate),
      endDate: iso(k.endDate),
      days: normalizeDays(k.itineraryDays),
      inclusionsEn: list(k.inclusionsEn),
      inclusionsHi: list(k.inclusionsHi),
      exclusionsEn: list(k.exclusionsEn),
      exclusionsHi: list(k.exclusionsHi),
      materialsEn: list(k.materialsEn),
      materialsHi: list(k.materialsHi),
      imageUrl: image(k.imageUrl),
      youtubeUrl: k.youtubeUrl ?? null,
      availability: computeAvailability(k, (booked as Record<string, number>)[k.id] ?? 0),
    })),
    plans: s.plans
      .filter((p) => !p.packageId || packageIds.has(p.packageId))
      .map((p) => ({
        id: p.id,
        packageId: p.packageId,
        slug: p.slug,
        titleEn: p.titleEn,
        titleHi: p.titleHi,
        descriptionEn: p.descriptionEn,
        descriptionHi: p.descriptionHi,
        pricePaise: p.pricePaise,
        originalPricePaise: p.originalPricePaise,
        deliveryDays: p.deliveryDays,
        pages: p.pages,
        hasCall: p.hasCall,
        callDurationMinutes: p.callDurationMinutes,
        featuresEn: list(p.featuresEn),
        featuresHi: list(p.featuresHi),
        programEn: p.programEn ?? "",
        programHi: p.programHi ?? "",
        preparationEn: p.preparationEn ?? "",
        preparationHi: p.preparationHi ?? "",
        samagriEn: p.samagriEn ?? "",
        samagriHi: p.samagriHi ?? "",
        isPopular: p.isPopular,
        imageUrl: image(p.imageUrl),
      })),
  };
}

export async function getOtherServiceDetail(slug: string) {
  const o = await prisma.otherService.findFirst({ where: { slug, isActive: true } }).catch(() => null);
  if (!o) return null;
  const actionUrl = o.actionUrl && /^https:\/\//i.test(o.actionUrl) ? o.actionUrl : null;
  const social = (u: string | null | undefined) => (u && /^https:\/\//i.test(u) ? u : null);
  return {
    slug: o.slug,
    titleEn: o.titleEn,
    titleHi: o.titleHi,
    taglineEn: o.taglineEn ?? null,
    taglineHi: o.taglineHi ?? null,
    descriptionEn: o.descriptionEn,
    descriptionHi: o.descriptionHi,
    natureEn: o.natureEn ?? null,
    natureHi: o.natureHi ?? null,
    imageUrl: image(o.imageUrl),
    numberOfDays: o.numberOfDays ?? null,
    startDate: iso(o.startDate),
    endDate: iso(o.endDate),
    days: normalizeDays(o.itineraryDays),
    actionUrl,
    actionTextEn: o.actionTextEn ?? null,
    actionTextHi: o.actionTextHi ?? null,
    /** a bookable service of the Kendra this card is tied to, when there is one */
    serviceSlug: o.serviceSlug || null,
    facebookUrl: social(o.facebookUrl),
    whatsappGroupUrl: social(o.whatsappGroupUrl),
    youtubeUrl: o.youtubeUrl ?? null,
    links: normalizeLinks(o.additionalLinks),
    demos: normalizeDemos(o.demos),
  };
}
