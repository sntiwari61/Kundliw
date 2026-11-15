import { NextResponse } from "next/server";
import { loadAppConfig } from "@/lib/mobile/home";

export const dynamic = "force-dynamic";

/** Switches the app checks when it opens: maintenance mode, lowest allowed version, booking on or off. */
export async function GET() {
  try {
    return NextResponse.json(await loadAppConfig(), { headers: { "Cache-Control": "public, max-age=30" } });
  } catch (error) {
    console.error("Mobile app-config error:", error);
    return NextResponse.json({ error: "Could not load the app settings." }, { status: 500 });
  }
}
