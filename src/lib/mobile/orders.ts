import { prisma } from "@/lib/prisma";
import { loadPlanTitleMap, bundleTitle } from "@/lib/booking/bundle";

export interface MobileOrderDto {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  paymentStatus: string;
  paymentMode: string;
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
  slot: { date: string; startTime: string; endTime: string } | null;
  invoiceNumber: string | null;
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
