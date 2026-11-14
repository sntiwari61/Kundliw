import { NextResponse } from "next/server";
import { loadTools } from "@/lib/mobile/tools";

export const dynamic = "force-dynamic";

/** Which of the Panchang, Kundli and Matching tools are on, and their addresses in both languages. No sign-in needed. */
export async function GET() {
  try {
    return NextResponse.json(await loadTools(), { headers: { "Cache-Control": "public, max-age=60" } });
  } catch (error) {
    console.error("Mobile tools error:", error);
    return NextResponse.json({ error: "Could not load the tools." }, { status: 500 });
  }
}
