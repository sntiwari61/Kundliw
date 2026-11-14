import { NextResponse } from "next/server";
import { isContentSection, loadContent } from "@/lib/mobile/content";

export const dynamic = "force-dynamic";

/** A public page of the website (about, founder, faq, gallery, blogs, testimonials, offers, contact) for the app. No sign-in needed. */
export async function GET(_req: Request, ctx: { params: Promise<{ section: string }> }) {
  const { section } = await ctx.params;
  if (!isContentSection(section)) return NextResponse.json({ error: "Not found." }, { status: 404 });
  try {
    return NextResponse.json(await loadContent(section), { headers: { "Cache-Control": "public, max-age=60" } });
  } catch (error) {
    console.error("Mobile content error:", error);
    return NextResponse.json({ error: "Could not load this page." }, { status: 500 });
  }
}
