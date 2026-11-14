import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { bookedSeatsByPackage, computeAvailability } from "@/lib/booking/packageAvailability";
import { activePlanWhere } from "@/lib/content/packages";
import { getGstSettings } from "@/lib/billing/gstSettings";

export const dynamic = "force-dynamic";

/**
 * Everything the app needs to show a service and take a booking: the active services with their
 * plans (price, delivery time, call length), the packages with seat availability, the GST rate
 * and the open call slots of the next two weeks. Prices are for display only: the server
 * calculates the real amount again when the order is created.
 */
export async function GET() {
  try {
    const services = await prisma.service.findMany({
      // Services paid on a partner website cannot be booked here, so the app does not list them
      where: { isActive: true, externalPayUrl: null },
      orderBy: { orderIndex: "asc" },
      include: {
        plans: { where: activePlanWhere, orderBy: { orderIndex: "asc" } },
        packages: { where: { isActive: true }, orderBy: { orderIndex: "asc" } },
      },
    });
    const booked = await bookedSeatsByPackage(services.flatMap((s) => s.packages.map((k) => k.id)));

    const shaped = services
      .map((s) => {
        const packageIds = new Set(s.packages.map((k) => k.id));
        // Plans of a package that is switched off are not offered
        const plans = s.plans.filter((p) => !p.packageId || packageIds.has(p.packageId));
        return {
          slug: s.slug,
          titleEn: s.titleEn,
          titleHi: s.titleHi,
          packages: s.packages.map((k) => ({
            id: k.id,
            titleEn: k.titleEn,
            titleHi: k.titleHi,
            availability: computeAvailability(k, booked[k.id] ?? 0),
          })),
          plans: plans.map((p) => ({
            id: p.id,
            packageId: p.packageId,
            slug: p.slug,
            titleEn: p.titleEn,
            titleHi: p.titleHi,
            pricePaise: p.pricePaise,
            originalPricePaise: p.originalPricePaise,
            deliveryDays: p.deliveryDays,
            pages: p.pages,
            hasCall: p.hasCall,
            callDurationMinutes: p.callDurationMinutes,
          })),
        };
      })
      .filter((s) => s.plans.length > 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const until = new Date(today);
    until.setDate(until.getDate() + 14);
    const rawSlots = await prisma.slot.findMany({
      where: { isActive: true, date: { gte: today, lte: until } },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });
    const slots = rawSlots
      .filter((s) => s.bookedCount < s.capacity)
      .map((s) => ({ id: s.id, date: s.date.toISOString().slice(0, 10), startTime: s.startTime, endTime: s.endTime }));

    const gst = await getGstSettings();
    return NextResponse.json(
      { services: shaped, slots, gstRateBasisPoints: gst.rateBasisPoints },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Mobile catalog error:", error);
    return NextResponse.json({ error: "Could not load the services." }, { status: 500 });
  }
}
