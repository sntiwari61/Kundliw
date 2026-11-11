import { NextResponse } from "next/server";
import { guardApiUser } from "@/lib/auth/guards";
import { toUserDto } from "@/lib/mobile/session";

export const dynamic = "force-dynamic";

/** The signed-in account (works with the app's Bearer token). */
export async function GET() {
  const guard = await guardApiUser();
  if (!guard.ok) return guard.errorResponse;
  const user = await toUserDto(guard.user.id);
  if (!user) return NextResponse.json({ error: "Account not found." }, { status: 401 });
  return NextResponse.json({ user }, { headers: { "Cache-Control": "no-store" } });
}
