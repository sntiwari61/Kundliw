import { describe, it, expect, vi, beforeEach } from "vitest";

const db = vi.hoisted(() => {
  const state = {
    user: null as null | Record<string, unknown>,
    openOrders: 0,
    owed: 0,
    requested: 0,
    files: [{ storageKey: "vault/a.pdf" }, { storageKey: "vault/b.pdf" }],
  };
  const calls: Record<string, unknown[]> = {};
  const rec = (name: string) => vi.fn(async (arg?: unknown) => { (calls[name] ||= []).push(arg); return { count: 1 }; });
  const tx = {
    vaultFile: { deleteMany: rec("vaultFile.deleteMany") },
    account: { deleteMany: rec("account.deleteMany") },
    supportTicket: { updateMany: rec("supportTicket.updateMany") },
    commission: { updateMany: rec("commission.updateMany") },
    associateProfile: { update: rec("associateProfile.update") },
    otpVerification: { deleteMany: rec("otp.deleteMany") },
    user: { update: rec("user.update") },
  };
  const prisma = {
    user: { findUnique: vi.fn(async () => state.user) },
    order: { count: vi.fn(async () => state.openOrders) },
    commission: { count: vi.fn(async () => state.owed) },
    payoutRequest: { count: vi.fn(async () => state.requested) },
    vaultFile: { findMany: vi.fn(async () => state.files) },
    $transaction: vi.fn(async (fn: (t: typeof tx) => Promise<unknown>) => fn(tx)),
  };
  const removed: string[] = [];
  return { state, calls, prisma, removed };
});

vi.mock("@/lib/prisma", () => ({ prisma: db.prisma }));
vi.mock("@/lib/storage", () => ({
  getStorageProvider: () => ({
    deleteFile: async (k: string) => {
      if (k.endsWith("b.pdf")) throw new Error("disk busy");
      db.removed.push(k);
    },
  }),
}));

import { deleteAccount, DELETED_NAME } from "@/lib/account/deletion";

beforeEach(() => {
  for (const k of Object.keys(db.calls)) delete db.calls[k];
  db.removed.length = 0;
  Object.assign(db.state, { openOrders: 0, owed: 0, requested: 0 });
  db.state.user = { id: "u1", role: "USER", phone: "+919999900002", name: "Aditya", associate: null };
});

describe("deleteAccount", () => {
  it("anonymises the person and removes their files", async () => {
    const r = await deleteAccount("u1");
    expect(r).toEqual({ ok: true, deletedFiles: 1 }); // the second file failed but the account is still closed
    expect(db.removed).toEqual(["vault/a.pdf"]);
    expect(db.calls["user.update"][0]).toMatchObject({
      where: { id: "u1" },
      data: { name: DELETED_NAME, email: null, phone: null, passwordHash: null, image: null, emailVerified: null },
    });
    expect(db.calls["vaultFile.deleteMany"]).toHaveLength(1);
    expect(db.calls["account.deleteMany"]).toHaveLength(1);
    expect(db.calls["otp.deleteMany"][0]).toEqual({ where: { phone: "+919999900002" } });
    expect(db.calls["supportTicket.updateMany"][0]).toMatchObject({ data: { contactName: null, contactEmail: null, contactPhone: null, contactAddress: null } });
  });

  it("refuses an administrator", async () => {
    db.state.user = { id: "a1", role: "ADMIN", phone: null, name: "Admin", associate: null };
    const r = await deleteAccount("a1");
    expect(r).toMatchObject({ ok: false, status: 403 });
    expect(db.calls["user.update"]).toBeUndefined();
  });

  it("refuses while a paid order is still in progress", async () => {
    db.state.openOrders = 1;
    const r = await deleteAccount("u1");
    expect(r).toMatchObject({ ok: false, status: 409 });
    expect(db.calls["user.update"]).toBeUndefined();
  });

  it("refuses an associate who is still owed commission or has a payout request open", async () => {
    db.state.user = { id: "s1", role: "ASSOCIATE", phone: "+919999900003", name: "Sita", associate: { id: "p1" } };
    db.state.owed = 2;
    expect(await deleteAccount("s1")).toMatchObject({ ok: false, status: 409 });
    db.state.owed = 0;
    db.state.requested = 1;
    expect(await deleteAccount("s1")).toMatchObject({ ok: false, status: 409 });
    expect(db.calls["user.update"]).toBeUndefined();
  });

  it("closes an associate profile and clears the payout details", async () => {
    db.state.user = { id: "s1", role: "ASSOCIATE", phone: "+919999900003", name: "Sita", associate: { id: "p1" } };
    const r = await deleteAccount("s1");
    expect(r.ok).toBe(true);
    expect(db.calls["associateProfile.update"][0]).toMatchObject({
      where: { id: "p1" },
      data: { status: "SUSPENDED", payoutUpi: null, payoutAccountHolder: null, payoutAccountNumber: null, payoutIfsc: null },
    });
    expect(db.calls["commission.updateMany"][0]).toMatchObject({ data: { status: "CANCELLED" } });
  });

  it("does nothing for an account that is already deleted or missing", async () => {
    db.state.user = { id: "u1", role: "USER", phone: null, name: DELETED_NAME, associate: null };
    expect(await deleteAccount("u1")).toMatchObject({ ok: false, status: 404 });
    db.state.user = null;
    expect(await deleteAccount("zzz")).toMatchObject({ ok: false, status: 404 });
  });
});
