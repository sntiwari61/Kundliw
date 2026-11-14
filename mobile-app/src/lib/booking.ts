import { isValidPhone } from "./validation";

/**
 * The booking rules, the same ones the server checks (src/features/booking/validation.ts on the website).
 * The phone checks first so mistakes are caught without a round trip; the server still decides.
 */

export interface CatalogPlan {
  id: string;
  packageId: string | null;
  slug: string;
  titleEn: string;
  titleHi: string;
  pricePaise: number;
  originalPricePaise: number | null;
  deliveryDays: number | null;
  pages: number | null;
  hasCall: boolean;
  callDurationMinutes: number | null;
}

export interface CatalogService {
  slug: string;
  titleEn: string;
  titleHi: string;
  packages: { id: string; titleEn: string; titleHi: string }[];
  plans: CatalogPlan[];
}

export interface CatalogSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
}

export interface Catalog {
  services: CatalogService[];
  slots: CatalogSlot[];
  gstRateBasisPoints: number;
}

/** The services whose booking also needs the family details (the Kendra prepares a Kundli). */
export const KUNDLI_SERVICE_SLUGS = ["janam-kundli", "prashna-kundli", "kundli-matching"];
export const isKundliService = (slug: string) => KUNDLI_SERVICE_SLUGS.includes(slug);
export const needsPartner = (slug: string) => slug === "kundli-matching";

export type Gender = "MALE" | "FEMALE" | "OTHER";

export interface BookingForm {
  name: string;
  gender: Gender;
  /** DD-MM-YYYY as typed */
  dob: string;
  /** HH:MM (24 hours) as typed */
  tob: string;
  timeUnknown: boolean;
  pob: string;
  phone: string;
  email: string;
  language: "hi" | "en";
  queries: string;
  fatherName: string;
  motherName: string;
  grandfatherName: string;
  gotra: string;
  address: string;
  partnerName: string;
  partnerGender: Gender;
  partnerDob: string;
  partnerTob: string;
  partnerTimeUnknown: boolean;
  partnerPob: string;
  slotId: string;
  offerCode: string;
}

export const emptyForm = (prefill: Partial<BookingForm> = {}): BookingForm => ({
  name: "",
  gender: "MALE",
  dob: "",
  tob: "",
  timeUnknown: false,
  pob: "",
  phone: "",
  email: "",
  language: "hi",
  queries: "",
  fatherName: "",
  motherName: "",
  grandfatherName: "",
  gotra: "",
  address: "",
  partnerName: "",
  partnerGender: "FEMALE",
  partnerDob: "",
  partnerTob: "",
  partnerTimeUnknown: false,
  partnerPob: "",
  slotId: "",
  offerCode: "",
  ...prefill,
});

/** "25-12-1990" (or with / or .) to "1990-12-25"; null when it is not a real date. */
export function parseDate(input: string): string | null {
  const m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(input.trim());
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  const d = new Date(Date.UTC(year, month - 1, day));
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return null;
  const today = new Date();
  if (d.getTime() > Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())) return null; // not born in the future
  if (year < 1900) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** "6:05" or "06:05" to "06:05"; null when it is not a time of day. */
export function parseTime(input: string): string | null {
  const m = /^(\d{1,2})[:.](\d{2})$/.exec(input.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

export type FormErrorKey =
  | "errName"
  | "errDob"
  | "errTob"
  | "errPob"
  | "errPhone"
  | "errEmail"
  | "errRequired"
  | "errSlot";

export type FormErrors = Partial<Record<keyof BookingForm, FormErrorKey>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateBooking(form: BookingForm, serviceSlug: string, plan: CatalogPlan): FormErrors {
  const e: FormErrors = {};
  if (form.name.trim().length < 2) e.name = "errName";
  if (!parseDate(form.dob)) e.dob = "errDob";
  if (!form.timeUnknown && !parseTime(form.tob)) e.tob = "errTob";
  if (form.pob.trim().length < 2) e.pob = "errPob";
  if (!isValidPhone(form.phone.replace(/^(\+91|91)/, ""))) e.phone = "errPhone";
  if (form.email.trim() && !EMAIL.test(form.email.trim())) e.email = "errEmail";
  if (isKundliService(serviceSlug)) {
    for (const key of ["fatherName", "motherName", "grandfatherName", "gotra", "address"] as const) {
      if (!form[key].trim()) e[key] = "errRequired";
    }
  }
  if (needsPartner(serviceSlug)) {
    if (form.partnerName.trim().length < 2) e.partnerName = "errName";
    if (!parseDate(form.partnerDob)) e.partnerDob = "errDob";
    if (!form.partnerTimeUnknown && !parseTime(form.partnerTob)) e.partnerTob = "errTob";
    if (form.partnerPob.trim().length < 2) e.partnerPob = "errPob";
  }
  if (plan.hasCall && !form.slotId) e.slotId = "errSlot";
  return e;
}

/** The request body for POST /api/booking. Never carries a price: the server works that out. */
export function buildBookingBody(form: BookingForm, serviceSlug: string, plan: CatalogPlan, idempotencyKey: string) {
  const dob = parseDate(form.dob) as string;
  const tob = form.timeUnknown ? "12:00" : (parseTime(form.tob) as string);
  const phone = form.phone.replace(/^(\+91|91)/, "").trim();
  return {
    serviceSlug,
    planSlug: plan.slug,
    offerCode: form.offerCode.trim() ? form.offerCode.trim().toUpperCase() : undefined,
    slotId: plan.hasCall ? form.slotId : undefined,
    idempotencyKey,
    jatakaDetails: {
      name: form.name.trim(),
      gender: form.gender,
      dob,
      tob,
      isTimeUnknown: form.timeUnknown,
      pob: form.pob.trim(),
      phone,
      email: form.email.trim() || undefined,
      language: form.language,
      queries: form.queries.trim() || undefined,
      ...(isKundliService(serviceSlug)
        ? {
            fatherName: form.fatherName.trim(),
            motherName: form.motherName.trim(),
            grandfatherName: form.grandfatherName.trim(),
            gotra: form.gotra.trim(),
            address: form.address.trim(),
          }
        : {}),
      ...(needsPartner(serviceSlug)
        ? {
            partnerDetails: {
              name: form.partnerName.trim(),
              gender: form.partnerGender,
              dob: parseDate(form.partnerDob) as string,
              tob: form.partnerTimeUnknown ? "12:00" : (parseTime(form.partnerTob) as string),
              isTimeUnknown: form.partnerTimeUnknown,
              pob: form.partnerPob.trim(),
            },
          }
        : {}),
    },
  };
}

/** The same sum the server does: GST on (price - discount), rounded to the paisa. For display only. */
export function previewTotals(basePaise: number, discountPaise: number, gstRateBasisPoints: number) {
  const taxable = Math.max(0, basePaise - discountPaise);
  const gst = Math.round((taxable * gstRateBasisPoints) / 10000);
  return { taxable, gst, net: taxable + gst };
}

export function gstLabel(basisPoints: number): string {
  return String(basisPoints / 100);
}

/** "2026-11-20" to "20 Nov 2026" */
export function formatDay(iso: string, lang: "hi" | "en"): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
