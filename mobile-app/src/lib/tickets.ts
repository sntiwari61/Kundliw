/** Support tickets: the shapes the server sends, and the form checks (the same ones the server makes). */

export interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  orderNumber: string | null;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketDetail extends Ticket {
  messages: { id: string; fromAdmin: boolean; body: string; createdAt: string }[];
}

export interface TicketForm {
  subject: string;
  message: string;
  orderNumber: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
}

export type TicketErrorKey = "errSubject" | "errMessage" | "errName" | "errEmail" | "errPhoneAny" | "errAddress";
export type TicketErrors = Partial<Record<keyof TicketForm, TicketErrorKey>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^[+\d][\d\s-]{6,17}$/;

export function validateTicket(f: TicketForm): TicketErrors {
  const e: TicketErrors = {};
  if (f.subject.trim().length < 3) e.subject = "errSubject";
  if (f.message.trim().length < 5) e.message = "errMessage";
  if (f.contactName.trim().length < 2) e.contactName = "errName";
  if (!EMAIL.test(f.contactEmail.trim())) e.contactEmail = "errEmail";
  if (!PHONE.test(f.contactPhone.trim())) e.contactPhone = "errPhoneAny";
  if (f.contactAddress.trim().length < 5) e.contactAddress = "errAddress";
  return e;
}

export function ticketTone(status: string): "success" | "warning" | "brand" | "neutral" {
  if (status === "RESOLVED") return "success";
  if (status === "IN_PROGRESS") return "brand";
  if (status === "OPEN") return "warning";
  return "neutral";
}
