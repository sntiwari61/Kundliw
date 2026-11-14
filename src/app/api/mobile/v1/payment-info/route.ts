import { NextResponse } from "next/server";
import { guardApiUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Where the customer sends the money: the UPI ID, QR code and bank details the admin has set. */
export async function GET() {
  const guard = await guardApiUser();
  if (!guard.ok) return guard.errorResponse;

  const s = await prisma.adminSettings.findUnique({
    where: { id: "default" },
    select: { upiVpa: true, qrCodeUrl: true, bankAccountName: true, bankAccountNumber: true, bankIfsc: true, bankName: true },
  });
  return NextResponse.json(
    {
      upiVpa: s?.upiVpa ?? null,
      qrCodeUrl: s?.qrCodeUrl ?? null,
      bankAccountName: s?.bankAccountName ?? null,
      bankAccountNumber: s?.bankAccountNumber ?? null,
      bankIfsc: s?.bankIfsc ?? null,
      bankName: s?.bankName ?? null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
