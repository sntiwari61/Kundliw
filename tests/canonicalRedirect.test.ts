import { describe, it, expect } from "vitest";
import { canonicalRedirect } from "../src/lib/seo";

const SITE = "https://maharshikanadjyotishkendra.com";

describe("canonicalRedirect", () => {
  it("leaves the real address alone", () => {
    expect(canonicalRedirect("maharshikanadjyotishkendra.com", "/en/services", SITE)).toBeNull();
    expect(canonicalRedirect("MaharshiKanadJyotishKendra.com:443", "/", SITE)).toBeNull();
  });

  it("sends old addresses and www to the same page on the real address", () => {
    expect(canonicalRedirect("kanadjyotishkendra.vercel.app", "/en/faq?x=1", SITE)).toBe(`${SITE}/en/faq?x=1`);
    expect(canonicalRedirect("maharshikanadjyotishkendra.online", "/", SITE)).toBe(`${SITE}/`);
    expect(canonicalRedirect("www.maharshikanadjyotishkendra.com", "/about", SITE)).toBe(`${SITE}/about`);
  });

  it("does not touch unknown hosts such as localhost or an IP address", () => {
    expect(canonicalRedirect("localhost:3000", "/", SITE)).toBeNull();
    expect(canonicalRedirect("192.168.1.34:3100", "/", SITE)).toBeNull();
    expect(canonicalRedirect("", "/", SITE)).toBeNull();
    expect(canonicalRedirect(null, "/", SITE)).toBeNull();
  });

  it("does not redirect when the real address is itself one of the old ones", () => {
    expect(canonicalRedirect("kanadjyotishkendra.vercel.app", "/", "https://kanadjyotishkendra.vercel.app")).toBeNull();
  });
});
