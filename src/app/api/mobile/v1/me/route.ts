import { NextRequest, NextResponse } from "next/server";
import { guardApiUser } from "@/lib/auth/guards";
import { validateCsrfOrigin } from "@/lib/auth/csrf";
import { toUserDto } from "@/lib/mobile/session";
import { ProfileError, profileInputSchema, updateProfile } from "@/lib/mobile/profile";

export const dynamic = "force-dynamic";

/** The signed-in account (works with the app's Bearer token). */
export async function GET() {
  const guard = await guardApiUser();
  if (!guard.ok) return guard.errorResponse;
  const user = await toUserDto(guard.user.id);
  if (!user) return NextResponse.json({ error: "Account not found." }, { status: 401 });
  return NextResponse.json({ user }, { headers: { "Cache-Control": "no-store" } });
}

/** The customer changes their own name or email. */
export async function PATCH(request: NextRequest) {
  const guard = await guardApiUser();
  if (!guard.ok) return guard.errorResponse;
  const csrf = validateCsrfOrigin(request);
  if (!csrf.isValid) return csrf.errorResponse;
  const parsed = profileInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please check your details." }, { status: 400 });
  try {
    const user = await updateProfile(guard.user.id, parsed.data);
    return NextResponse.json({ user }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    if (e instanceof ProfileError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("Profile update failed:", e);
    return NextResponse.json({ error: "Could not save your details." }, { status: 500 });
  }
}
