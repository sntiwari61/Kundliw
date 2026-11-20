import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requestEmailOtpSchema } from "@/lib/auth/validation";
import { emailOtpKey, generateNumericOtp, hashOtp, OTP_VALIDITY_MINUTES } from "@/lib/auth/otp";
import { checkDbRateLimit, getClientIp } from "@/lib/rateLimit";
import { sendNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

/**
 * Sends a 6-digit sign-in code to an email address, using the SMTP details saved in Admin > API Keys.
 * The answer is the same whether or not an account exists for the address, so it cannot be used to find
 * out who has an account. Administrators never sign in with a code, so none is sent for their addresses.
 */
export async function POST(request: NextRequest) {
  try {
    const parsed = requestEmailOtpSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    const { email } = parsed.data;

    const ipLimit = await checkDbRateLimit({ scope: "OTP_EMAIL_IP", identifier: getClientIp(request.headers), windowSeconds: 3600, maxAllowed: 10 });
    if (!ipLimit.allowed) {
      return NextResponse.json({ error: `Too many requests from this network. Please retry in ${ipLimit.retryAfterSeconds} seconds.` }, { status: 429 });
    }
    const emailLimit = await checkDbRateLimit({ scope: "OTP_EMAIL", identifier: email, windowSeconds: 3600, maxAllowed: 5 });
    if (!emailLimit.allowed) {
      return NextResponse.json({ error: `Too many codes requested for this email. Please retry in ${emailLimit.retryAfterSeconds} seconds.` }, { status: 429 });
    }

    const ok = NextResponse.json({ success: true, message: "A verification code has been emailed to you." });

    const existing = await prisma.user.findUnique({ where: { email }, select: { role: true } });
    if (existing?.role === Role.ADMIN) return ok;

    const key = emailOtpKey(email);
    const otp = generateNumericOtp(6);
    // The earlier unused codes stop working as soon as a new one is asked for
    await prisma.otpVerification.updateMany({ where: { phone: key, consumedAt: null }, data: { consumedAt: new Date() } });
    await prisma.otpVerification.create({
      data: { phone: key, otpHash: hashOtp(otp), expiresAt: new Date(Date.now() + OTP_VALIDITY_MINUTES * 60 * 1000), attempts: 0 },
    });

    const sent = await sendNotification({
      email,
      subject: "Your sign-in code - Maharshi Kanad Jyotish Kendra",
      message: `Your verification code is ${otp}.\nIt is valid for ${OTP_VALIDITY_MINUTES} minutes. If you did not ask for it, you can ignore this email.`,
    });
    if (!sent.emailSent) {
      console.error("Email OTP could not be sent:", sent.skipped);
      return NextResponse.json(
        { error: "We could not send the email right now. Please sign in with your mobile OTP or password, or try again later." },
        { status: 503 },
      );
    }
    return ok;
  } catch (error) {
    console.error("Error in email OTP send route:", error);
    return NextResponse.json({ error: "Failed to send the code. Please try again." }, { status: 500 });
  }
}
