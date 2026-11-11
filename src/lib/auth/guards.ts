import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "./authOptions";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { bearerFrom, passwordFingerprint, verifyMobileToken } from "@/lib/mobile/token";

export interface AuthenticatedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  role: Role;
}

/**
 * Returns currently authenticated user by validating session and re-verifying against database.
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  // The mobile app sends "Authorization: Bearer <access token>"; the website uses its session cookie.
  let bearer: string | null = null;
  try {
    bearer = bearerFrom((await headers()).get("authorization"));
  } catch {
    bearer = null; // outside a request
  }
  if (bearer) return getMobileUser(bearer);

  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return null;
  }

  // Re-read active user record from database to prevent stale JWT privilege escalation
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
    },
  });

  if (!dbUser) {
    return null;
  }

  return dbUser as AuthenticatedUser;
}

/** The account behind a mobile access token, read fresh from the database (role and password are never trusted from the token). */
async function getMobileUser(token: string): Promise<AuthenticatedUser | null> {
  const verified = await verifyMobileToken(token, "mobile-access");
  if (!verified) return null;
  const dbUser = await prisma.user.findUnique({
    where: { id: verified.userId },
    select: { id: true, name: true, email: true, phone: true, role: true, passwordHash: true },
  });
  if (!dbUser || passwordFingerprint(dbUser.passwordHash) !== verified.pw) return null;
  const { passwordHash: _unused, ...user } = dbUser;
  void _unused;
  return user as AuthenticatedUser;
}

/**
 * Server Component / Server Action guard requiring an authenticated user.
 * Redirects to localized sign-in if unauthenticated.
 */
export async function requireUser(
  callbackUrl?: string,
  locale = "hi"
): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) {
    const signInPath = `/${locale}/auth/signin${
      callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""
    }`;
    redirect(signInPath);
  }
  return user;
}

/**
 * Server Component / Server Action guard requiring ADMIN role.
 * Re-reads user role from database, never trusting JWT claim alone.
 */
export async function requireAdmin(
  callbackUrl?: string,
  locale = "hi"
): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user || user.role !== Role.ADMIN) {
    const signInPath = `/${locale}/auth/signin${
      callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""
    }`;
    redirect(signInPath);
  }
  return user;
}

/**
 * Discriminated union result for API route guards.
 *
 * Callers MUST narrow on `ok` before accessing `user`:
 *   const guard = await guardApiAdmin();
 *   if (!guard.ok) return guard.errorResponse;
 *   const admin = guard.user;
 *
 * The `ok` discriminant intentionally makes the success branch incompatible
 * with an `errorResponse` property, so TypeScript rejects the old
 * `if (!guard)` truthiness check that silently allowed every request through.
 */
export type ApiUserGuardResult =
  | { ok: true; user: AuthenticatedUser }
  | { ok: false; errorResponse: NextResponse };

export type ApiAdminGuardResult = ApiUserGuardResult;

/**
 * Route handler guard for APIs requiring an authenticated user.
 */
export async function guardApiUser(): Promise<ApiUserGuardResult> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      ok: false,
      errorResponse: NextResponse.json(
        { error: "Authentication required to access this resource." },
        { status: 401 }
      ),
    };
  }
  return { ok: true, user };
}

/**
 * Route handler guard for APIs requiring ADMIN role.
 * Re-reads user role directly from database.
 */
export async function guardApiAdmin(): Promise<ApiAdminGuardResult> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      ok: false,
      errorResponse: NextResponse.json(
        { error: "Authentication required to access this resource." },
        { status: 401 }
      ),
    };
  }
  if (user.role !== Role.ADMIN) {
    return {
      ok: false,
      errorResponse: NextResponse.json(
        { error: "Forbidden. Administrative privileges required." },
        { status: 403 }
      ),
    };
  }
  return { ok: true, user };
}

/**
 * Route handler guard for APIs used by associates (partners). Admins are not
 * associates, so they get 403 here.
 */
export async function guardApiAssociate(): Promise<ApiUserGuardResult> {
  const guard = await guardApiUser();
  if (!guard.ok) return guard;
  if (guard.user.role !== Role.ASSOCIATE) {
    return {
      ok: false,
      errorResponse: NextResponse.json(
        { error: "Forbidden. An associate account is required." },
        { status: 403 }
      ),
    };
  }
  return guard;
}
