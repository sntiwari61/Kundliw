import { imageUri, offerValue, paragraphs, parseInline, plainText, safeExternal } from "../content";

const money = (p: number) => `Rs${p / 100}`;

describe("content helpers", () => {
  it("puts the website address in front of pictures saved on the site only", () => {
    expect(imageUri("/api/storage/a.jpg")).toMatch(/\/api\/storage\/a\.jpg$/);
    expect(imageUri("/api/storage/a.jpg")).toMatch(/^https?:\/\//);
    expect(imageUri("https://example.com/x.png")).toBe("https://example.com/x.png");
    expect(imageUri(null)).toBeUndefined();
  });

  it("opens only web, phone and mail addresses", () => {
    expect(safeExternal("https://example.com")).toBe("https://example.com");
    expect(safeExternal("tel:+919827991224")).toBe("tel:+919827991224");
    expect(safeExternal("mailto:a@b.com")).toBe("mailto:a@b.com");
    expect(safeExternal("javascript:alert(1)")).toBeNull();
    expect(safeExternal("//evil.com")).toBeNull();
    expect(safeExternal("")).toBeNull();
  });

  it("reads bold text and links, and keeps unsafe links as plain text", () => {
    const parts = parseInline("Hello **world** and [site](https://example.com) and [bad](javascript:x)");
    expect(parts.map((p) => p.type)).toEqual(["text", "bold", "text", "link", "text", "text"]);
    expect(parts[3]).toMatchObject({ type: "link", href: "https://example.com", text: "site" });
  });

  it("splits paragraphs on blank lines", () => {
    expect(paragraphs("one\n\ntwo\r\n\r\n\r\nthree")).toEqual(["one", "two", "three"]);
  });

  it("describes flat and percentage offers", () => {
    const base = { id: "1", code: "C", titleEn: "", titleHi: "", minOrderValuePaise: 0, autoApply: false, validUntil: null };
    expect(offerValue({ ...base, discountType: "FLAT", discountValuePaise: 50000, maxDiscountPaise: null }, money, "off", "up to")).toBe("Rs500 off");
    expect(offerValue({ ...base, discountType: "PERCENTAGE", discountValuePaise: 25, maxDiscountPaise: 100000 }, money, "off", "up to")).toBe("25% off (up to Rs1000)");
  });

  it("removes the markup from a preview", () => {
    expect(plainText("A **bold** [link](https://x.com) text")).toBe("A bold link text");
  });
});

import { birthPayload, emptyBirth, prashnaPayload, queryTimestamp, validateBirth, validatePrashna } from "../astro";

describe("Kundli request forms", () => {
  it("accepts good birth details and sends them the way the website expects", () => {
    const f = { ...emptyBirth(), name: " Ram Kumar ", dob: "5-2-1990", tob: "6:05", pob: " Varanasi " };
    expect(validateBirth(f)).toEqual({});
    expect(birthPayload(f)).toEqual({ name: "Ram Kumar", gender: "MALE", dob: "1990-02-05", tob: "06:05", pob: "Varanasi" });
  });

  it("flags every wrong birth detail", () => {
    expect(Object.keys(validateBirth(emptyBirth())).sort()).toEqual(["dob", "name", "pob", "tob"]);
    expect(validateBirth({ ...emptyBirth(), name: "Ram", dob: "31-02-1990", tob: "25:00", pob: "Kashi" })).toEqual({ dob: "errDob", tob: "errTob" });
  });

  it("checks the Prashna form and stamps the moment of the question", () => {
    const f = { name: "Sita", phone: "9876543210", email: "", category: "CAREER" as const, questionText: "Will I get a job?", placeOfQuery: "Kashi" };
    expect(validatePrashna(f)).toEqual({});
    expect(Object.keys(validatePrashna({ ...f, phone: "123", questionText: "hi", email: "x" })).sort()).toEqual(["email", "phone", "questionText"]);
    const at = new Date(2026, 10, 14, 9, 5);
    expect(queryTimestamp(at)).toBe("2026-11-14T09:05");
    expect(prashnaPayload(f, at)).toEqual({ name: "Sita", phone: "9876543210", category: "CAREER", questionText: "Will I get a job?", queryTimestamp: "2026-11-14T09:05", placeOfQuery: "Kashi" });
  });
});
