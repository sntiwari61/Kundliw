import { validateRegister } from "../validation";
import { canRequestPayout, commissionTone, isValidReferralCode, referralLink, type AssociateSummary } from "../associate";
import { ticketTone, validateTicket, type TicketForm } from "../tickets";
import { MAX_UPLOAD_BYTES, formatSize, iconFor, safeFileName } from "../vault";
import { familyFor } from "../../components/Text";

const ticket = (over: Partial<TicketForm> = {}): TicketForm => ({
  subject: "Order help",
  message: "My order has not arrived",
  orderNumber: "",
  contactName: "Ram Kumar",
  contactEmail: "ram@example.com",
  contactPhone: "+91 98765 43210",
  contactAddress: "Kachru Nagar, Bhilai",
  ...over,
});

describe("validateTicket", () => {
  it("accepts a complete ticket", () => expect(validateTicket(ticket())).toEqual({}));
  it("lists every problem", () => {
    const e = validateTicket(ticket({ subject: "a", message: "hi", contactName: "", contactEmail: "x", contactPhone: "12", contactAddress: "abc" }));
    expect(Object.keys(e).sort()).toEqual(["contactAddress", "contactEmail", "contactName", "contactPhone", "message", "subject"]);
  });
  it("matches the server's phone pattern", () => {
    expect(validateTicket(ticket({ contactPhone: "9876543210" }))).toEqual({});
    expect(validateTicket(ticket({ contactPhone: "abc12345" })).contactPhone).toBe("errPhoneAny");
  });
  it("the order number stays optional", () => expect(validateTicket(ticket({ orderNumber: "" }))).toEqual({}));
});

describe("ticketTone", () => {
  it("colours each status", () => {
    expect(ticketTone("OPEN")).toBe("warning");
    expect(ticketTone("IN_PROGRESS")).toBe("brand");
    expect(ticketTone("RESOLVED")).toBe("success");
    expect(ticketTone("???")).toBe("neutral");
  });
});

describe("associate helpers", () => {
  const summary = (over: Partial<AssociateSummary["earnings"]> = {}, status: AssociateSummary["profile"]["status"] = "APPROVED"): AssociateSummary => ({
    profile: { status, referralCode: "DEMO2026", rejectionReason: null },
    earnings: { pendingPaise: 0, availablePaise: 15000, requestedPaise: 0, paidPaise: 0, referredOrders: 1, ...over },
    commissions: [],
    payouts: [],
  });

  it("builds the share link", () => {
    expect(referralLink("https://maharshikanadjyotishkendra.com/", "DEMO2026")).toBe("https://maharshikanadjyotishkendra.com/r/DEMO2026");
  });
  it("validates a referral code like the server: 6 to 16 letters or numbers", () => {
    expect(isValidReferralCode("DEMO2026")).toBe(true);
    expect(isValidReferralCode("abc")).toBe(false);
    expect(isValidReferralCode("has space1")).toBe(false);
    expect(isValidReferralCode("A".repeat(17))).toBe(false);
  });
  it("allows a payout only when approved, something is available and no request waits", () => {
    expect(canRequestPayout(summary())).toBe(true);
    expect(canRequestPayout(summary({ availablePaise: 0 }))).toBe(false);
    expect(canRequestPayout(summary({ requestedPaise: 5000 }))).toBe(false);
    expect(canRequestPayout(summary({}, "PENDING"))).toBe(false);
    expect(canRequestPayout(summary({}, "SUSPENDED"))).toBe(false);
  });
  it("colours commission statuses", () => {
    expect(commissionTone("PAID")).toBe("success");
    expect(commissionTone("CANCELLED")).toBe("error");
    expect(commissionTone("PENDING")).toBe("warning");
  });
});

describe("vault helpers", () => {
  it("formats sizes", () => {
    expect(formatSize(10)).toBe("1 KB");
    expect(formatSize(340 * 1024)).toBe("340 KB");
    expect(formatSize(1.5 * 1024 * 1024)).toBe("1.5 MB");
  });
  it("keeps the same 4 MB limit as the server", () => expect(MAX_UPLOAD_BYTES).toBe(4 * 1024 * 1024));
  it("makes a safe cache file name that cannot climb out of the folder", () => {
    const name = safeFileName("abc", "../../evil name?.pdf");
    expect(name).not.toMatch(/[\\/?]/);
    expect(name.startsWith("abc-")).toBe(true);
    expect(name.endsWith(".pdf")).toBe(true);
  });
  it("picks an icon for the file type", () => {
    expect(iconFor("application/pdf")).toBe("document-text");
    expect(iconFor("image/png")).toBe("image");
    expect(iconFor("video/mp4")).toBe("videocam");
    expect(iconFor("application/msword")).toBe("document");
  });
});

describe("font weights", () => {
  it("picks the Poppins file for the weight", () => {
    expect(familyFor("700")).toBe("Poppins_700Bold");
    expect(familyFor("600")).toBe("Poppins_600SemiBold");
    expect(familyFor("500")).toBe("Poppins_500Medium");
    expect(familyFor(undefined)).toBe("Poppins_400Regular");
    expect(familyFor("700", true)).toBe("CormorantGaramond_700Bold");
  });
});

describe("validateRegister", () => {
  const ok = { name: "Ram Kumar", phone: "9876543210", email: "ram@example.com", password: "", adult: true, associate: false };
  it("accepts a user without a password", () => expect(validateRegister(ok)).toEqual({}));
  it("needs 8 characters for an associate, or when a password is typed", () => {
    expect(validateRegister({ ...ok, associate: true }).password).toBe("errPasswordShort");
    expect(validateRegister({ ...ok, password: "short" }).password).toBe("errPasswordShort");
    expect(validateRegister({ ...ok, associate: true, password: "longenough" })).toEqual({});
  });
  it("lists every faulty field", () => {
    expect(Object.keys(validateRegister({ name: "a", phone: "12", email: "x", password: "", adult: false, associate: false })).sort()).toEqual(["adult", "email", "name", "phone"]);
  });
});
