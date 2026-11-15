import { NextResponse } from "next/server";
import { loadHome } from "@/lib/mobile/home";

export const dynamic = "force-dynamic";

/** The content of the app's Home screen (public, no sign-in). */
export async function GET() {
  try {
    return NextResponse.json(await loadHome(), { headers: { "Cache-Control": "public, max-age=60" } });
  } catch (error) {
    console.error("Mobile home error:", error);
    return NextResponse.json({ error: "Could not load the home screen." }, { status: 500 });
  }
}
