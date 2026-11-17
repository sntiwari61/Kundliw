import { describe, it, expect, vi, beforeEach } from "vitest";

const db = vi.hoisted(() => ({ service: vi.fn(), other: vi.fn() }));

vi.mock("@/lib/prisma", () => ({ prisma: { service: { findFirst: db.service }, otherService: { findFirst: db.other } } }));
vi.mock("@/lib/booking/packageAvailability", () => ({
  bookedSeatsByPackage: vi.fn(async () => ({ k1: 3 })),
  computeAvailability: vi.fn((_k: unknown, held: number) => ({ status: "open", reason: null, seatsLeft: 10 - held })),
}));

import { getOtherServiceDetail, getServiceDetail, normalizeDays } from "@/lib/mobile/services";

const service = (over: Record<string, unknown> = {}) => ({
  slug: "janam-kundli",
  titleEn: "Janam Kundli",
  titleHi: "जन्म कुंडली",
  taglineEn: null,
  taglineHi: null,
  descriptionEn: "About",
  descriptionHi: "विवरण",
  highlightsEn: ["Fast", "  "],
  highlightsHi: [],
  notesEn: null,
  notesHi: null,
  itineraryEn: null,
  itineraryHi: null,
  samagriEn: null,
  samagriHi: null,
  imageUrl: "/uploads/a.png",
  youtubeUrl: null,
  additionalLinks: [],
  demos: [],
  packages: [{ id: "k1", titleEn: "Pack", titleHi: "पैक", descriptionEn: null, descriptionHi: null, numberOfDays: 3, startDate: new Date("2026-12-01T00:00:00Z"), endDate: null, itineraryDays: [{ titleEn: "Day 1" }, {}], inclusionsEn: ["Stay"], inclusionsHi: [], exclusionsEn: [], exclusionsHi: [], materialsEn: [], materialsHi: [], imageUrl: null, youtubeUrl: null }],
  plans: [
    { id: "p1", packageId: null, slug: "basic", titleEn: "Basic", titleHi: "बेसिक", descriptionEn: "d", descriptionHi: "d", pricePaise: 100000, originalPricePaise: null, deliveryDays: 3, pages: 20, hasCall: false, callDurationMinutes: null, featuresEn: ["PDF"], featuresHi: [], programEn: null, programHi: null, preparationEn: null, preparationHi: null, samagriEn: null, samagriHi: null, isPopular: true, imageUrl: "https://placehold.co/10" },
    { id: "p2", packageId: "gone", slug: "hidden", titleEn: "Hidden", titleHi: "छिपा", descriptionEn: "", descriptionHi: "", pricePaise: 1, originalPricePaise: null, deliveryDays: null, pages: null, hasCall: false, callDurationMinutes: null, featuresEn: [], featuresHi: [], programEn: null, programHi: null, preparationEn: null, preparationHi: null, samagriEn: null, samagriHi: null, isPopular: false, imageUrl: null },
  ],
  ...over,
});

beforeEach(() => vi.clearAllMocks());

describe("mobile service detail", () => {
  it("answers nothing for a service that is off, paid on another website or missing", async () => {
    db.service.mockResolvedValue(null);
    expect(await getServiceDetail("nope")).toBeNull();
    expect(db.service).toHaveBeenCalledWith(expect.objectContaining({ where: { slug: "nope", isActive: true, externalPayUrl: null } }));
  });

  it("returns the full page with features, packages and seats, and hides plans of a switched-off package", async () => {
    db.service.mockResolvedValue(service());
    const s = await getServiceDetail("janam-kundli");
    expect(s?.highlightsEn).toEqual(["Fast"]);
    expect(s?.plans.map((p) => p.slug)).toEqual(["basic"]);
    expect(s?.plans[0]).toMatchObject({ featuresEn: ["PDF"], isPopular: true, imageUrl: null });
    expect(s?.packages[0]).toMatchObject({ numberOfDays: 3, startDate: "2026-12-01", inclusionsEn: ["Stay"], availability: { seatsLeft: 7 } });
    expect(s?.packages[0].days).toEqual([{ titleEn: "Day 1", titleHi: "", detailsEn: "", detailsHi: "" }]);
  });
});

describe("itinerary days", () => {
  it("keeps only real days", () => {
    expect(normalizeDays(null)).toEqual([]);
    expect(normalizeDays([{}, { detailsHi: "x" }, "junk"])).toEqual([{ titleEn: "", titleHi: "", detailsEn: "", detailsHi: "x" }]);
  });
});

describe("mobile other-service detail", () => {
  it("keeps only secure web addresses and ties the card to a bookable service when it has one", async () => {
    db.other.mockResolvedValue({
      slug: "tour", titleEn: "Tour", titleHi: "यात्रा", taglineEn: null, taglineHi: null, descriptionEn: "d", descriptionHi: "d", natureEn: "Pilgrimage", natureHi: null,
      imageUrl: "https://placehold.co/1", numberOfDays: 5, startDate: null, endDate: null, itineraryDays: [], actionUrl: "http://insecure.example", actionTextEn: null, actionTextHi: null,
      serviceSlug: "yatra", facebookUrl: "javascript:alert(1)", whatsappGroupUrl: "https://chat.whatsapp.com/x", youtubeUrl: null, additionalLinks: [], demos: [],
    });
    const o = await getOtherServiceDetail("tour");
    expect(o).toMatchObject({ actionUrl: null, imageUrl: null, facebookUrl: null, whatsappGroupUrl: "https://chat.whatsapp.com/x", serviceSlug: "yatra", numberOfDays: 5 });
  });
  it("answers nothing for an unknown card", async () => {
    db.other.mockResolvedValue(null);
    expect(await getOtherServiceDetail("x")).toBeNull();
  });
});
