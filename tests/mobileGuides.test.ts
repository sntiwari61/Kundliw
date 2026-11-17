import { describe, it, expect, vi, beforeEach } from "vitest";

const db = vi.hoisted(() => ({ page: vi.fn(), visuals: vi.fn(), credential: vi.fn() }));

vi.mock("@/lib/prisma", () => ({ prisma: { staticPage: { findUnique: db.page }, credential: { findMany: db.credential } } }));
vi.mock("@/lib/guides/visuals", () => ({ loadGuideVisuals: db.visuals }));
vi.mock("@/lib/siteConfig/service", () => ({ getSection: vi.fn(async () => ({})), getActiveSocialLinks: vi.fn(async () => []) }));

import { getGuide, isAppGuide } from "@/lib/mobile/guides";
import { CONTENT_SECTIONS, loadContent } from "@/lib/mobile/content";

beforeEach(() => vi.clearAllMocks());

describe("mobile guides", () => {
  it("offers the user and associate guides only, never the admin guide", () => {
    expect(isAppGuide("user")).toBe(true);
    expect(isAppGuide("associate")).toBe(true);
    expect(isAppGuide("admin")).toBe(false);
    expect(isAppGuide("../x")).toBe(false);
  });

  it("uses the words the admin saved, else the standard guide, and attaches the pictures and videos", async () => {
    db.page.mockResolvedValue({ titleEn: "My guide", titleHi: "", contentEn: "1. Start\nHello", contentHi: "" });
    db.visuals.mockResolvedValue([{ kind: "image", labelEn: "Home", labelHi: "होम", url: "https://x.com/a.png" }]);
    const g = await getGuide("user");
    expect(g.titleEn).toBe("My guide");
    expect(g.titleHi).toBeTruthy(); // standard Hindi title
    expect(g.contentEn).toBe("1. Start\nHello");
    expect(g.contentHi.length).toBeGreaterThan(20); // standard Hindi text
    expect(g.visuals).toEqual([{ kind: "image", labelEn: "Home", labelHi: "होम", url: "https://x.com/a.png" }]);
  });

  it("still answers when the admin saved nothing and the database cannot be reached", async () => {
    db.page.mockRejectedValue(new Error("down"));
    db.visuals.mockResolvedValue([]);
    const g = await getGuide("associate");
    expect(g.contentEn.length).toBeGreaterThan(20);
  });
});

describe("mobile credentials", () => {
  it("is a public page of the app and lists only the Kendra's own stored files, with their kind in both languages", async () => {
    expect(CONTENT_SECTIONS).toContain("credentials");
    db.credential.mockResolvedValue([
      { id: "c1", kind: "GST", titleEn: "GST", titleHi: "जीएसटी", descriptionEn: null, descriptionHi: null, documentNumber: "22AAAA", fileUrl: "/api/storage/credentials/gst.pdf", fileName: "gst.pdf", mimeType: "application/pdf" },
      { id: "c2", kind: "WEIRD", titleEn: "Other", titleHi: "अन्य", descriptionEn: "d", descriptionHi: "d", documentNumber: null, fileUrl: "https://evil.example/x.pdf", fileName: "x.pdf", mimeType: "application/pdf" },
    ]);
    const out = (await loadContent("credentials")) as { items: { id: string; kindEn: string; kindHi: string; documentNumber: string | null }[] };
    expect(out.items.map((i) => i.id)).toEqual(["c1"]);
    expect(out.items[0]).toMatchObject({ kindEn: "GST registration", documentNumber: "22AAAA" });
    expect(out.items[0].kindHi).toBeTruthy();
  });
});
