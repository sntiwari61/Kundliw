/** An order as the app receives it from /api/mobile/v1/orders. */
export interface MobileOrder {
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

/** An order that still needs the customer to pay (or to pay again after a rejected payment). */
export function needsPayment(order: Pick<MobileOrder, "paymentStatus" | "cancelledAt">): boolean {
  return !order.cancelledAt && (order.paymentStatus === "PENDING" || order.paymentStatus === "FAILED");
}
