jest.mock("expo-secure-store", () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn(), deleteItemAsync: jest.fn() }));

import { filterFaq } from "../content";
import { EMPTY_DETAILS, parseDetails, validateDetails } from "../myDetails";

describe("my birth details", () => {
  const good = { ...EMPTY_DETAILS, name: "Asha Devi", dob: "25-12-1990", tob: "06:05", pob: "Bhilai" };

  it("accepts complete details", () => {
    expect(validateDetails(good)).toEqual({});
  });

  it("says what is missing, and does not need a time when it is not known", () => {
    expect(Object.keys(validateDetails(EMPTY_DETAILS)).sort()).toEqual(["dob", "name", "pob", "tob"]);
    expect(validateDetails({ ...good, tob: "", timeUnknown: true })).toEqual({});
    expect(validateDetails({ ...good, dob: "31-02-1990" })).toEqual({ dob: "errDob" });
    expect(validateDetails({ ...good, tob: "25:99" })).toEqual({ tob: "errTob" });
  });

  it("reads only what it saved, and nothing from damaged data", () => {
    expect(parseDetails(null)).toBeNull();
    expect(parseDetails("{broken")).toBeNull();
    expect(parseDetails("[]")).toBeNull();
    expect(parseDetails(JSON.stringify(good))).toEqual(good);
    expect(parseDetails(JSON.stringify({ name: "A", gender: "robot", dob: 5, timeUnknown: "yes" }))).toEqual({ name: "A", gender: "MALE", dob: "", tob: "", timeUnknown: false, pob: "" });
  });
});

describe("help centre search", () => {
  const items = [
    { id: "1", questionEn: "How do I pay?", questionHi: "भुगतान कैसे करें?", answerEn: "By UPI", answerHi: "यूपीआई से" },
    { id: "2", questionEn: "When is my report ready?", questionHi: "रिपोर्ट कब मिलेगी?", answerEn: "In 3 days", answerHi: "3 दिन में" },
  ];
  it("searches question and answer in either language", () => {
    expect(filterFaq(items, "").map((i) => i.id)).toEqual(["1", "2"]);
    expect(filterFaq(items, "upi").map((i) => i.id)).toEqual(["1"]);
    expect(filterFaq(items, "रिपोर्ट").map((i) => i.id)).toEqual(["2"]);
    expect(filterFaq(items, "  PAY ").map((i) => i.id)).toEqual(["1"]);
    expect(filterFaq(items, "zzz")).toEqual([]);
  });
});
