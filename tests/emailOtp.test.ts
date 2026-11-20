import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const db = vi.hoisted(() => ({
  findUser: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  findOtp: vi.fn(),
  createOtp: vi.fn(),
  updateOtp: vi.fn(),
  updateManyOtp: vi.fn(),
  rate: vi.fn(),
  reset: vi.fn(),
  send: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: db.findUser, create: db.createUser, update: db.updateUser },
    otpVerification: { findFirst: db.findOtp, create: db.createOtp, update: db.updateOtp, updateMany: db.updateManyOtp },
  },
}));
vi.mock("@/lib/rateLimit", () => ({ checkDbRateLimit: db.rate, resetDbRateLimit: db.reset, getClientIp: () => "1.2.3.4" }));
vi.mock("@/lib/notifications", () => ({ sendNotification: db.send }));

import { POST as sendRoute } from "@/app/api/auth/otp/email/send/route";
import { loginWithEmailOtp } from "@/lib/auth/credentialLogin";
import { emailOtpKey, hashOtp } from "@/lib/auth/otp";

const req = (body: unknown) =>
  new NextRequest("http://localhost/api/auth/otp/email/send", { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json" } });

beforeEach(() => {
  vi.clearAllMocks();
  db.rate.mockResolvedValue({ allowed: true });
  db.send.mockResolvedValue({ emailSent: true });
  db.findUser.mockResolvedValue(null);
  db.updateManyOtp.mockResolvedValue({ count: 0 });
  db.createOtp.mockResolvedValue({});
});

describe("email sign-in code: sending", () => {
  it("keys the code by the lowercased email, never by a phone number", () => {
    expect(emailOtpKey("  Asha@Example.COM ")).toBe("email:asha@example.com");
  });

  it("emails a 6-digit code and stores only its hash", async () => {
    const res = await sendRoute(req({ email: "Asha@Example.com" }));
    expect(res.status).toBe(200);
    const mail = db.send.mock.calls[0][0];
    expect(mail.email).toBe("asha@example.com");
    const code = /(\d{6})/.exec(mail.message)?.[1] as string;
    expect(code).toHaveLength(6);
    const stored = db.createOtp.mock.calls[0][0].data;
    expect(stored.phone).toBe("email:asha@example.com");
    expect(stored.otpHash).toBe(hashOtp(code));
    expect(JSON.stringify(stored)).not.toContain(code);
  });

  it("stops older unused codes from working when a new one is asked for", async () => {
    await sendRoute(req({ email: "asha@example.com" }));
    expect(db.updateManyOtp).toHaveBeenCalledWith(expect.objectContaining({ where: { phone: "email:asha@example.com", consumedAt: null } }));
  });

  it("refuses a bad email, and a flood from one network or for one address", async () => {
    expect((await sendRoute(req({ email: "nope" }))).status).toBe(400);
    db.rate.mockResolvedValueOnce({ allowed: false, retryAfterSeconds: 30 });
    expect((await sendRoute(req({ email: "a@example.com" }))).status).toBe(429);
    db.rate.mockResolvedValueOnce({ allowed: true }).mockResolvedValueOnce({ allowed: false, retryAfterSeconds: 30 });
    expect((await sendRoute(req({ email: "a@example.com" }))).status).toBe(429);
    expect(db.send).not.toHaveBeenCalled();
  });

  it("answers the same for an address with no account, and sends no code for an administrator", async () => {
    db.findUser.mockResolvedValue({ role: "ADMIN" });
    const admin = await sendRoute(req({ email: "admin@example.com" }));
    expect(admin.status).toBe(200);
    expect(db.send).not.toHaveBeenCalled();
    expect(db.createOtp).not.toHaveBeenCalled();
  });

  it("says so plainly when the email cannot be sent (for example SMTP is not set up)", async () => {
    db.send.mockResolvedValue({ emailSent: false, skipped: "SMTP is not configured" });
    const res = await sendRoute(req({ email: "a@example.com" }));
    expect(res.status).toBe(503);
    expect((await res.json()).error).toMatch(/mobile OTP or password/);
  });
});

describe("email sign-in code: signing in", () => {
  const record = (code: string, over: Record<string, unknown> = {}) => ({ id: "r1", otpHash: hashOtp(code), attempts: 0, expiresAt: new Date(Date.now() + 60000), ...over });
  const user = (over: Record<string, unknown> = {}) => ({ id: "u1", name: "Asha", email: "asha@example.com", phone: null, role: "USER", emailVerified: new Date(), ...over });

  it("signs in an existing customer with the right code and uses the code up", async () => {
    db.findOtp.mockResolvedValue(record("123456"));
    db.findUser.mockResolvedValue(user());
    const out = await loginWithEmailOtp({ email: "Asha@Example.com", otp: "123456", portal: "user" });
    expect(out).toMatchObject({ id: "u1", role: "USER" });
    expect(db.findOtp).toHaveBeenCalledWith(expect.objectContaining({ where: { phone: "email:asha@example.com", consumedAt: null } }));
    expect(db.updateOtp).toHaveBeenCalledWith({ where: { id: "r1" }, data: { consumedAt: expect.any(Date) } });
    expect(db.reset).toHaveBeenCalledWith("OTP_EMAIL", "asha@example.com");
  });

  it("creates a customer account for a new email, already marked as verified", async () => {
    db.findOtp.mockResolvedValue(record("123456"));
    db.findUser.mockResolvedValue(null);
    db.createUser.mockResolvedValue(user({ id: "new", name: "newbie", email: "newbie@example.com" }));
    await loginWithEmailOtp({ email: "newbie@example.com", otp: "123456", portal: "user" });
    expect(db.createUser).toHaveBeenCalledWith({ data: expect.objectContaining({ email: "newbie@example.com", role: "USER", emailVerified: expect.any(Date) }) });
  });

  it("marks an existing but unverified email as verified", async () => {
    db.findOtp.mockResolvedValue(record("123456"));
    db.findUser.mockResolvedValue(user({ emailVerified: null }));
    db.updateUser.mockResolvedValue(user());
    await loginWithEmailOtp({ email: "asha@example.com", otp: "123456", portal: "user" });
    expect(db.updateUser).toHaveBeenCalled();
  });

  it("counts a wrong code and refuses it", async () => {
    db.findOtp.mockResolvedValue(record("123456"));
    await expect(loginWithEmailOtp({ email: "asha@example.com", otp: "000000", portal: "user" })).rejects.toThrow(/Incorrect OTP/);
    expect(db.updateOtp).toHaveBeenCalledWith({ where: { id: "r1" }, data: { attempts: { increment: 1 } } });
    expect(db.findUser).not.toHaveBeenCalled();
  });

  it("refuses an expired code, a used-up code, too many tries and a badly formed request", async () => {
    db.findOtp.mockResolvedValueOnce(record("123456", { expiresAt: new Date(Date.now() - 1000) }));
    await expect(loginWithEmailOtp({ email: "a@example.com", otp: "123456" })).rejects.toThrow(/expired/);
    db.findOtp.mockResolvedValueOnce(null);
    await expect(loginWithEmailOtp({ email: "a@example.com", otp: "123456" })).rejects.toThrow(/No active OTP/);
    db.findOtp.mockResolvedValueOnce(record("123456", { attempts: 3 }));
    await expect(loginWithEmailOtp({ email: "a@example.com", otp: "123456" })).rejects.toThrow(/Maximum attempts/);
    await expect(loginWithEmailOtp({ email: "bad", otp: "123456" })).rejects.toThrow(/Invalid email/);
  });

  it("never signs an administrator or associate into the customer portal, and needs an existing associate for that portal", async () => {
    db.findOtp.mockResolvedValue(record("123456"));
    db.findUser.mockResolvedValue(user({ role: "ADMIN" }));
    await expect(loginWithEmailOtp({ email: "admin@example.com", otp: "123456", portal: "user" })).rejects.toThrow(/cannot sign in on this page/);
    db.findUser.mockResolvedValue(null);
    await expect(loginWithEmailOtp({ email: "x@example.com", otp: "123456", portal: "associate" })).rejects.toThrow(/No Associate account/);
    expect(db.createUser).not.toHaveBeenCalled();
  });
});
