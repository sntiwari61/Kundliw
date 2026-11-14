import { NextResponse } from "next/server";
import { getBlogPost } from "@/lib/mobile/content";

export const dynamic = "force-dynamic";

/** One published article, in full. */
export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const post = await getBlogPost(slug);
  if (!post) return NextResponse.json({ error: "Article not found." }, { status: 404 });
  return NextResponse.json(post, { headers: { "Cache-Control": "public, max-age=60" } });
}
