import * as crypto from "crypto";

export const MAX_OTP_ATTEMPTS = 3;
export const OTP_VALIDITY_MINUTES = 10;
export const MAX_HOURLY_PHONE_REQUESTS = 5;
export const MAX_HOURLY_IP_REQUESTS = 10;

// In-memory sliding window rate-limiter for IP addresses and phones
export interface RateRecord {
  timestamps: number[];
  lockedUntil?: number;
}

const ipRateMap = new Map<string, RateRecord>();
const phoneRateMap = new Map<string, RateRecord>();

/**
 * Codes sent by email are kept in the same table as mobile codes, under this key in place of the
 * phone number ("email:" can never be a phone number, so the two cannot be mixed up).
 */
export function emailOtpKey(email: string): string {
  return `email:${email.trim().toLowerCase()}`;
}

/**
 * Generates a cryptographically secure 6-digit numeric OTP string.
 */
export function generateNumericOtp(digits = 6): string {
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  const num = crypto.randomInt(min, max + 1);
  return num.toString();
}

/**
 * Hashes an OTP with SHA-256 before database storage.
 */
export function hashOtp(otp: string): string {
  return crypto.createHash("sha256").update(otp.trim()).digest("hex");
}

/**
 * Timing-safe comparison of provided OTP against stored hash.
 */
export function verifyOtpHash(otp: string, storedHash: string): boolean {
  const candidateHash = hashOtp(otp);
  if (candidateHash.length !== storedHash.length) {
    return false;
  }
  return crypto.timingSafeEqual(
    Buffer.from(candidateHash, "utf-8"),
    Buffer.from(storedHash, "utf-8")
  );
}

/**
 * Checks if OTP expiration timestamp has passed.
 */
export function isOtpExpired(expiresAt: Date, now: Date = new Date()): boolean {
  return now.getTime() > expiresAt.getTime();
}

/**
 * Checks whether further attempts are allowed on an OTP record.
 */
export function canAttemptOtpVerification(
  currentAttempts: number,
  maxAttempts: number = MAX_OTP_ATTEMPTS
): boolean {
  return currentAttempts < maxAttempts;
}

/**
 * Generic sliding window rate limiter check.
 */
export function checkSlidingWindowRateLimit(
  record: RateRecord | undefined,
  now: number,
  windowMs: number,
  maxLimit: number
): { isAllowed: boolean; retryAfterSeconds?: number; updatedRecord: RateRecord } {
  const currentRecord: RateRecord = record ? { ...record } : { timestamps: [] };

  // Check lockout
  if (currentRecord.lockedUntil && currentRecord.lockedUntil > now) {
    const retryAfter = Math.ceil((currentRecord.lockedUntil - now) / 1000);
    return { isAllowed: false, retryAfterSeconds: retryAfter, updatedRecord: currentRecord };
  }

  // Filter timestamps within window
  const windowStart = now - windowMs;
  const activeTimestamps = currentRecord.timestamps.filter((ts) => ts > windowStart);

  if (activeTimestamps.length >= maxLimit) {
    const oldestTimestamp = activeTimestamps[0];
    const retryAfter = Math.ceil((oldestTimestamp + windowMs - now) / 1000);
    currentRecord.lockedUntil = now + Math.max(retryAfter * 1000, 15 * 60 * 1000);
    return { isAllowed: false, retryAfterSeconds: retryAfter, updatedRecord: currentRecord };
  }

  activeTimestamps.push(now);
  currentRecord.timestamps = activeTimestamps;
  currentRecord.lockedUntil = undefined;

  return { isAllowed: true, updatedRecord: currentRecord };
}

/**
 * Rate-limiting check based on count within a window.
 */
export function isOtpSendRateLimited(
  requestsInLastHour: number,
  maxAllowed: number = MAX_HOURLY_PHONE_REQUESTS
): boolean {
  return requestsInLastHour >= maxAllowed;
}

/**
 * Rate limit check for Phone.
 */
export function checkPhoneRateLimit(
  phone: string,
  now: number = Date.now()
): { isAllowed: boolean; retryAfterSeconds?: number } {
  const windowMs = 60 * 60 * 1000; // 1 hour
  const res = checkSlidingWindowRateLimit(
    phoneRateMap.get(phone),
    now,
    windowMs,
    MAX_HOURLY_PHONE_REQUESTS
  );
  phoneRateMap.set(phone, res.updatedRecord);
  return { isAllowed: res.isAllowed, retryAfterSeconds: res.retryAfterSeconds };
}

/**
 * Rate limit check for IP address.
 */
export function checkIpRateLimit(
  ip: string,
  now: number = Date.now()
): { isAllowed: boolean; retryAfterSeconds?: number } {
  const windowMs = 60 * 60 * 1000; // 1 hour
  const res = checkSlidingWindowRateLimit(
    ipRateMap.get(ip),
    now,
    windowMs,
    MAX_HOURLY_IP_REQUESTS
  );
  ipRateMap.set(ip, res.updatedRecord);
  return { isAllowed: res.isAllowed, retryAfterSeconds: res.retryAfterSeconds };
}

/**
 * Clear rate limit maps (useful for tests).
 */
export function resetRateLimits(): void {
  ipRateMap.clear();
  phoneRateMap.clear();
}

/**
 * Securely delivers/logs OTP.
 * In development: logs to console for developer testing.
 * In production: NEVER logs the OTP.
 */
export function deliverOtp(phone: string, otp: string): void {
  if (process.env.NODE_ENV === "production") {
    // Stub for SMS gateway integration; never log credentials in production
    return;
  }
  console.log(`\n[DEV OTP STUB] Mobile: ${phone} | OTP: ${otp}\n`);
}
