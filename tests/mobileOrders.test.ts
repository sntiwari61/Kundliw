import { describe, it, expect, vi, beforeEach } from "vitest";

const db = vi.hoisted(() => {
  const findMany = vi.fn();
  const findFirst = vi.fn();
  const planFindMany = vi.fn(async () => [{ id: "extra1", titleEn: "Video", titleHi: "वीडियो" }]);
  return { findMany, findFirst, planFindMany };
});

vi.mock("@/lib/prisma", () => ({
  prisma: { order: { findMany: db.findMany, findFirst: db.findFirst }, plan: { findMany: db.planFindMany } },
}));

import { getOrderFor, listOrdersFor } from "@/lib/mobile/orders";

const row = (over: Record<string, unknown> = {}) => ({
  id: "o1",
  orderNumber: "MKJK-2026-0001",
  createdAt: new Date("2026-11-13T06:00:00Z"),
  status: "ORDER_RECEIVED",
  paymentStatus: "PENDING",
  paymentMode: "MANUAL_UPI",
  service: { titleEn: "Janampatri", titleHi: "जन्मपत्रिका" },
  plan: { titleEn: "Audio", titleHi: "ऑडियो" },
  extraPlanIds: [] as string[],
  baseAmountPaise: 110000,
  discountAmountPaise: 0,
  gstAmountPaise: 19800,
  netAmountPaise: 129800,
  offerCode: null,
  rejectionReason: null,
  cancelledAt: null,
  slot: null,
  invoiceNumber: null,
  ...over,
});

beforeEach(() => vi.clearAllMocks());

describe("mobile orders", () => {
  it("lists only the signed-in customer's orders, newest first", async () => {
    db.findMany.mockResolvedValue([row()]);
    const out = await listOrdersFor("u1");
    expect(db.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: "u1" }, orderBy: { createdAt: "desc" } }));
    expect(out[0]).toMatchObject({ orderNumber: "MKJK-2026-0001", netAmountPaise: 129800, planTitleEn: "Audio", serviceTitleHi: "जन्मपत्रिका" });
    expect(out[0].createdAt).toBe("2026-11-13T06:00:00.000Z");
  });

  it("looks an order up by id AND owner, so another customer's order is not found", async () => {
    db.findFirst.mockResolvedValue(null);
    expect(await getOrderFor("u1", "someone-elses")).toBeNull();
    expect(db.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "someone-elses", userId: "u1" } }));
  });

  it("joins the titles of plans booked together and formats the call slot", async () => {
    db.findFirst.mockResolvedValue(
      row({ extraPlanIds: ["extra1"], slot: { date: new Date("2026-11-20T00:00:00Z"), startTime: "10:00", endTime: "10:30" } }),
    );
    const o = await getOrderFor("u1", "o1");
    expect(o?.planTitleEn).toBe("Audio + Video");
    expect(o?.planTitleHi).toBe("ऑडियो + वीडियो");
    expect(o?.slot).toEqual({ date: "2026-11-20", startTime: "10:00", endTime: "10:30" });
  });

  it("does not expose the order's personal birth details or payment proof", async () => {
    db.findFirst.mockResolvedValue(row({ jatakaDetails: { name: "X" }, manualPaymentProof: "/p.png", manualPaymentRef: "UTR1" }));
    const json = JSON.stringify(await getOrderFor("u1", "o1"));
    expect(json).not.toMatch(/jataka|manualPayment|UTR1|p\.png/);
  });
});
