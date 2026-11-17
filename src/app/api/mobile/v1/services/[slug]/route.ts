import { NextRequest, NextResponse } from "next/server";
import { getServiceDetail } from "@/lib/mobile/services";

export const dynamic = "force-dynamic";

/** The full page of one service: description, highlights, plans with their features, packages and demos. Public. */
export async function GET(_request: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const service = await getServiceDetail(slug);
  if (!service) return NextResponse.json({ error: "Service not found." }, { status: 404 });
  return NextResponse.json(service, { headers: { "Cache-Control": "no-store" } });
}
