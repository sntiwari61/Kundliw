import { isValidEmail } from "../validation";

describe("email check on the phone", () => {
  it("accepts ordinary addresses", () => {
    expect(isValidEmail("asha@example.com")).toBe(true);
    expect(isValidEmail("  a.b+c@mail.co.in ")).toBe(true);
  });
  it("refuses what cannot be an address", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("asha")).toBe(false);
    expect(isValidEmail("asha@")).toBe(false);
    expect(isValidEmail("asha@example")).toBe(false);
    expect(isValidEmail("as ha@example.com")).toBe(false);
  });
});
