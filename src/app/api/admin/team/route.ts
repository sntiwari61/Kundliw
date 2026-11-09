import { NextRequest, NextResponse } from "next/server";
import { guardApiAdmin } from "@/lib/auth/guards";
import { validateCsrfOrigin } from "@/lib/auth/csrf";
import { prisma } from "@/lib/prisma";
import { teamSchema } from "@/lib/validation/teamSchema";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await guardApiAdmin();
  if (!guard.ok) return guard.errorResponse;
  try {
    const members = await prisma.teamMember.findMany({ orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }, { id: "asc" }] });
    return NextResponse.json({ success: true, members });
  } catch (error) {
    console.error("Failed to fetch team:", error);
    return NextResponse.json({ error: "Failed to fetch team" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const guard = await guardApiAdmin();
  if (!guard.ok) return guard.errorResponse;
  const csrf = validateCsrfOrigin(request);
  if (!csrf.isValid) return csrf.errorResponse;
  try {
    const parsed = teamSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }
    const member = await prisma.teamMember.create({ data: parsed.data });
    return NextResponse.json({ success: true, member }, { status: 201 });
  } catch (error) {
    console.error("Failed to add team member:", error);
    return NextResponse.json({ error: "Failed to add team member" }, { status: 500 });
  }
}
