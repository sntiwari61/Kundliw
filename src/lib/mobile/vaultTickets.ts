import { prisma } from "@/lib/prisma";

export interface MobileVaultFile {
  id: string;
  titleEn: string;
  titleHi: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  /** ADMIN (sent by the Kendra), USER or ASSOCIATE (uploaded by the person) */
  uploadedByRole: string;
  uploadedAt: string;
}

/** The person's own Vault files, newest first. The storage path is never sent. */
export async function listVaultFor(userId: string): Promise<MobileVaultFile[]> {
  const rows = await prisma.vaultFile.findMany({
    where: { userId },
    orderBy: { uploadedAt: "desc" },
    take: 200,
    select: { id: true, titleEn: true, titleHi: true, fileName: true, fileSize: true, mimeType: true, uploadedByRole: true, uploadedAt: true },
  });
  return rows.map((r) => ({ ...r, uploadedAt: r.uploadedAt.toISOString() }));
}

export interface MobileTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  orderNumber: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface MobileTicketDetail extends MobileTicket {
  messages: { id: string; fromAdmin: boolean; body: string; createdAt: string }[];
}

const ticketSelect = { id: true, ticketNumber: true, subject: true, orderNumber: true, status: true, createdAt: true, updatedAt: true } as const;

/** The person's own support tickets, most recently active first. */
export async function listTicketsFor(userId: string): Promise<MobileTicket[]> {
  const rows = await prisma.supportTicket.findMany({ where: { userId }, orderBy: { updatedAt: "desc" }, take: 100, select: ticketSelect });
  return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() }));
}

/** One of the person's own tickets with its messages, or null when it is not theirs. */
export async function getTicketFor(userId: string, ticketId: string): Promise<MobileTicketDetail | null> {
  const r = await prisma.supportTicket.findFirst({
    where: { id: ticketId, userId },
    select: { ...ticketSelect, messages: { orderBy: { createdAt: "asc" }, select: { id: true, fromAdmin: true, body: true, createdAt: true } } },
  });
  if (!r) return null;
  return {
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    messages: r.messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })),
  };
}
