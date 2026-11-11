import { NextRequest, NextResponse } from "next/server";
import { loginWithPassword } from "@/lib/auth/credentialLogin";
import { getClientIp } from "@/lib/rateLimit";
import { loginErrorStatus, signedInResponse } from "@/lib/mobile/session";

export const dynamic = "force-dynamic";

/**
 * Mobile app sign-in with e-mail (or mobile number) and password.
 * Body: { identifier, password, portal: "user" | "associate" }. Super Admin does not sign in from the app.
 */
export async function POST(request: NextRequest) {
  let body: { identifier?: unknown; password?: unknown; portal?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const portal = body.portal === "associate" ? "associate" : body.portal === "user" ? "user" : null;
  if (!portal) return NextResponse.json({ error: "Choose the User or Associate sign-in." }, { status: 400 });
  try {
    const user = await loginWithPassword({ email: body.identifier, password: body.password, portal }, getClientIp(request.headers));
    return await signedInResponse(user.id);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Sign-in failed.";
    return NextResponse.json({ error: message }, { status: loginErrorStatus(message) });
  }
}
