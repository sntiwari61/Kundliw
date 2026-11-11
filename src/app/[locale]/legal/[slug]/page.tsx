import { setRequestLocale } from "next-intl/server";
import { RichText } from "@/components/content/RichText";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BlocksView } from "@/components/content/MediaView";
import { normalizeBlocks } from "@/lib/content/media";
import { ShieldCheck, Scale, FileText, ArrowLeft, Mail } from "lucide-react";
import { kendraEmail } from "@/lib/content/contact";
import { Link } from "@/i18n/routing";
import { legalContentFor } from "@/lib/legal/defaults";

interface LegalPageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}


export async function generateMetadata(props: LegalPageProps): Promise<Metadata> {
  const params = await props.params;

  const {
    locale,
    slug
  } = params;

  const isHindi = locale === "hi";
  const fullSlug = `legal/${slug}`;
  const page = await prisma.staticPage
    .findFirst({
      where: {
        OR: [{ slug: fullSlug }, { slug }],
      },
    })
    .catch(() => null);

  const shown = legalContentFor(slug, page && page.isActive ? page : null);
  const title = isHindi ? shown?.titleHi : shown?.titleEn;
  return {
    title: `${title || slug.toUpperCase()} • महर्षि कणाद ज्योतिष केंद्र`,
    description: isHindi
      ? "महर्षि कणाद ज्योतिष केंद्र की आधिकारिक नीतियां एवं शास्त्रसम्मत नियम।"
      : "Official policies and canonical standards of Maharshi Kanad Jyotish Kendra.",
  };
}

export default async function LegalPage(props: LegalPageProps) {
  const params = await props.params;
  setRequestLocale(params.locale);

  const {
    locale,
    slug
  } = params;

  const isHindi = locale === "hi";
  const fullSlug = `legal/${slug}`;
  const supportEmail = kendraEmail(
    (await prisma.adminSettings.findUnique({ where: { id: "default" }, select: { email: true } }).catch(() => null))?.email
  );

  const page = await prisma.staticPage
    .findFirst({
      where: {
        OR: [{ slug: fullSlug }, { slug }],
      },
    })
    .catch(() => null);

  // An inactive page is hidden; a page the admin has not edited shows the standard text
  const shown = legalContentFor(slug, page && page.isActive ? page : null);
  if ((page && !page.isActive) || !shown) {
    notFound();
  }

  const title = isHindi ? shown.titleHi : shown.titleEn;
  const content = isHindi ? shown.contentHi : shown.contentEn;

  return (
    <div className="w-full max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8 text-left space-y-8">
      {/* Breadcrumb / Back Link */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{isHindi ? "मुख्य पृष्ठ" : "Back to Home"}</span>
        </Link>
      </div>

      {/* Header */}
      <div className="border-b border-outline-variant/30 pb-6 space-y-2">
        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
          <Scale className="w-4 h-4 text-primary" />
          <span>{isHindi ? "विधिक एवं शास्त्रसम्मत नीतियां" : "Legal & Sanctum Canonical Terms"}</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-secondary">
          {title}
        </h1>
        <div className="flex items-center gap-2 text-[11px] text-outline pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-secondary" />
          <span>
            {isHindi
              ? "लागू कानूनों के अनुसार"
              : "In accordance with applicable laws"}
          </span>
        </div>
      </div>

      {/* Content Container */}
      <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-outline-variant/40 shadow-sm leading-relaxed text-sm sm:text-base text-on-surface space-y-3 space-y-4">
        <RichText text={content} />
      </div>

      <BlocksView blocks={normalizeBlocks(page?.blocks)} isHindi={isHindi} />

      <div className="p-4 rounded-xl bg-surface border border-outline-variant/40 text-sm text-on-surface flex flex-wrap items-center gap-x-3 gap-y-1">
        <Mail className="w-4 h-4 text-primary shrink-0" />
        <span>{isHindi ? "इस दस्तावेज़ के बारे में प्रश्न हों तो ईमेल करें:" : "Questions about this document? Email us:"}</span>
        <a href={`mailto:${supportEmail}`} className="font-semibold text-secondary hover:underline break-all">{supportEmail}</a>
      </div>

      {/* Ephemeris & Ethics Disclaimer Seal */}
      <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs text-on-surface-variant flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-secondary shrink-0" />
          <span>
            {isHindi
              ? "यह दस्तावेज महर्षि कणाद ज्योतिष केंद्र के मुख्य प्रशासक द्वारा अधिकृत है।"
              : "This document is authorized by Maharshi Kanad Jyotish Kendra administration."}
          </span>
        </div>
        <span className="font-mono text-[10px] text-outline">v2026.1</span>
      </div>
    </div>
  );
}

// Pages are saved the first time they are opened (no database reads during the build)
export function generateStaticParams() {
  return [];
}
