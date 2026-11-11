import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { passwordFingerprint, verifyMobileToken } from "@/lib/mobile/token";
import { signedInResponse } from "@/lib/mobile/session";
import { checkDbRateLimit, getClientIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

/** Swap a refresh token for a new pair of tokens. Body: { refreshToken }. */
export async function POST(request: NextRequest) {
  const limit = await checkDbRateLimit({ scope: "MOBILE_REFRESH_IP", identifier: getClientIp(request.headers), windowSeconds: 600, maxAllowed: 60 });
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests. Please try again shortly." }, { status: 429 });

  let body: { refreshToken?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const verified = await verifyMobileToken(typeof body.refreshToken === "string" ? body.refreshToken : null, "mobile-refresh");
  if (!verified) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: verified.userId }, select: { id: true, passwordHash: true } });
  if (!user || passwordFingerprint(user.passwordHash) !== verified.pw) {
    return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  }
  return signedInResponse(user.id);
}
