import { NextRequest, NextResponse } from "next/server";
import * as bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { guardApiUser } from "@/lib/auth/guards";
import { validateCsrfOrigin } from "@/lib/auth/csrf";
import { deleteAccount } from "@/lib/account/deletion";
import { checkDbRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

/**
 * Delete my account (website and mobile app). Body: { confirm: "DELETE", password? }.
 * An account that has a password must send it again, so a borrowed phone or browser cannot delete it.
 */
export async function POST(request: NextRequest) {
  const csrf = validateCsrfOrigin(request);
  if (!csrf.isValid) return csrf.errorResponse;
  const guard = await guardApiUser();
  if (!guard.ok) return guard.errorResponse;

  const limit = await checkDbRateLimit({ scope: "ACCOUNT_DELETE", identifier: guard.user.id, windowSeconds: 3600, maxAllowed: 5 });
  if (!limit.allowed) return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });

  let body: { confirm?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (body.confirm !== "DELETE") {
    return NextResponse.json({ error: "Type DELETE to confirm that you want to delete your account." }, { status: 400 });
  }

  const row = await prisma.user.findUnique({ where: { id: guard.user.id }, select: { passwordHash: true } });
  if (row?.passwordHash) {
    const ok = typeof body.password === "string" && body.password.length > 0 && (await bcrypt.compare(body.password, row.passwordHash));
    if (!ok) return NextResponse.json({ error: "The password is not correct." }, { status: 403 });
  }

  const result = await deleteAccount(guard.user.id);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true });
}
