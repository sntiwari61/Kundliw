/** What GET /api/associate/summary sends for the signed-in Associate. */
export interface AssociateSummary {
  profile: { status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED"; referralCode: string; rejectionReason: string | null };
  earnings: { pendingPaise: number; availablePaise: number; requestedPaise: number; paidPaise: number; referredOrders: number };
  commissions: {
    id: string;
    amountPaise: number;
    status: "PENDING" | "EARNED" | "PAID" | "CANCELLED";
    createdAt: string;
    order: { orderNumber: string; service: { titleEn: string; titleHi: string } | null } | null;
  }[];
  payouts: { id: string; amountPaise: number; status: "REQUESTED" | "PAID" | "REJECTED"; createdAt: string; paymentReference: string | null }[];
}

/** The link an Associate shares; the website remembers the code when someone opens it. */
export function referralLink(baseUrl: string, code: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/r/${encodeURIComponent(code)}`;
}

/** The same rule the server applies to a referral code: 6 to 16 letters or numbers, no spaces or symbols. */
export function isValidReferralCode(value: string): boolean {
  return /^[A-Za-z0-9]{6,16}$/.test(value.trim());
}

export function commissionTone(status: string): "success" | "warning" | "error" | "neutral" | "brand" {
  if (status === "PAID") return "success";
  if (status === "EARNED") return "brand";
  if (status === "PENDING") return "warning";
  if (status === "CANCELLED") return "error";
  return "neutral";
}

/** An Associate can ask for a payout when something is available and no request is waiting. */
export function canRequestPayout(s: AssociateSummary): boolean {
  return s.profile.status === "APPROVED" && s.earnings.availablePaise > 0 && s.earnings.requestedPaise === 0;
}
