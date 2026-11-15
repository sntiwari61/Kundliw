import createIntlMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { routing } from "./i18n/routing";
import { canonicalRedirect } from "@/lib/seo";

const handleI18nRouting = createIntlMiddleware(routing);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Old addresses (the previous domain, the Vercel address, www) go to the real address, permanently, so Google keeps one site
  const moved = canonicalRedirect(request.headers.get("x-forwarded-host") || request.headers.get("host"), `${pathname}${request.nextUrl.search}`);
  if (moved) return NextResponse.redirect(moved, 308);

  // Let API, static files, and Next.js internals pass untouched
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Short associate referral links: /r/<code> is handled by /api/r/<code>
  if (pathname.startsWith("/r/")) {
    return NextResponse.rewrite(new URL(`/api${pathname}`, request.url));
  }

  const locale = pathname.startsWith("/en") ? "en" : "hi";

  // 0. Optional DEMO_ACCESS_PASSWORD Gate
  const demoAccessPassword = process.env.DEMO_ACCESS_PASSWORD;
  if (demoAccessPassword && demoAccessPassword.trim() !== "") {
    const isDemoGate = pathname.includes("/demo-gate");
    if (!isDemoGate) {
      const demoCookie = request.cookies.get("demo_access")?.value;
      if (demoCookie !== demoAccessPassword) {
        const demoGateUrl = new URL(`/${locale}/demo-gate`, request.url);
        demoGateUrl.searchParams.set("callbackUrl", request.url);
        return NextResponse.redirect(demoGateUrl);
      }
    }
  }

  // 1. Role Guard: Admin route protection
  const isAdminRoute =
    pathname.includes("/admin") && !pathname.includes("/admin/login");

  if (isAdminRoute) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || token.role !== "ADMIN") {
      const signInUrl = new URL(`/${locale}/auth/signin`, request.url);
      signInUrl.searchParams.set("callbackUrl", request.url);
      return NextResponse.redirect(signInUrl);
    }
  }

  // 2. Booking Guard: Login required before booking per SRS
  const isBookingRoute = pathname.includes("/booking");
  if (isBookingRoute) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      const signInUrl = new URL(`/${locale}/auth/signin`, request.url);
      signInUrl.searchParams.set("callbackUrl", request.url);
      return NextResponse.redirect(signInUrl);
    }
  }

  return handleI18nRouting(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
