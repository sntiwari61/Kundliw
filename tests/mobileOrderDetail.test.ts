import { describe, it, expect, vi, beforeEach } from "vitest";

const db = vi.hoisted(() => ({
  findFirst: vi.fn(),
  planFindMany: vi.fn(async () => []),
  vaultCount: vi.fn(async () => 2),
  invoice: vi.fn(async () => ({}) as Record<string, unknown>),
  choices: vi.fn(async () => [{ id: "p2", titleEn: "Gold", titleHi: "गोल्ड", pricePaise: 300000 }]),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { order: { findFirst: db.findFirst, findMany: vi.fn() }, plan: { findMany: db.planFindMany }, vaultFile: { count: db.vaultCount } },
}));
vi.mock("@/lib/siteConfig/service", () => ({ getSection: db.invoice }));
vi.mock("@/lib/orders/selfService", async () => {
  const real = await vi.importActual<typeof import("@/lib/orders/selfService")>("@/lib/orders/selfService").catch(() => null);
  return {
    cancelBlockReason: real?.cancelBlockReason ?? (() => null),
    upgradeBlockReason: real?.upgradeBlockReason ?? (() => null),
    upgradeChoices: db.choices,
  };
});

import { getOrderDetailFor } from "@/lib/mobile/orders";

const row = (over: Record<string, unknown> = {}) => ({
  id: "o1",
  orderNumber: "MKJK-2026-0001",
  createdAt: new Date("2026-11-13T06:00:00Z"),
  status: "ORDER_RECEIVED",
  paymentStatus: "PAID",
  paymentMode: "MANUAL_UPI",
  service: { slug: "janam", titleEn: "Janampatri", titleHi: "जन्मपत्रिका" },
  plan: { titleEn: "Silver", titleHi: "सिल्वर", package: null },
  extraPlanIds: [] as string[],
  baseAmountPaise: 110000,
  discountAmountPaise: 0,
  gstAmountPaise: 19800,
  netAmountPaise: 129800,
  offerCode: null,
  rejectionReason: null,
  cancelledAt: null,
  appointmentStatus: null,
  slot: null,
  invoiceNumber: "INV-1",
  courierName: "Speed Post",
  trackingNumber: "EE123",
  statusEvents: [{ id: "e1", status: "ORDER_RECEIVED", note: "Received", createdAt: new Date("2026-11-13T06:01:00Z") }],
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  db.invoice.mockResolvedValue({});
});

describe("mobile order detail", () => {
  it("looks the order up by id AND owner", async () => {
    db.findFirst.mockResolvedValue(null);
    expect(await getOrderDetailFor("u1", "someone-elses")).toBeNull();
    expect(db.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "someone-elses", userId: "u1" } }));
  });

  it("returns the history, tracking, what the customer can still do and the document count", async () => {
    db.findFirst.mockResolvedValue(row());
    const o = await getOrderDetailFor("u1", "o1");
    expect(o?.events).toEqual([{ id: "e1", status: "ORDER_RECEIVED", note: "Received", createdAt: "2026-11-13T06:01:00.000Z" }]);
    expect(o).toMatchObject({ courierName: "Speed Post", trackingNumber: "EE123", serviceSlug: "janam", documents: 2, invoiceAllowed: true });
    expect(o?.upgrades).toEqual([{ id: "p2", titleEn: "Gold", titleHi: "गोल्ड", pricePaise: 300000 }]);
    expect(o?.cancel.allowed).toBe(true);
  });

  it("explains in both languages why an order that has been started cannot be cancelled", async () => {
    db.findFirst.mockResolvedValue(row({ status: "KUNDLI_IN_PROGRESS" }));
    const o = await getOrderDetailFor("u1", "o1");
    expect(o?.cancel.allowed).toBe(false);
    expect(o?.cancel.reasonEn).toMatch(/started/i);
    expect(o?.cancel.reasonHi).toBeTruthy();
    expect(o?.upgrades).toEqual([]);
  });

  it("offers nothing on a cancelled order and respects the admin's invoice switch", async () => {
    db.invoice.mockResolvedValue({ userCanDownload: false });
    db.findFirst.mockResolvedValue(row({ cancelledAt: new Date("2026-11-14T00:00:00Z"), paymentStatus: "REFUNDED" }));
    const o = await getOrderDetailFor("u1", "o1");
    expect(o?.cancel).toEqual({ allowed: false, reasonEn: null, reasonHi: null });
    expect(o?.upgrades).toEqual([]);
    expect(o?.invoiceAllowed).toBe(false);
  });

  it("never exposes birth details or payment proof", async () => {
    db.findFirst.mockResolvedValue(row({ jatakaDetails: { name: "X" }, manualPaymentProof: "/p.png", manualPaymentRef: "UTR1", adminNotes: "secret" }));
    expect(JSON.stringify(await getOrderDetailFor("u1", "o1"))).not.toMatch(/jataka|manualPayment|UTR1|p\.png|secret/);
  });
});
