import { describe, it, expect, vi, beforeEach } from "vitest";

const state = vi.hoisted(() => ({
  header: null as string | null,
  user: null as null | { id: string; name: string; email: string; phone: string | null; role: string; passwordHash: string | null },
}));

vi.mock("next/headers", () => ({
  headers: async () => ({ get: (k: string) => (k.toLowerCase() === "authorization" ? state.header : null) }),
}));
vi.mock("next-auth", () => ({ getServerSession: vi.fn(async () => null) }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: vi.fn(async () => state.user) } },
}));

import { bearerFrom, issueMobileTokens, verifyMobileToken, passwordFingerprint } from "@/lib/mobile/token";
import { getCurrentUser, guardApiAssociate } from "@/lib/auth/guards";

beforeEach(() => {
  process.env.NEXTAUTH_SECRET = "test-secret-test-secret-test-secret-123";
  state.header = null;
  state.user = { id: "u1", name: "Aditya", email: "a@example.com", phone: "+919999900002", role: "USER", passwordHash: "hash-1" };
});

describe("mobile tokens", () => {
  it("issues an access and a refresh token that only verify as their own kind", async () => {
    const t = await issueMobileTokens({ id: "u1", passwordHash: "hash-1" });
    expect(await verifyMobileToken(t.accessToken, "mobile-access")).toMatchObject({ userId: "u1" });
    expect(await verifyMobileToken(t.refreshToken, "mobile-refresh")).toMatchObject({ userId: "u1" });
    expect(await verifyMobileToken(t.refreshToken, "mobile-access")).toBeNull();
    expect(await verifyMobileToken(t.accessToken, "mobile-refresh")).toBeNull();
  });

  it("rejects garbage, tampered and empty tokens", async () => {
    const t = await issueMobileTokens({ id: "u1", passwordHash: null });
    expect(await verifyMobileToken("", "mobile-access")).toBeNull();
    expect(await verifyMobileToken(null, "mobile-access")).toBeNull();
    expect(await verifyMobileToken("not.a.token", "mobile-access")).toBeNull();
    expect(await verifyMobileToken(t.accessToken.slice(0, -4) + "AAAA", "mobile-access")).toBeNull();
  });

  it("rejects a token signed with another secret", async () => {
    const t = await issueMobileTokens({ id: "u1", passwordHash: "x" });
    process.env.NEXTAUTH_SECRET = "a-different-secret-a-different-secret-12";
    expect(await verifyMobileToken(t.accessToken, "mobile-access")).toBeNull();
  });

  it("reads a Bearer header", () => {
    expect(bearerFrom("Bearer abc.def")).toBe("abc.def");
    expect(bearerFrom("bearer abc")).toBe("abc");
    expect(bearerFrom("Basic abc")).toBeNull();
    expect(bearerFrom("")).toBeNull();
    expect(bearerFrom(null)).toBeNull();
  });

  it("fingerprints the password without exposing it", () => {
    expect(passwordFingerprint("hash-1")).not.toContain("hash");
    expect(passwordFingerprint("hash-1")).not.toBe(passwordFingerprint("hash-2"));
    expect(passwordFingerprint(null)).toBe("none");
  });
});

describe("getCurrentUser with a Bearer token", () => {
  it("returns the account for a valid access token", async () => {
    const t = await issueMobileTokens({ id: "u1", passwordHash: "hash-1" });
    state.header = `Bearer ${t.accessToken}`;
    expect(await getCurrentUser()).toMatchObject({ id: "u1", role: "USER" });
  });

  it("never returns the password hash", async () => {
    const t = await issueMobileTokens({ id: "u1", passwordHash: "hash-1" });
    state.header = `Bearer ${t.accessToken}`;
    expect(await getCurrentUser()).not.toHaveProperty("passwordHash");
  });

  it("refuses a refresh token used as an access token", async () => {
    const t = await issueMobileTokens({ id: "u1", passwordHash: "hash-1" });
    state.header = `Bearer ${t.refreshToken}`;
    expect(await getCurrentUser()).toBeNull();
  });

  it("refuses the token after the password changed or the account was removed", async () => {
    const t = await issueMobileTokens({ id: "u1", passwordHash: "hash-1" });
    state.header = `Bearer ${t.accessToken}`;
    state.user!.passwordHash = "hash-2";
    expect(await getCurrentUser()).toBeNull();
    state.user = null;
    expect(await getCurrentUser()).toBeNull();
  });

  it("reads the role from the database, so a User token cannot act as an Associate", async () => {
    const t = await issueMobileTokens({ id: "u1", passwordHash: "hash-1" });
    state.header = `Bearer ${t.accessToken}`;
    const guard = await guardApiAssociate();
    expect(guard.ok).toBe(false);
    if (!guard.ok) expect(guard.errorResponse.status).toBe(403);
  });

  it("is anonymous without a header", async () => {
    expect(await getCurrentUser()).toBeNull();
  });
});
