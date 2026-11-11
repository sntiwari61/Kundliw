import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { issueMobileTokens } from "./token";

export interface MobileUserDto {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: Role;
  /** Only for Associates: the account status (PENDING, APPROVED, ...) */
  associateStatus?: string | null;
}

export async function toUserDto(userId: string): Promise<MobileUserDto | null> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, phone: true, role: true, associate: { select: { status: true } } },
  });
  if (!u) return null;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    ...(u.role === Role.ASSOCIATE ? { associateStatus: u.associate?.status ?? null } : {}),
  };
}

/** The answer to a successful sign-in or refresh: the account and a fresh pair of tokens. */
export async function signedInResponse(userId: string): Promise<NextResponse> {
  const full = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, passwordHash: true } });
  const user = await toUserDto(userId);
  if (!full || !user) return NextResponse.json({ error: "Account not found." }, { status: 401 });
  const tokens = await issueMobileTokens(full);
  return NextResponse.json({ user, ...tokens }, { headers: { "Cache-Control": "no-store" } });
}

/** Messages thrown by the shared sign-in code that mean "slow down" rather than "wrong details". */
export function loginErrorStatus(message: string): number {
  return /^(Too many|Account locked|Maximum attempts)/.test(message) ? 429 : 401;
}
