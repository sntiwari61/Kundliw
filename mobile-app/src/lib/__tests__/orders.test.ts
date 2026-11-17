import { canDownloadInvoice, countByFilter, filterOrders, hasTracking, orderBucket, stageProgress, type MobileOrder } from "../orders";
import { filterVault, type VaultFile } from "../vault";

const order = (over: Partial<MobileOrder> = {}): MobileOrder => ({
  id: "o1",
  orderNumber: "MKJK-2026-0001",
  createdAt: "2026-11-13T06:00:00.000Z",
  status: "ORDER_RECEIVED",
  paymentStatus: "PAID",
  paymentMode: "MANUAL_UPI",
  serviceTitleEn: "Janampatri",
  serviceTitleHi: "जन्मपत्रिका",
  planTitleEn: "Silver",
  planTitleHi: "सिल्वर",
  baseAmountPaise: 100000,
  discountAmountPaise: 0,
  gstAmountPaise: 18000,
  netAmountPaise: 118000,
  offerCode: null,
  rejectionReason: null,
  cancelledAt: null,
  slot: null,
  invoiceNumber: null,
  ...over,
});

describe("order list helpers", () => {
  it("puts each order in cancelled, completed or in progress", () => {
    expect(orderBucket(order())).toBe("ACTIVE");
    expect(orderBucket(order({ status: "KUNDLI_IN_PROGRESS" }))).toBe("ACTIVE");
    expect(orderBucket(order({ status: "EXECUTION_COMPLETE" }))).toBe("DONE");
    expect(orderBucket(order({ status: "DELIVERED" }))).toBe("DONE");
    expect(orderBucket(order({ cancelledAt: "2026-11-14T00:00:00.000Z", paymentStatus: "REFUNDED" }))).toBe("CANCELLED");
    expect(orderBucket(order({ paymentStatus: "FAILED" }))).toBe("CANCELLED");
  });

  it("filters by bucket and counts each one", () => {
    const list = [order({ id: "a" }), order({ id: "b", status: "EXECUTION_COMPLETE" }), order({ id: "c", cancelledAt: "2026-11-14T00:00:00.000Z" })];
    expect(filterOrders(list, "ALL", "").map((o) => o.id)).toEqual(["a", "b", "c"]);
    expect(filterOrders(list, "DONE", "").map((o) => o.id)).toEqual(["b"]);
    expect(countByFilter(list)).toEqual({ ALL: 3, ACTIVE: 1, DONE: 1, CANCELLED: 1 });
  });

  it("searches the order number and the service or plan name in either language", () => {
    const list = [order({ id: "a", orderNumber: "MKJK-2026-0007", serviceTitleEn: "Vastu", serviceTitleHi: "वास्तु" }), order({ id: "b" })];
    expect(filterOrders(list, "ALL", "0007").map((o) => o.id)).toEqual(["a"]);
    expect(filterOrders(list, "ALL", "  VASTU ").map((o) => o.id)).toEqual(["a"]);
    expect(filterOrders(list, "ALL", "वास्तु").map((o) => o.id)).toEqual(["a"]);
    expect(filterOrders(list, "ALL", "silver")).toHaveLength(2);
    expect(filterOrders(list, "ALL", "nothing")).toHaveLength(0);
  });

  it("reports how far an order has come", () => {
    expect(stageProgress("ORDER_RECEIVED")).toEqual({ index: 0, total: 6 });
    expect(stageProgress("DISPATCHED").index).toBe(3);
    expect(stageProgress("EXECUTION_COMPLETE").index).toBe(5);
    expect(stageProgress("SOMETHING_NEW").index).toBe(0);
  });

  it("offers the invoice only for a paid, uncancelled order that the admin allows", () => {
    expect(canDownloadInvoice({ paymentStatus: "PAID", cancelledAt: null, invoiceAllowed: true })).toBe(true);
    expect(canDownloadInvoice({ paymentStatus: "PAID", cancelledAt: null })).toBe(true);
    expect(canDownloadInvoice({ paymentStatus: "PAID", cancelledAt: null, invoiceAllowed: false })).toBe(false);
    expect(canDownloadInvoice({ paymentStatus: "PENDING", cancelledAt: null, invoiceAllowed: true })).toBe(false);
    expect(canDownloadInvoice({ paymentStatus: "PAID", cancelledAt: "2026-11-14T00:00:00.000Z", invoiceAllowed: true })).toBe(false);
  });

  it("knows whether a tracking number was recorded", () => {
    expect(hasTracking({ courierName: "Speed Post", trackingNumber: "EE1" })).toBe(true);
    expect(hasTracking({ courierName: null, trackingNumber: "  " })).toBe(false);
    expect(hasTracking({})).toBe(false);
  });
});

const file = (over: Partial<VaultFile> = {}): VaultFile => ({
  id: "f1",
  titleEn: "Kundli report",
  titleHi: "कुंडली रिपोर्ट",
  fileName: "kundli.pdf",
  fileSize: 1000,
  mimeType: "application/pdf",
  uploadedByRole: "ADMIN",
  uploadedAt: "2026-11-01T00:00:00.000Z",
  ...over,
});

describe("vault filters", () => {
  const files = [file(), file({ id: "f2", titleEn: "My photo", titleHi: "मेरी फोटो", fileName: "me.jpg", uploadedByRole: "USER" }), file({ id: "f3", orderNumber: "MKJK-2026-0009" })];
  it("separates the Kendra's files from the person's own", () => {
    expect(filterVault(files, "KENDRA", "").map((f) => f.id)).toEqual(["f1", "f3"]);
    expect(filterVault(files, "MINE", "").map((f) => f.id)).toEqual(["f2"]);
    expect(filterVault(files, "ALL", "")).toHaveLength(3);
  });
  it("searches titles in both languages, the file name and the order number", () => {
    expect(filterVault(files, "ALL", "photo").map((f) => f.id)).toEqual(["f2"]);
    expect(filterVault(files, "ALL", "कुंडली").map((f) => f.id)).toEqual(["f1", "f3"]);
    expect(filterVault(files, "ALL", "me.jpg").map((f) => f.id)).toEqual(["f2"]);
    expect(filterVault(files, "ALL", "0009").map((f) => f.id)).toEqual(["f3"]);
  });
});
