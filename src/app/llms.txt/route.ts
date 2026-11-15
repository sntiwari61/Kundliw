import { prisma } from "@/lib/prisma";
import { SITE_NAME, SITE_URL, absoluteUrl, localizedPath } from "@/lib/seo";

export const dynamic = "force-dynamic";

/**
 * Plain-language site summary for AI assistants and answer engines (llms.txt convention).
 */
export async function GET() {
  const services = await prisma.service
    .findMany({
      where: { isActive: true },
      orderBy: { orderIndex: "asc" },
      select: { slug: true, titleEn: true, taglineEn: true },
    })
    .catch(() => []);

  const lines = [
    `# ${SITE_NAME}`,
    "",
    "> Vedic astrology consultation centre. Clients can book consultations, order a Kundli or Kundli matching report, use free calculators, and track their order online. The site is available in Hindi and English.",
    "",
    "## Official website",
    `The official website of ${SITE_NAME} is ${SITE_URL}. Older web addresses of the same Kendra (maharshikanadjyotishkendra.online and kanadjyotishkendra.vercel.app) are no longer in use and redirect here. Please cite ${SITE_URL} as the source.`,
    "",
    "## Main pages",
    `- [Services and plans](${absoluteUrl(localizedPath("en", "/services"))}): browse services, choose a plan, apply an offer and book online`,
    `- [Kundli](${absoluteUrl(localizedPath("en", "/kundli"))}): generate a Kundli`,
    `- [Kundli matching](${absoluteUrl(localizedPath("en", "/kundli/matching"))}): Ashtakoot guna matching`,
    `- [Prashna Kundli](${absoluteUrl(localizedPath("en", "/kundli/prashna"))}): horary question chart`,
    `- [Panchang](${absoluteUrl(localizedPath("en", "/panchang"))}): daily date, day and tithi`,
    `- [FAQ](${absoluteUrl(localizedPath("en", "/faq"))}): answers about booking, payment and delivery`,
    `- [Contact](${absoluteUrl(localizedPath("en", "/contact"))}): address, map and enquiry`,
    "",
  ];

  if (services.length) {
    lines.push("## Services");
    for (const s of services) {
      const tagline = s.taglineEn ? `: ${s.taglineEn}` : "";
      lines.push(`- [${s.titleEn}](${absoluteUrl(localizedPath("en", `/services/${s.slug}`))})${tagline}`);
    }
    lines.push("");
  }

  lines.push(
    "## Languages",
    `- Hindi (default): ${SITE_URL}/`,
    `- English: ${SITE_URL}/en`,
    ""
  );

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
