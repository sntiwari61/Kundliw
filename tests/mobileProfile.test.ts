import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma } from "@prisma/client";

const db = vi.hoisted(() => ({ find: vi.fn(), update: vi.fn() }));

vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique: db.find, update: db.update } } }));
vi.mock("@/lib/mobile/session", () => ({
  toUserDto: vi.fn(async (id: string) => ({ id, name: "Asha Devi", email: "asha@example.com", phone: "+919800000001", role: "USER" })),
}));

import { ProfileError, profileInputSchema, updateProfile } from "@/lib/mobile/profile";

const me = (over: Record<string, unknown> = {}) => ({ id: "u1", role: "USER", phone: "+919800000001", email: "old@example.com", ...over });

beforeEach(() => {
  vi.clearAllMocks();
  db.update.mockResolvedValue({});
});

describe("profile input", () => {
  it("needs a real name and a valid email, and lowercases the email", () => {
    expect(profileInputSchema.safeParse({ name: "A" }).success).toBe(false);
    expect(profileInputSchema.safeParse({ name: "Asha", email: "not-an-email" }).success).toBe(false);
    const ok = profileInputSchema.parse({ name: "  Asha Devi ", email: "ASHA@Example.com" });
    expect(ok).toEqual({ name: "Asha Devi", email: "asha@example.com" });
    expect(profileInputSchema.safeParse({ name: "Asha", email: "" }).success).toBe(true);
  });
});

describe("update profile", () => {
  it("saves the name and email of the signed-in person only, and asks for the email to be checked again when it changes", async () => {
    db.find.mockResolvedValue(me());
    await updateProfile("u1", { name: "Asha Devi", email: "new@example.com" });
    expect(db.update).toHaveBeenCalledWith({ where: { id: "u1" }, data: { name: "Asha Devi", email: "new@example.com", emailVerified: null } });
  });

  it("keeps the verified email when it is unchanged", async () => {
    db.find.mockResolvedValue(me({ email: "same@example.com" }));
    await updateProfile("u1", { name: "Asha", email: "same@example.com" });
    expect(db.update.mock.calls[0][0].data).toEqual({ name: "Asha", email: "same@example.com" });
  });

  it("never changes an administrator's account from the app", async () => {
    db.find.mockResolvedValue(me({ role: "ADMIN" }));
    await expect(updateProfile("u1", { name: "Asha", email: "x@example.com" })).rejects.toMatchObject({ status: 403 });
    expect(db.update).not.toHaveBeenCalled();
  });

  it("does not let a person with no mobile number remove their only way to sign in", async () => {
    db.find.mockResolvedValue(me({ phone: null }));
    await expect(updateProfile("u1", { name: "Asha", email: "" })).rejects.toBeInstanceOf(ProfileError);
    expect(db.update).not.toHaveBeenCalled();
  });

  it("answers clearly when the email belongs to someone else", async () => {
    db.find.mockResolvedValue(me());
    db.update.mockRejectedValue(new Prisma.PrismaClientKnownRequestError("dup", { code: "P2002", clientVersion: "x" }));
    await expect(updateProfile("u1", { name: "Asha", email: "taken@example.com" })).rejects.toMatchObject({ status: 409, message: expect.stringMatching(/already used/) });
  });
});
