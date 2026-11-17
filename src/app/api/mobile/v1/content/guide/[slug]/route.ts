import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/guards";
import { getGuide, isAppGuide } from "@/lib/mobile/guides";

export const dynamic = "force-dynamic";

/** A guide for the app. The user guide is public; the associate guide is for associates and administrators. */
export async function GET(_request: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  if (!isAppGuide(slug)) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (slug === "associate") {
    const user = await getCurrentUser();
    if (user?.role !== Role.ASSOCIATE && user?.role !== Role.ADMIN) return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  return NextResponse.json(await getGuide(slug), { headers: { "Cache-Control": "no-store" } });
}
