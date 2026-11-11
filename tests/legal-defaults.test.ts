import { describe, expect, it } from "vitest";
import { LEGAL_DEFAULTS, LEGAL_DEFAULT_SLUGS, isSeedStub, legalContentFor } from "@/lib/legal/defaults";

describe("legal page defaults", () => {
  it("has English and Hindi text for every page the footer lists", () => {
    for (const slug of ["privacy", "terms", "refund", "cancellation", "platform-guidelines", "member-agreement", "rules-regulations"]) {
      const d = LEGAL_DEFAULTS[slug];
      expect(d, slug).toBeTruthy();
      expect(d.contentEn.length).toBeGreaterThan(1500);
      expect(d.contentHi.length).toBeGreaterThan(1500);
      expect(d.contentEn).toContain("Maharshi Kanad Jyotish Kendra");
      expect(d.contentHi).toContain("महर्षि कणाद ज्योतिष केंद्र");
    }
    expect(LEGAL_DEFAULT_SLUGS).toHaveLength(7);
  });

  it("never mentions the sister businesses as the operator", () => {
    for (const d of Object.values(LEGAL_DEFAULTS)) {
      expect(d.contentEn).not.toMatch(/privacy@bharatdarshan|refunds@bharatdarshan|info@vindhyavivahsanskar|75091 24672/);
    }
  });

  it("shows the standard text until the admin edits the page", () => {
    const stub = { titleEn: "t", titleHi: "t", contentEn: "All consultations and computational Janampatris are rendered...", contentHi: "x" };
    expect(isSeedStub(stub.contentEn)).toBe(true);
    expect(legalContentFor("terms", null)?.contentEn).toBe(LEGAL_DEFAULTS.terms.contentEn);
    expect(legalContentFor("terms", stub)?.contentEn).toBe(LEGAL_DEFAULTS.terms.contentEn);
    const edited = { titleEn: "My terms", titleHi: "मेरे", contentEn: "Edited by the admin.", contentHi: "बदला" };
    expect(legalContentFor("terms", edited)).toBe(edited);
    expect(legalContentFor("something-else", null)).toBeNull();
  });
});
