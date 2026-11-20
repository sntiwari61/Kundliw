import * as bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifyOtpHash, isOtpExpired, canAttemptOtpVerification, emailOtpKey } from "./otp";
import { verifyOtpSchema, verifyEmailOtpSchema, emailPasswordLoginSchema, emailSchema, phoneSchema } from "./validation";
import { checkDbRateLimit, resetDbRateLimit } from "@/lib/rateLimit";

/**
 * The two credential sign-ins (mobile OTP, and email or mobile with a password).
 * The website (NextAuth) and the mobile app API both call these, so both follow exactly the same rules,
 * rate limits and portal checks. They throw an Error whose message is safe to show to the person signing in.
 */

export const WRONG_PORTAL_MESSAGE =
  "This account cannot sign in on this page. Please use the correct login for your account type.";

export interface SignedInUser {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: Role;
}

const toSignedIn = (u: { id: string; name: string | null; email: string | null; phone: string | null; role: Role }): SignedInUser => ({
  id: u.id,
  name: u.name,
  email: u.email,
  phone: u.phone,
  role: u.role,
});

/**
 * Checks a one-time code against the latest unused one for this key (a phone number, or an email key)
 * and uses it up when it is right. Throws a message that is safe to show when it is not.
 */
async function consumeOtp(key: string, otp: string): Promise<void> {
  const record = await prisma.otpVerification.findFirst({
    where: { phone: key, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!record) {
    throw new Error("No active OTP found. Please request a new OTP.");
  }

  if (isOtpExpired(record.expiresAt)) {
    throw new Error("OTP has expired. Please request a new OTP.");
  }

  if (!canAttemptOtpVerification(record.attempts)) {
    throw new Error("Maximum attempts exceeded. Please request a new OTP.");
  }

  const isMatch = verifyOtpHash(otp, record.otpHash);
  if (!isMatch) {
    await prisma.otpVerification.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    throw new Error("Incorrect OTP. Please try again.");
  }

  await prisma.otpVerification.update({
    where: { id: record.id },
    data: { consumedAt: new Date() },
  });
}

/** Sign in with a code sent to an email address. The same rules as the mobile OTP: User and Associate portals only. */
export async function loginWithEmailOtp(credentials: { email?: unknown; otp?: unknown; portal?: unknown } | undefined): Promise<SignedInUser> {
  const parsed = verifyEmailOtpSchema.safeParse(credentials);
  if (!parsed.success) {
    throw new Error("Invalid email or OTP format");
  }

  const portal = credentials?.portal === "associate" ? "associate" : "user";
  const { email, otp } = parsed.data;

  await consumeOtp(emailOtpKey(email), otp);
  await resetDbRateLimit("OTP_EMAIL", email);

  let user = await prisma.user.findUnique({ where: { email } });
  const expectedRole = portal === "associate" ? Role.ASSOCIATE : Role.USER;
  if (user && user.role !== expectedRole) {
    throw new Error(WRONG_PORTAL_MESSAGE);
  }
  if (!user && portal === "associate") {
    throw new Error("No Associate account found. Please register as an Associate first.");
  }
  if (!user) {
    user = await prisma.user.create({
      data: { email, name: email.split("@")[0], role: Role.USER, emailVerified: new Date() },
    });
  } else if (!user.emailVerified) {
    // Receiving the code proves the address is theirs
    user = await prisma.user.update({ where: { id: user.id }, data: { emailVerified: new Date() } });
  }

  return toSignedIn(user);
}

/** Mobile OTP sign-in for the User and Associate portals (Super Admin never uses OTP). */
export async function loginWithOtp(credentials: { phone?: unknown; otp?: unknown; portal?: unknown } | undefined): Promise<SignedInUser> {
  const parsed = verifyOtpSchema.safeParse(credentials);
  if (!parsed.success) {
    throw new Error("Invalid mobile number or OTP format");
  }

  const portal = credentials?.portal === "associate" ? "associate" : "user";
  const { phone, otp } = parsed.data;

  await consumeOtp(phone, otp);

  // Reset rate limits on success
  await resetDbRateLimit("OTP_PHONE", phone);

  let user = await prisma.user.findUnique({ where: { phone } });
  const expectedRole = portal === "associate" ? Role.ASSOCIATE : Role.USER;
  if (user && user.role !== expectedRole) {
    throw new Error(WRONG_PORTAL_MESSAGE);
  }
  if (!user && portal === "associate") {
    throw new Error("No Associate account found. Please register as an Associate first.");
  }
  if (!user) {
    user = await prisma.user.create({
      data: { phone, name: `Customer ${phone.slice(-4)}`, role: Role.USER },
    });
  }

  return toSignedIn(user);
}

/** Email (or mobile number) and password sign-in. The account's role must match the portal used. */
export async function loginWithPassword(
  credentials: { email?: unknown; password?: unknown; portal?: unknown } | undefined,
  clientIp: string,
): Promise<SignedInUser> {
  const parsed = emailPasswordLoginSchema.safeParse(credentials);
  if (!parsed.success) {
    throw new Error("Invalid email or password format");
  }

  const portalName = credentials?.portal;
  const requiredRole = portalName === "associate" ? Role.ASSOCIATE : portalName === "user" ? Role.USER : Role.ADMIN;

  // The sign-in name is an email address or a mobile number.
  const rawId = parsed.data.email;
  let email: string;
  let lookup: { email: string } | { phone: string };
  if (rawId.includes("@")) {
    const checked = emailSchema.safeParse(rawId);
    if (!checked.success) throw new Error("Invalid email or password format");
    email = checked.data;
    lookup = { email };
  } else {
    const checked = phoneSchema.safeParse(rawId);
    if (!checked.success) throw new Error("Invalid email or password format");
    email = checked.data;
    lookup = { phone: checked.data };
  }
  const password = parsed.data.password;

  // 1. Rate limit by IP (max 10 attempts per 15 minutes)
  const ipRate = await checkDbRateLimit({
    scope: "ADMIN_LOGIN_IP",
    identifier: clientIp,
    windowSeconds: 15 * 60,
    maxAllowed: 10,
  });
  if (!ipRate.allowed) {
    throw new Error(`Too many login attempts from this network. Retry in ${ipRate.retryAfterSeconds} seconds.`);
  }

  // 2. Rate limit by email (max 5 failed attempts per 15 minutes)
  const emailRate = await checkDbRateLimit({
    scope: "ADMIN_LOGIN_EMAIL",
    identifier: email,
    windowSeconds: 15 * 60,
    maxAllowed: 5,
  });
  if (!emailRate.allowed) {
    throw new Error(`Account locked due to consecutive failed attempts. Retry in ${emailRate.retryAfterSeconds} seconds.`);
  }

  const user = await prisma.user.findUnique({ where: lookup });
  if (!user || !user.passwordHash) {
    throw new Error("Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  // Role gate runs only after the password is verified, so it cannot be used
  // to probe which emails belong to which role.
  if (user.role !== requiredRole) {
    throw new Error(WRONG_PORTAL_MESSAGE);
  }

  // Success: clear rate limits for both email and IP
  await resetDbRateLimit("ADMIN_LOGIN_EMAIL", email);
  await resetDbRateLimit("ADMIN_LOGIN_IP", clientIp);

  return toSignedIn(user);
}
