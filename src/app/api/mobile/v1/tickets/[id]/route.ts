import { NextRequest, NextResponse } from "next/server";
import { guardApiUser } from "@/lib/auth/guards";
import { getTicketFor } from "@/lib/mobile/vaultTickets";

export const dynamic = "force-dynamic";

/** One of the person's own tickets with its messages. Someone else's ticket answers "not found". Replying uses POST /api/tickets/{id}. */
export async function GET(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await guardApiUser();
  if (!guard.ok) return guard.errorResponse;
  const { id } = await ctx.params;
  const ticket = await getTicketFor(guard.user.id, id);
  if (!ticket) return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
  return NextResponse.json({ ticket }, { headers: { "Cache-Control": "no-store" } });
}
