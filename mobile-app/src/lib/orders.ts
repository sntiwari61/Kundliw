/** An order as the app receives it from /api/mobile/v1/orders. */
export interface MobileOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  paymentStatus: string;
  paymentMode: string;
  serviceSlug?: string | null;
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
  cancelReason?: string | null;
  refundStatus?: string | null;
  refundAmountPaise?: number | null;
  courierName?: string | null;
  trackingNumber?: string | null;
  appointmentStatus?: string | null;
  appointmentNote?: string | null;
  slot: { date: string; startTime: string; endTime: string } | null;
  invoiceNumber: string | null;
}

export interface OrderEvent {
  id: string;
  status: string;
  note: string | null;
  createdAt: string;
}

/** One order with its history and what the customer can still do (from /api/mobile/v1/orders/{id}). */
export interface MobileOrderDetail extends MobileOrder {
  events?: OrderEvent[];
  cancel?: { allowed: boolean; reasonEn: string | null; reasonHi: string | null };
  upgrades?: { id: string; titleEn: string; titleHi: string; pricePaise: number }[];
  invoiceAllowed?: boolean;
  documents?: number;
}

/** An order that still needs the customer to pay (or to pay again after a rejected payment). */
export function needsPayment(order: Pick<MobileOrder, "paymentStatus" | "cancelledAt">): boolean {
  return !order.cancelledAt && (order.paymentStatus === "PENDING" || order.paymentStatus === "FAILED");
}

export type OrderFilter = "ALL" | "ACTIVE" | "DONE" | "CANCELLED";

/** Where an order belongs in the list: cancelled, finished, or still going on. */
export function orderBucket(order: Pick<MobileOrder, "cancelledAt" | "paymentStatus" | "status">): Exclude<OrderFilter, "ALL"> {
  if (order.cancelledAt || order.paymentStatus === "REFUNDED" || order.paymentStatus === "FAILED") return "CANCELLED";
  if (order.status === "EXECUTION_COMPLETE" || order.status === "DELIVERED") return "DONE";
  return "ACTIVE";
}

/** The orders matching a filter and a search text (order number, service or plan name in either language). */
export function filterOrders(orders: MobileOrder[], filter: OrderFilter, query: string): MobileOrder[] {
  const q = query.trim().toLowerCase();
  return orders.filter((o) => {
    if (filter !== "ALL" && orderBucket(o) !== filter) return false;
    if (!q) return true;
    return [o.orderNumber, o.serviceTitleEn, o.serviceTitleHi, o.planTitleEn, o.planTitleHi].some((v) => (v ?? "").toLowerCase().includes(q));
  });
}

/** How many orders each filter would show, for the filter chips. */
export function countByFilter(orders: MobileOrder[]): Record<OrderFilter, number> {
  const out: Record<OrderFilter, number> = { ALL: orders.length, ACTIVE: 0, DONE: 0, CANCELLED: 0 };
  for (const o of orders) out[orderBucket(o)] += 1;
  return out;
}

/** The six stages of an order, in order. */
export const ORDER_STAGES = ["ORDER_RECEIVED", "KUNDLI_IN_PROGRESS", "KUNDLI_COMPLETE", "DISPATCHED", "DELIVERED", "EXECUTION_COMPLETE"] as const;

/** Where the order is on its way: how many stages are done (0 to 6) and the position of the current one. */
export function stageProgress(status: string): { index: number; total: number } {
  const i = (ORDER_STAGES as readonly string[]).indexOf(status);
  return { index: i < 0 ? 0 : i, total: ORDER_STAGES.length };
}

/** Whether the customer can download an invoice: only for a paid order, and only when the admin allows it. */
export function canDownloadInvoice(order: Pick<MobileOrderDetail, "paymentStatus" | "invoiceAllowed" | "cancelledAt">): boolean {
  return order.paymentStatus === "PAID" && !order.cancelledAt && order.invoiceAllowed !== false;
}

/** Whether the Kendra has recorded a tracking number for this order. */
export function hasTracking(order: Pick<MobileOrder, "courierName" | "trackingNumber">): boolean {
  return !!(order.trackingNumber && order.trackingNumber.trim());
}
