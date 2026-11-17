import { combinePlans, filterServices, toggleExtraPlan, type CatalogPlan, type CatalogService } from "../booking";
import { dateRange, parseSaved, pickList, serviceShareUrl, toggleSaved } from "../services";

const plan = (over: Partial<CatalogPlan> = {}): CatalogPlan => ({
  id: "p1",
  packageId: null,
  slug: "basic",
  titleEn: "Basic",
  titleHi: "बेसिक",
  pricePaise: 100000,
  originalPricePaise: null,
  deliveryDays: 3,
  pages: null,
  hasCall: false,
  callDurationMinutes: null,
  ...over,
});

describe("combining plans in one booking", () => {
  it("adds up the prices and needs a call slot when any plan has a call", () => {
    const main = plan();
    const merged = combinePlans(main, [plan({ id: "p2", slug: "pro", pricePaise: 250000, hasCall: true }), plan({ id: "p3", slug: "x", pricePaise: 50000 })]);
    expect(merged.pricePaise).toBe(400000);
    expect(merged.hasCall).toBe(true);
    expect(merged.slug).toBe("basic");
    expect(combinePlans(main, []).hasCall).toBe(false);
  });

  it("allows at most two extra plans, never the main plan, and can take one away again", () => {
    expect(toggleExtraPlan([], "b", "a")).toEqual(["b"]);
    expect(toggleExtraPlan(["b"], "c", "a")).toEqual(["b", "c"]);
    expect(toggleExtraPlan(["b", "c"], "d", "a")).toEqual(["b", "c"]);
    expect(toggleExtraPlan(["b", "c"], "b", "a")).toEqual(["c"]);
    expect(toggleExtraPlan([], "a", "a")).toEqual([]);
  });
});

describe("service list", () => {
  const svc = (slug: string, titleEn: string, titleHi: string, taglineEn = ""): CatalogService => ({ slug, titleEn, titleHi, taglineEn, packages: [], plans: [] });
  const list = [svc("kundli", "Janam Kundli", "जन्म कुंडली", "Birth chart"), svc("vastu", "Vastu", "वास्तु")];
  it("searches name or tagline in either language", () => {
    expect(filterServices(list, "ALL", "kundli", []).map((s) => s.slug)).toEqual(["kundli"]);
    expect(filterServices(list, "ALL", "वास्तु", []).map((s) => s.slug)).toEqual(["vastu"]);
    expect(filterServices(list, "ALL", "birth", []).map((s) => s.slug)).toEqual(["kundli"]);
    expect(filterServices(list, "ALL", "", [])).toHaveLength(2);
  });
  it("can show only the saved ones", () => {
    expect(filterServices(list, "SAVED", "", ["vastu"]).map((s) => s.slug)).toEqual(["vastu"]);
    expect(filterServices(list, "SAVED", "", [])).toEqual([]);
  });
});

describe("saved services", () => {
  it("reads only clean text entries from the phone", () => {
    expect(parseSaved(null)).toEqual([]);
    expect(parseSaved("not json")).toEqual([]);
    expect(parseSaved('{"a":1}')).toEqual([]);
    expect(parseSaved('["a","a",3,"","b"]')).toEqual(["a", "b"]);
  });
  it("saves and unsaves with one tap", () => {
    expect(toggleSaved([], "a")).toEqual(["a"]);
    expect(toggleSaved(["a", "b"], "a")).toEqual(["b"]);
  });
});

describe("service page helpers", () => {
  it("falls back to the other language when a list is empty", () => {
    expect(pickList("hi", ["en"], [])).toEqual(["en"]);
    expect(pickList("hi", ["en"], ["हि"])).toEqual(["हि"]);
    expect(pickList("en", [], ["हि"])).toEqual(["हि"]);
    expect(pickList("en", undefined, undefined)).toEqual([]);
  });
  it("writes dates and the share address", () => {
    expect(dateRange(null, null)).toBeNull();
    expect(dateRange("2026-12-01", null)).toBe("2026-12-01");
    expect(dateRange("2026-12-01", "2026-12-05")).toBe("2026-12-01 → 2026-12-05");
    expect(serviceShareUrl("https://x.com/", "janam kundli", "hi")).toBe("https://x.com/hi/services/janam%20kundli");
  });
});
