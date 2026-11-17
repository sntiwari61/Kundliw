import { NextRequest, NextResponse } from "next/server";
import { getOtherServiceDetail } from "@/lib/mobile/services";

export const dynamic = "force-dynamic";

/** One card of the Other services page with its programme, dates and links. Public. */
export async function GET(_request: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const detail = await getOtherServiceDetail(slug);
  if (!detail) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json(detail, { headers: { "Cache-Control": "no-store" } });
}
