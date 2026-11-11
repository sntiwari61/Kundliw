import { NextRequest, NextResponse } from "next/server";
import { loginWithOtp } from "@/lib/auth/credentialLogin";
import { loginErrorStatus, signedInResponse } from "@/lib/mobile/session";

export const dynamic = "force-dynamic";

/**
 * Mobile app sign-in with a mobile OTP. Ask for the code first with POST /api/auth/otp/send { phone }.
 * Body: { phone, otp, portal: "user" | "associate" }.
 */
export async function POST(request: NextRequest) {
  let body: { phone?: unknown; otp?: unknown; portal?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  try {
    const user = await loginWithOtp({ phone: body.phone, otp: body.otp, portal: body.portal === "associate" ? "associate" : "user" });
    return await signedInResponse(user.id);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Sign-in failed.";
    return NextResponse.json({ error: message }, { status: loginErrorStatus(message) });
  }
}
