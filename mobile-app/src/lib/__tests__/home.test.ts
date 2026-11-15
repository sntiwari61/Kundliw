import { compareVersions, isOn, pickText } from "../home";
import { resolveLink, whatsappUrl } from "../links";

describe("home helpers", () => {
  it("compares app versions the way people read them", () => {
    expect(compareVersions("1.0.0", "1.0.1")).toBe(-1);
    expect(compareVersions("1.2.10", "1.2.9")).toBe(1);
    expect(compareVersions("2.0", "2.0.0")).toBe(0);
    expect(compareVersions("1.9.9", "2.0.0")).toBe(-1);
  });

  it("treats blocks as on unless the admin switched them off", () => {
    expect(isOn({ showA: false }, "showA")).toBe(false);
    expect(isOn({ showA: true }, "showA")).toBe(true);
    expect(isOn({}, "showA")).toBe(true);
    expect(isOn(undefined, "showA")).toBe(true);
    expect(isOn({}, "showA", false)).toBe(false);
  });

  it("uses the admin's wording in the chosen language, else the app's own", () => {
    const values = { titleEn: "  Hello  ", titleHi: "" };
    expect(pickText(values, "title", "en", "Default")).toBe("Hello");
    expect(pickText(values, "title", "hi", "डिफ़ॉल्ट")).toBe("डिफ़ॉल्ट");
    expect(pickText(undefined, "title", "en", "Default")).toBe("Default");
  });
});

describe("button links", () => {
  it("opens the matching app screen for pages of the website", () => {
    expect(resolveLink("/services")).toEqual({ type: "route", path: "/services" });
    expect(resolveLink("/en/services/janam-kundli")).toEqual({ type: "route", path: "/service/janam-kundli" });
    expect(resolveLink("/kundli")).toEqual({ type: "route", path: "/explore/tool/kundli" });
    expect(resolveLink("/kundli/matching")).toEqual({ type: "route", path: "/explore/tool/matching" });
    expect(resolveLink("/blogs/surya-siddhanta")).toEqual({ type: "route", path: "/explore/blog/surya-siddhanta" });
    expect(resolveLink("/")).toEqual({ type: "route", path: "/" });
  });

  it("opens other pages and web addresses outside the app, and ignores unsafe ones", () => {
    expect(resolveLink("/legal/terms")).toMatchObject({ type: "external" });
    expect(resolveLink("https://example.com/x")).toEqual({ type: "external", url: "https://example.com/x" });
    expect(resolveLink("tel:+919827991224")).toEqual({ type: "external", url: "tel:+919827991224" });
    expect(resolveLink("javascript:alert(1)")).toEqual({ type: "none" });
    expect(resolveLink("//evil.com")).toEqual({ type: "none" });
    expect(resolveLink("")).toEqual({ type: "none" });
  });

  it("builds a WhatsApp address with the first message", () => {
    expect(whatsappUrl("+91 98279 91224", "Namaste, hello")).toBe("https://wa.me/919827991224?text=Namaste%2C%20hello");
    expect(whatsappUrl("9827991224", "")).toBe("https://wa.me/919827991224");
  });
});
