import { CANCELLATION_EN, GUIDELINES_EN, MEMBER_AGREEMENT_EN, PRIVACY_EN, REFUND_EN, RULES_EN, TERMS_EN } from "./defaultsEn";
import { CANCELLATION_HI, GUIDELINES_HI, MEMBER_AGREEMENT_HI, PRIVACY_HI, REFUND_HI, RULES_HI, TERMS_HI } from "./defaultsHi";

export interface LegalDefault {
  titleEn: string;
  titleHi: string;
  contentEn: string;
  contentHi: string;
}

/** The Kendra's legal pages. They are shown until the admin edits the page (Admin > Pages & legal). */
export const LEGAL_DEFAULTS: Record<string, LegalDefault> = {
  terms: { titleEn: "Terms & Conditions", titleHi: "नियम एवं शर्तें", contentEn: TERMS_EN, contentHi: TERMS_HI },
  privacy: { titleEn: "Privacy Policy", titleHi: "गोपनीयता नीति", contentEn: PRIVACY_EN, contentHi: PRIVACY_HI },
  refund: { titleEn: "Refund Policy", titleHi: "धनवापसी नीति", contentEn: REFUND_EN, contentHi: REFUND_HI },
  cancellation: { titleEn: "Cancellation Policy", titleHi: "रद्दीकरण नीति", contentEn: CANCELLATION_EN, contentHi: CANCELLATION_HI },
  "platform-guidelines": { titleEn: "Platform Guidelines", titleHi: "प्लेटफ़ॉर्म दिशानिर्देश", contentEn: GUIDELINES_EN, contentHi: GUIDELINES_HI },
  "member-agreement": { titleEn: "Member Agreement", titleHi: "सदस्य अनुबंध", contentEn: MEMBER_AGREEMENT_EN, contentHi: MEMBER_AGREEMENT_HI },
  "rules-regulations": { titleEn: "Rules & Regulations", titleHi: "नियम एवं विनियम", contentEn: RULES_EN, contentHi: RULES_HI },
};

export const LEGAL_DEFAULT_SLUGS = Object.keys(LEGAL_DEFAULTS);

/** The short placeholder texts the first database setup saved for three of these pages. They count as "not edited yet". */
const SEED_STUB_STARTS = [
  "All consultations and computational Janampatris",
  "Your birth coordinates, family Gotra",
  "Appointments may be rescheduled or cancelled up to 24 hours",
];

export function isSeedStub(contentEn: string | null | undefined): boolean {
  const t = (contentEn || "").trim();
  return !t || SEED_STUB_STARTS.some((s) => t.startsWith(s)) || /: content coming soon\.$/.test(t);
}

/** The text to show for a legal page: the admin's own text when edited, else the standard text. */
export function legalContentFor(slug: string, stored: { titleEn: string; titleHi: string; contentEn: string; contentHi: string } | null): LegalDefault | null {
  const def = LEGAL_DEFAULTS[slug];
  if (!def) return stored;
  if (!stored || isSeedStub(stored.contentEn)) return def;
  return stored;
}
