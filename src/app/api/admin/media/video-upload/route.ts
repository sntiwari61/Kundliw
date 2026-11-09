import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { guardApiAdmin } from "@/lib/auth/guards";
import { validateCsrfOrigin } from "@/lib/auth/csrf";

export const dynamic = "force-dynamic";

/**
 * Full video files go from the admin's browser straight to a PUBLIC Vercel Blob store, so they are
 * not limited by the 4.5 MB request size of the server. The store's token is VIDEO_BLOB_READ_WRITE_TOKEN
 * (kept apart from the private store used for documents).
 */
const TOKEN = () => process.env.VIDEO_BLOB_READ_WRITE_TOKEN || "";
const MAX_VIDEO_BYTES = 500 * 1024 * 1024;
const ALLOWED_TYPES = ["video/mp4", "video/webm", "video/quicktime", "video/ogg", "video/x-m4v"];

/** Tells the admin screen whether video upload is switched on. */
export async function GET() {
  const guard = await guardApiAdmin();
  if (!guard.ok) return guard.errorResponse;
  return NextResponse.json({ enabled: !!TOKEN(), maxMb: MAX_VIDEO_BYTES / (1024 * 1024) });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as HandleUploadBody;

    // Everything needs a signed-in admin, except Vercel's own signed "upload finished" call.
    if (body.type !== "blob.upload-completed") {
      const guard = await guardApiAdmin();
      if (!guard.ok) return guard.errorResponse;
      const csrf = validateCsrfOrigin(request);
      if (!csrf.isValid) return csrf.errorResponse;
    }

    if (!TOKEN()) {
      return NextResponse.json({ error: "Video upload is not set up yet. Add VIDEO_BLOB_READ_WRITE_TOKEN." }, { status: 503 });
    }

    const json = await handleUpload({
      token: TOKEN(),
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith("videos/") || pathname.includes("..")) {
          throw new Error("Invalid upload path.");
        }
        return {
          allowedContentTypes: ALLOWED_TYPES,
          maximumSizeInBytes: MAX_VIDEO_BYTES,
          addRandomSuffix: true,
        };
      },
    });
    return NextResponse.json(json);
  } catch (error) {
    console.error("Video upload token failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Video upload failed" }, { status: 400 });
  }
}
