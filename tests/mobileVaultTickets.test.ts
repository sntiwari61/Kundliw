import { describe, it, expect, vi, beforeEach } from "vitest";

const db = vi.hoisted(() => ({
  vaultFindMany: vi.fn(),
  ticketFindMany: vi.fn(),
  ticketFindFirst: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    vaultFile: { findMany: db.vaultFindMany },
    supportTicket: { findMany: db.ticketFindMany, findFirst: db.ticketFindFirst },
  },
}));

import { getTicketFor, listTicketsFor, listVaultFor } from "@/lib/mobile/vaultTickets";

beforeEach(() => vi.clearAllMocks());

describe("mobile vault and tickets", () => {
  it("lists only the person's own vault files and never asks for the storage path", async () => {
    db.vaultFindMany.mockResolvedValue([
      { id: "f1", titleEn: "Kundli", titleHi: "कुंडली", fileName: "k.pdf", fileSize: 10, mimeType: "application/pdf", uploadedByRole: "ADMIN", uploadedAt: new Date("2026-11-01T00:00:00Z") },
    ]);
    const files = await listVaultFor("u1");
    const arg = db.vaultFindMany.mock.calls[0][0];
    expect(arg.where).toEqual({ userId: "u1" });
    expect(arg.select.storageKey).toBeUndefined();
    expect(files[0].uploadedAt).toBe("2026-11-01T00:00:00.000Z");
    expect(JSON.stringify(files)).not.toMatch(/storageKey/);
  });

  it("lists only the person's own tickets", async () => {
    db.ticketFindMany.mockResolvedValue([]);
    await listTicketsFor("u1");
    expect(db.ticketFindMany.mock.calls[0][0].where).toEqual({ userId: "u1" });
  });

  it("finds a ticket by id AND owner, and does not select the contact details", async () => {
    db.ticketFindFirst.mockResolvedValue(null);
    expect(await getTicketFor("u1", "t-of-someone-else")).toBeNull();
    const arg = db.ticketFindFirst.mock.calls[0][0];
    expect(arg.where).toEqual({ id: "t-of-someone-else", userId: "u1" });
    expect(arg.select.contactEmail).toBeUndefined();
    expect(arg.select.contactAddress).toBeUndefined();
  });

  it("returns the messages oldest first with ISO dates", async () => {
    const d = new Date("2026-11-02T10:00:00Z");
    db.ticketFindFirst.mockResolvedValue({
      id: "t1", ticketNumber: "TKT-1", subject: "Help", orderNumber: null, status: "OPEN", createdAt: d, updatedAt: d,
      messages: [{ id: "m1", fromAdmin: false, body: "Hello", createdAt: d }],
    });
    const t = await getTicketFor("u1", "t1");
    expect(db.ticketFindFirst.mock.calls[0][0].select.messages.orderBy).toEqual({ createdAt: "asc" });
    expect(t?.messages[0]).toEqual({ id: "m1", fromAdmin: false, body: "Hello", createdAt: "2026-11-02T10:00:00.000Z" });
  });
});
