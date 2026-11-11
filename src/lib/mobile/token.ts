import { createHash } from "crypto";
import { encode, decode, type JWT } from "next-auth/jwt";

/**
 * Sign-in tokens for the mobile app. They are signed with the same secret as the website session
 * but carry a "typ" claim, and only a token with the right typ is accepted:
 *   access  - sent with every request as "Authorization: Bearer ...", valid 1 hour
 *   refresh - kept in the phone's secure storage and used only to get a new pair, valid 60 days
 * "pw" is a short fingerprint of the account's password hash, so changing or removing the password
 * (a reset, or deleting the account) ends every token issued before it. No database table is needed.
 */

export const ACCESS_TOKEN_SECONDS = 60 * 60;
export const REFRESH_TOKEN_SECONDS = 60 * 60 * 24 * 60;

export type MobileTokenType = "mobile-access" | "mobile-refresh";

export interface MobileTokenSubject {
  id: string;
  passwordHash?: string | null;
}

export function passwordFingerprint(passwordHash: string | null | undefined): string {
  if (!passwordHash) return "none";
  return createHash("sha256").update(passwordHash).digest("hex").slice(0, 12);
}

function secret(): string {
  const s = process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("NEXTAUTH_SECRET is not set");
  return s;
}

export async function issueMobileTokens(user: MobileTokenSubject) {
  const pw = passwordFingerprint(user.passwordHash);
  const [accessToken, refreshToken] = await Promise.all([
    encode({ token: { sub: user.id, typ: "mobile-access", pw } as unknown as JWT, secret: secret(), maxAge: ACCESS_TOKEN_SECONDS }),
    encode({ token: { sub: user.id, typ: "mobile-refresh", pw } as unknown as JWT, secret: secret(), maxAge: REFRESH_TOKEN_SECONDS }),
  ]);
  return { accessToken, refreshToken, expiresIn: ACCESS_TOKEN_SECONDS, tokenType: "Bearer" as const };
}

export interface VerifiedMobileToken {
  userId: string;
  pw: string;
}

/** The account a token belongs to, or null when the token is missing, forged, expired or of the wrong kind. */
export async function verifyMobileToken(token: string | null | undefined, type: MobileTokenType): Promise<VerifiedMobileToken | null> {
  if (!token || token.length > 4096) return null;
  try {
    const payload = await decode({ token, secret: secret() });
    if (!payload || payload.typ !== type || typeof payload.sub !== "string" || typeof payload.pw !== "string") return null;
    return { userId: payload.sub, pw: payload.pw };
  } catch {
    return null;
  }
}

/** The token in an "Authorization: Bearer <token>" header, or null. */
export function bearerFrom(header: string | null | undefined): string | null {
  if (!header) return null;
  const m = /^Bearer\s+(\S+)$/i.exec(header.trim());
  return m ? m[1] : null;
}
