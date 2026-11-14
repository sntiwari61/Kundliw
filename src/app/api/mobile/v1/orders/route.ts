import { NextResponse } from "next/server";
import { guardApiUser } from "@/lib/auth/guards";
import { listOrdersFor } from "@/lib/mobile/orders";

export const dynamic = "force-dynamic";

/** The signed-in customer's own orders, newest first. */
export async function GET() {
  const guard = await guardApiUser();
  if (!guard.ok) return guard.errorResponse;
  const orders = await listOrdersFor(guard.user.id);
  return NextResponse.json({ orders }, { headers: { "Cache-Control": "no-store" } });
}
