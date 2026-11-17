import { filterSections, guideSections } from "../content";
import { panchangFacts, tithiLine, type Panchang } from "../panchang";

describe("guide sections", () => {
  const text = ["Welcome to the app.", "1. Sign in\nUse your mobile number.", "Then enter the code.", "2. Book a service\nChoose a plan.", "10. Help\nCall us."].join("\n\n");

  it("starts a new section at each numbered heading and keeps the words that follow it", () => {
    const s = guideSections(text);
    expect(s.map((x) => [x.number, x.heading])).toEqual([
      [null, null],
      [1, "Sign in"],
      [2, "Book a service"],
      [10, "Help"],
    ]);
    expect(s[0].body).toBe("Welcome to the app.");
    expect(s[1].body).toBe("Use your mobile number.\n\nThen enter the code.");
    expect(s[3].body).toBe("Call us.");
  });

  it("copes with a guide that has no numbered headings, or no text", () => {
    expect(guideSections("Just words.\n\nMore words.")).toEqual([{ heading: null, number: null, body: "Just words.\n\nMore words." }]);
    expect(guideSections("")).toEqual([]);
  });

  it("does not take a sentence that merely starts with a number for a heading", () => {
    expect(guideSections("2026 is here")).toEqual([{ heading: null, number: null, body: "2026 is here" }]);
  });

  it("searches the headings and the words", () => {
    const s = guideSections(text);
    expect(filterSections(s, "mobile").map((x) => x.number)).toEqual([1]);
    expect(filterSections(s, "BOOK").map((x) => x.number)).toEqual([2]);
    expect(filterSections(s, "  ")).toHaveLength(4);
    expect(filterSections(s, "zzz")).toEqual([]);
  });
});

describe("Panchang card", () => {
  const p: Panchang = {
    date: "2026-11-17",
    vaar: "Tuesday",
    tithi: "Panchami",
    paksha: "Shukla",
    nakshatra: "Rohini",
    yoga: "Siddhi",
    karana: "Bava",
    sunrise: "06:12",
    sunset: "17:31",
    rahuKaal: "15:00 - 16:30",
    abhijitMuhurat: "",
    parts: { tithiEn: "Panchami", tithiHi: "पंचमी", pakshaEn: "Shukla", pakshaHi: "शुक्ल", masaEn: "Kartika", masaHi: "कार्तिक" },
  };

  it("writes the tithi in the chosen language", () => {
    expect(tithiLine(p, "en")).toBe("Panchami, Shukla");
    expect(tithiLine(p, "hi")).toBe("पंचमी, शुक्ल");
    expect(tithiLine({ ...p, parts: undefined }, "hi")).toBe("Panchami, Shukla");
  });

  it("lists only the facts the calculation gave", () => {
    const facts = panchangFacts(p);
    expect(facts.map((f) => f.key)).toEqual(["nakshatraLabel", "yogaLabel", "karanaLabel", "sunriseLabel", "sunsetLabel", "rahuKaalLabel"]);
    expect(facts[5].value).toBe("15:00 - 16:30");
  });
});
