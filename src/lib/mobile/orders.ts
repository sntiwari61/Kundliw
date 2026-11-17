import { prisma } from "@/lib/prisma";
import { loadPlanTitleMap, bundleTitle } from "@/lib/booking/bundle";
import { cancelBlockReason, upgradeBlockReason, upgradeChoices } from "@/lib/orders/selfService";
import { getSection } from "@/lib/siteConfig/service";

export interface MobileOrderDto {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  paymentStatus: string;
  paymentMode: string;
  serviceSlug: string | null;
  serviceTitleEn: string;
  serviceTitleHi: string;
  planTitleEn: string;
  planTitleHi: string;
  baseAmountPaise: number;
  discountAmountPaise: number;
  gstAmountPaise: number;
  netAmountPaise: number;
  offerCode: string | null;
  rejectionReason: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  refundStatus: string | null;
  refundAmountPaise: number | null;
  courierName: string | null;
  trackingNumber: string | null;
  appointmentStatus: string | null;
  appointmentNote: string | null;
  slot: { date: string; startTime: string; endTime: string } | null;
  invoiceNumber: string | null;
}

/** One step in an order's history, as the Kendra recorded it */
export interface MobileOrderEvent {
  id: string;
  status: string;
  note: string | null;
  createdAt: string;
}

export interface MobileOrderDetail extends MobileOrderDto {
  events: MobileOrderEvent[];
  /** whether the customer can cancel by themselves, and if not, why (in both languages) */
  cancel: { allowed: boolean; reasonEn: string | null; reasonHi: string | null };
  /** higher plans this paid order can be upgraded to */
  upgrades: { id: string; titleEn: string; titleHi: string; pricePaise: number }[];
  /** whether the customer may download the invoice (the admin can switch this off) */
  invoiceAllowed: boolean;
  /** how many Vault documents belong to this order */
  documents: number;
}

const include = { service: true, plan: true, slot: true } as const;

type OrderRow = Awaited<ReturnType<typeof prisma.order.findFirstOrThrow<{ include: typeof include }>>>;

async function toDtos(rows: OrderRow[]): Promise<MobileOrderDto[]> {
  const map = await loadPlanTitleMap(rows.flatMap((r) => r.extraPlanIds));
  return rows.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    createdAt: o.createdAt.toISOString(),
    status: o.status,
    paymentStatus: o.paymentStatus,
    paymentMode: o.paymentMode,
    serviceSlug: o.service?.slug ?? null,
    serviceTitleEn: o.service?.titleEn ?? "",
    serviceTitleHi: o.service?.titleHi ?? "",
    planTitleEn: bundleTitle(o, map, false),
    planTitleHi: bundleTitle(o, map, true),
    baseAmountPaise: o.baseAmountPaise,
    discountAmountPaise: o.discountAmountPaise,
    gstAmountPaise: o.gstAmountPaise,
    netAmountPaise: o.netAmountPaise,
    offerCode: o.offerCode,
    rejectionReason: o.rejectionReason,
    cancelledAt: o.cancelledAt ? o.cancelledAt.toISOString() : null,
    cancelReason: o.cancelReason ?? null,
    refundStatus: o.refundStatus ?? null,
    refundAmountPaise: o.refundAmountPaise ?? null,
    courierName: o.courierName ?? null,
    trackingNumber: o.trackingNumber ?? null,
    appointmentStatus: o.appointmentStatus ?? null,
    appointmentNote: o.appointmentNote ?? null,
    slot: o.slot ? { date: o.slot.date.toISOString().slice(0, 10), startTime: o.slot.startTime, endTime: o.slot.endTime } : null,
    invoiceNumber: o.invoiceNumber,
  }));
}

/** A customer's own orders, newest first. */
export async function listOrdersFor(userId: string): Promise<MobileOrderDto[]> {
  const rows = await prisma.order.findMany({ where: { userId }, include, orderBy: { createdAt: "desc" }, take: 100 });
  return toDtos(rows);
}

/** One of the customer's own orders, or null when it does not exist or belongs to someone else. */
export async function getOrderFor(userId: string, orderId: string): Promise<MobileOrderDto | null> {
  const row = await prisma.order.findFirst({ where: { id: orderId, userId }, include });
  if (!row) return null;
  return (await toDtos([row]))[0];
}

/**
 * One order with everything the app's order page shows: the history, what the customer can still do
 * (cancel, upgrade, download the invoice) and how many documents belong to it.
 */
export async function getOrderDetailFor(userId: string, orderId: string): Promise<MobileOrderDetail | null> {
  const row = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: { ...include, statusEvents: { orderBy: { createdAt: "desc" }, take: 50 }, plan: { include: { package: true } } },
  });
  if (!row) return null;
  const base = (await toDtos([row as unknown as OrderRow]))[0];

  const cancelled = !!row.cancelledAt;
  const block = cancelled ? null : cancelBlockReason(row, row.plan?.package?.startDate ?? null);
  const canUpgrade = !cancelled && !upgradeBlockReason(row);
  const [choices, invoiceCfg, documents] = await Promise.all([
    canUpgrade ? upgradeChoices(row).catch(() => []) : Promise.resolve([]),
    getSection("invoice").catch(() => ({}) as Record<string, unknown>),
    prisma.vaultFile.count({ where: { orderId: row.id, userId } }).catch(() => 0),
  ]);

  return {
    ...base,
    events: row.statusEvents.map((e) => ({ id: e.id, status: e.status, note: e.note, createdAt: e.createdAt.toISOString() })),
    cancel: { allowed: !cancelled && !block, reasonEn: block?.en ?? null, reasonHi: block?.hi ?? null },
    upgrades: choices.map((p) => ({ id: p.id, titleEn: p.titleEn, titleHi: p.titleHi, pricePaise: p.pricePaise })),
    invoiceAllowed: (invoiceCfg as Record<string, unknown>).userCanDownload !== false,
    documents,
  };
}
