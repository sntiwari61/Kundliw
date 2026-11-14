import { buildBookingBody, emptyForm, parseDate, parseTime, previewTotals, validateBooking, type CatalogPlan } from "../booking";

const plan = (over: Partial<CatalogPlan> = {}): CatalogPlan => ({
  id: "p1",
  packageId: null,
  slug: "standard",
  titleEn: "Standard",
  titleHi: "मानक",
  pricePaise: 150000,
  originalPricePaise: null,
  deliveryDays: 7,
  pages: null,
  hasCall: false,
  callDurationMinutes: null,
  ...over,
});

const filled = () =>
  emptyForm({ name: "Ram Kumar", dob: "25-12-1990", tob: "6:05", pob: "Bhilai", phone: "9876543210" });

describe("parseDate", () => {
  it("accepts real dates and converts to ISO", () => {
    expect(parseDate("25-12-1990")).toBe("1990-12-25");
    expect(parseDate("5/1/2001")).toBe("2001-01-05");
    expect(parseDate("29-02-2000")).toBe("2000-02-29");
  });
  it("rejects impossible, future and malformed dates", () => {
    expect(parseDate("31-02-1990")).toBeNull();
    expect(parseDate("29-02-2001")).toBeNull();
    expect(parseDate("1990-12-25")).toBeNull();
    expect(parseDate("25-12-1800")).toBeNull();
    expect(parseDate("01-01-2999")).toBeNull();
    expect(parseDate("")).toBeNull();
  });
});

describe("parseTime", () => {
  it("accepts 24-hour times", () => {
    expect(parseTime("6:05")).toBe("06:05");
    expect(parseTime("23:59")).toBe("23:59");
    expect(parseTime("00:00")).toBe("00:00");
  });
  it("rejects bad times", () => {
    expect(parseTime("24:00")).toBeNull();
    expect(parseTime("12:60")).toBeNull();
    expect(parseTime("noon")).toBeNull();
  });
});

describe("validateBooking", () => {
  it("passes a complete plain booking", () => {
    expect(validateBooking(filled(), "career-business-raj-yoga", plan())).toEqual({});
  });
  it("lists every missing field", () => {
    const errors = validateBooking(emptyForm(), "career-business-raj-yoga", plan());
    expect(Object.keys(errors).sort()).toEqual(["dob", "name", "phone", "pob", "tob"]);
  });
  it("does not need a birth time when it is unknown", () => {
    expect(validateBooking({ ...filled(), tob: "", timeUnknown: true }, "x", plan())).toEqual({});
  });
  it("accepts +91 and 91 prefixes and rejects bad numbers", () => {
    expect(validateBooking({ ...filled(), phone: "+919876543210" }, "x", plan())).toEqual({});
    expect(validateBooking({ ...filled(), phone: "919876543210" }, "x", plan())).toEqual({});
    expect(validateBooking({ ...filled(), phone: "1234567890" }, "x", plan()).phone).toBe("errPhone");
  });
  it("checks an optional email only when given", () => {
    expect(validateBooking({ ...filled(), email: "nope" }, "x", plan()).email).toBe("errEmail");
    expect(validateBooking({ ...filled(), email: "a@b.in" }, "x", plan())).toEqual({});
  });
  it("needs the family details for the Kundli services", () => {
    const errors = validateBooking(filled(), "janam-kundli", plan());
    expect(Object.keys(errors).sort()).toEqual(["address", "fatherName", "gotra", "grandfatherName", "motherName"]);
  });
  it("needs the partner for matching", () => {
    const family = { fatherName: "a", motherName: "b", grandfatherName: "c", gotra: "d", address: "e" };
    const errors = validateBooking({ ...filled(), ...family }, "kundli-matching", plan());
    expect(Object.keys(errors).sort()).toEqual(["partnerDob", "partnerName", "partnerPob", "partnerTob"]);
  });
  it("needs a slot when the plan has a call", () => {
    expect(validateBooking(filled(), "x", plan({ hasCall: true })).slotId).toBe("errSlot");
    expect(validateBooking({ ...filled(), slotId: "s1" }, "x", plan({ hasCall: true }))).toEqual({});
  });
});

describe("buildBookingBody", () => {
  it("never carries a price and converts the typed values", () => {
    const body = buildBookingBody({ ...filled(), phone: "+919876543210", offerCode: "diwali" }, "x", plan(), "key-1");
    expect(body).toMatchObject({
      serviceSlug: "x",
      planSlug: "standard",
      offerCode: "DIWALI",
      idempotencyKey: "key-1",
      jatakaDetails: { name: "Ram Kumar", dob: "1990-12-25", tob: "06:05", phone: "9876543210", isTimeUnknown: false },
    });
    expect(JSON.stringify(body)).not.toMatch(/price|amount/i);
  });
  it("uses 12:00 when the time is unknown and sends the slot only for calls", () => {
    const form = { ...filled(), timeUnknown: true, tob: "", slotId: "s1" };
    expect(buildBookingBody(form, "x", plan(), "k").jatakaDetails.tob).toBe("12:00");
    expect(buildBookingBody(form, "x", plan(), "k").slotId).toBeUndefined();
    expect(buildBookingBody(form, "x", plan({ hasCall: true }), "k").slotId).toBe("s1");
  });
  it("adds family and partner details only where they belong", () => {
    const form = {
      ...filled(),
      fatherName: "f",
      motherName: "m",
      grandfatherName: "g",
      gotra: "k",
      address: "a",
      partnerName: "Sita",
      partnerDob: "01-02-1992",
      partnerTob: "10:30",
      partnerPob: "Durg",
    };
    const matching = buildBookingBody(form, "kundli-matching", plan(), "k").jatakaDetails as Record<string, unknown>;
    expect(matching.gotra).toBe("k");
    expect(matching.partnerDetails).toMatchObject({ name: "Sita", dob: "1992-02-01", tob: "10:30" });
    const plain = buildBookingBody(form, "career", plan(), "k").jatakaDetails as Record<string, unknown>;
    expect(plain.gotra).toBeUndefined();
    expect(plain.partnerDetails).toBeUndefined();
  });
});

describe("previewTotals", () => {
  it("matches the server's GST sum", () => {
    expect(previewTotals(150000, 0, 1800)).toEqual({ taxable: 150000, gst: 27000, net: 177000 });
    expect(previewTotals(110000, 10000, 1800)).toEqual({ taxable: 100000, gst: 18000, net: 118000 });
    expect(previewTotals(1000, 5000, 1800)).toEqual({ taxable: 0, gst: 0, net: 0 });
    expect(previewTotals(12345, 0, 1800).gst).toBe(2222); // 2222.1 rounds down
  });
});
