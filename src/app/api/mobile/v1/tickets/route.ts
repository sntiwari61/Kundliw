import { NextResponse } from "next/server";
import { guardApiUser } from "@/lib/auth/guards";
import { listTicketsFor } from "@/lib/mobile/vaultTickets";

export const dynamic = "force-dynamic";

/** The signed-in person's own support tickets. Raising one uses the existing POST /api/tickets. */
export async function GET() {
  const guard = await guardApiUser();
  if (!guard.ok) return guard.errorResponse;
  return NextResponse.json({ tickets: await listTicketsFor(guard.user.id) }, { headers: { "Cache-Control": "no-store" } });
}
