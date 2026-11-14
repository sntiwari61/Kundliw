import { NextResponse } from "next/server";
import { guardApiUser } from "@/lib/auth/guards";
import { listVaultFor } from "@/lib/mobile/vaultTickets";

export const dynamic = "force-dynamic";

/** The signed-in person's own Vault files. Opening one uses the existing GET /api/vault/{id}. */
export async function GET() {
  const guard = await guardApiUser();
  if (!guard.ok) return guard.errorResponse;
  return NextResponse.json({ files: await listVaultFor(guard.user.id) }, { headers: { "Cache-Control": "no-store" } });
}
