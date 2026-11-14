import { NextRequest, NextResponse } from "next/server";
import { guardApiUser } from "@/lib/auth/guards";
import { getOrderFor } from "@/lib/mobile/orders";

export const dynamic = "force-dynamic";

/** One of the signed-in customer's own orders. Someone else's order answers "not found". */
export async function GET(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await guardApiUser();
  if (!guard.ok) return guard.errorResponse;
  const { id } = await ctx.params;
  const order = await getOrderFor(guard.user.id, id);
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  return NextResponse.json({ order }, { headers: { "Cache-Control": "no-store" } });
}
