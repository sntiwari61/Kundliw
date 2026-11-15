import { activePlanWhere } from "@/lib/content/packages";
import type { Metadata } from "next";
import { Poppins, Noto_Sans, Cormorant_Garamond, Noto_Serif_Devanagari } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { Header } from "@/components/layout/Header";
import { PageNavButtons } from "@/components/layout/PageNavButtons";
import { Footer } from "@/components/layout/Footer";
import { MarqueeStrip } from "@/components/layout/MarqueeStrip";
import { MobileNav } from "@/components/layout/MobileNav";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { FloatingActionBar } from "@/components/layout/FloatingActionBar";
import { ToolsProvider } from "@/components/providers/ToolsProvider";
import { IntroSplash } from "@/components/layout/IntroSplash";
import { themeCss } from "@/lib/siteConfig/theme";
import { kendraEmail } from "@/lib/content/contact";
import { OfferPopup } from "@/components/layout/OfferPopup";
import { getActiveSocialLinks, getLinkList, getSection } from "@/lib/siteConfig/service";
import { getDailyPanchang } from "@/lib/astro/panchangService";
import { BannerSlot } from "@/components/banners/BannerSlot";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { SmoothScrollProvider } from "@/components/providers/SmoothScrollProvider";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/guards";
import { BackCornerButton } from "@/components/layout/BackCornerButton";
import { MaintenanceGate } from "@/components/layout/MaintenanceGate";
import { isCorePageSlug } from "@/lib/content/pages";
import { sizedImage } from "@/lib/content/media";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE_NAME, SITE_NAME_HI, SITE_URL } from "@/lib/seo";
import "@/app/globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

// Headings use an elegant serif (Cormorant Garamond for English, Noto Serif for Hindi) for a classical Jyotish look.
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

const notoSerifDeva = Noto_Serif_Devanagari({
  subsets: ["devanagari"],
  weight: ["500", "600", "700"],
  variable: "--font-noto-serif-deva",
  display: "swap",
});

const notoSans = Noto_Sans({
  subsets: ["latin", "devanagari"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-sans",
  display: "swap",
});

const baseMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | ${SITE_NAME_HI}`,
    template: "%s",
  },
  description:
    "Vedic astrology consultations, Kundli preparation, Kundli matching and Prashna Kundli from Maharshi Kanad Jyotish Kendra, with online booking and order tracking in Hindi and English.",
  applicationName: SITE_NAME,
  // The tab icon: /icon.png is the default; an icon uploaded in Admin > Website settings > Logo replaces it (see generateMetadata).
  icons: { icon: "/icon.png", apple: "/icons/apple-touch-icon.png" },
  keywords: [
    "Vedic astrology",
    "Janam Kundli",
    "Kundli online",
    "free Kundli",
    "Kundli matching",
    "Prashn Kundli",
    "Jyotish consultation",
    "astrologer",
    "Vastu Shastra",
    "Puja",
    "Paath",
    "Yagya",
    "Panchang today",
    "Hindi Panchang",
    "जन्म कुंडली",
    "कुंडली मिलान",
    "प्रश्न कुंडली",
    "ज्योतिष परामर्श",
    "वास्तु शास्त्र",
    "आज का पंचांग",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} | ${SITE_NAME_HI}`,
    description:
      "Book Vedic astrology consultations, Kundli and Kundli matching online, and track your order until delivery.",
    locale: "hi_IN",
    alternateLocale: ["en_IN"],
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-image.jpg"],
    title: `${SITE_NAME} | ${SITE_NAME_HI}`,
    description:
      "Vedic astrology consultations, Kundli and Kundli matching with online booking.",
  },
};

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await props.params;
  const seo = await getSection("seo");
  const g = (k: string) => String(seo[k + (locale === "hi" ? "Hi" : "En")] || seo[k + "En"] || seo[k + "Hi"] || "").trim();
  const title = g("metaTitle");
  const description = g("metaDescription");
  const keywords = String(seo.keywords || "").split(",").map((k) => k.trim()).filter(Boolean);
  const image = String(seo.shareImage || "").trim();
  const verification = String(seo.googleVerification || "").trim();
  const bing = String(seo.bingVerification || "").trim();
  return {
    ...baseMetadata,
    ...(title ? { title: { default: title, template: "%s" } } : {}),
    ...(description ? { description } : {}),
    ...(keywords.length ? { keywords } : {}),
    ...(verification || bing ? { verification: { ...(verification ? { google: verification } : {}), ...(bing ? { other: { "msvalidate.01": bing } } : {}) } } : {}),
    ...(String((await getSection("logo")).faviconUrl || "").trim() ? { icons: { icon: String((await getSection("logo")).faviconUrl), apple: "/icons/apple-touch-icon.png" } } : {}),
    openGraph: {
      ...baseMetadata.openGraph,
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
      ...(image ? { images: [image] } : {}),
    },
  };
}

// Public pages are saved for up to a minute and served from the nearest edge; admin saves refresh them at once.
// Pages that need the signed-in visitor opt out themselves (they read the session, so they stay live).
export const revalidate = 60;

// No pages are built ahead of time (no database reads during the build); each page is saved the first time it is opened
export function generateStaticParams() {
  return [];
}

export default async function LocaleLayout(
  props: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
  }
) {
  const params = await props.params;

  const {
    locale
  } = params;

  const {
    children
  } = props;

  // Tells next-intl the language without reading request headers, so the page can be saved and reused
  setRequestLocale(locale);

  // All of the layout's database reads run together instead of one after another
  const [messages, topBanners, bottomBanners, marqueeItems, features, panchang, activeSocial, toolsCfg, menuPages, settings, catalogue, themeCfg, topbarCfg, floatCfg, introCfg, menuRows] = await Promise.all([
    getMessages(),
    prisma.banner
        .findMany({
          where: { isActive: true, position: "TOP" },
          orderBy: { orderIndex: "asc" },
        })
        .catch(() => []),
    prisma.banner
        .findMany({
          where: { isActive: true, position: "BOTTOM" },
          orderBy: { orderIndex: "asc" },
        })
        .catch(() => []),
    prisma.marqueeItem
        .findMany({
          where: { isActive: true },
          orderBy: { orderIndex: "asc" },
          select: {
            id: true,
            textEn: true,
            textHi: true,
            speedSec: true,
            fontSize: true,
            bgColor: true,
            textColor: true,
            position: true,
          },
        })
        .catch(() => []),
    getSection("features"),
    getDailyPanchang(),
    getActiveSocialLinks(),
    getSection("tools"),
    prisma.staticPage
        .findMany({ where: { isActive: true, showInMenu: true }, orderBy: { updatedAt: "asc" }, select: { slug: true, titleEn: true, titleHi: true }, take: 12 })
        .then((rows) => rows.filter((r) => !isCorePageSlug(r.slug)))
        .catch(() => []),
    prisma.adminSettings
        .findFirst({
          select: {
            phone1: true,
            email: true,
            addressEn: true,
            city: true,
            whatsappNumber: true,
            maintenanceMode: true,
            maintenanceMessageEn: true,
            maintenanceMessageHi: true,
            socialWhatsapp: true,
            socialFacebook: true,
            socialInstagram: true,
            socialTwitter: true,
            socialYoutube: true,
          },
        })
        .catch(() => null),
    prisma.service
        .findMany({
          where: { isActive: true },
          orderBy: { orderIndex: "asc" },
          select: { slug: true, titleEn: true, plans: { where: activePlanWhere, select: { titleEn: true, pricePaise: true } } },
        })
        .catch(() => []),
    getSection("theme"),
    getSection("topbar"),
    getSection("floating"),
    getSection("intro"),
    getLinkList("menu"),
  ]);
  const social = activeSocial.map(({ id, name, url }) => ({ id, name, url }));



  const themeStyles = themeCss(themeCfg);
  const introOn = introCfg.enabled !== false;
  const hiddenTools = [
    ...(toolsCfg.panchangEnabled === false ? ["/panchang"] : []),
    ...(toolsCfg.kundliEnabled === false ? ["/kundli", "/kundli/astrosage"] : []),
    ...(toolsCfg.matchingEnabled === false ? ["/kundli/matching"] : []),
    ...(features.showCredentialsLink === false ? ["/credentials"] : []),
    ...(features.showBlogLink === false ? ["/blogs"] : []),
  ];
  const topMarquee = marqueeItems.filter((m) => m.position === "TOP");
  const bottomMarquee = marqueeItems.filter((m) => m.position === "BOTTOM");


  const sameAs = social.map((l) => l.url).filter((u) => /^https?:\/\//.test(u));

  // The person behind the Kendra, so search and answer engines can name them (only when the founder page is filled in)
  const founderRow = await prisma.founderProfile.findUnique({ where: { id: "default" } }).catch(() => null);
  const founderOk = !!founderRow && founderRow.isActive && founderRow.nameEn.trim() !== "" && founderRow.nameEn !== "Founder Name";

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfessionalService",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        alternateName: SITE_NAME_HI,
        url: SITE_URL,
        logo: `${SITE_URL}/logo.png`,
        image: `${SITE_URL}/logo.png`,
        description:
          "Vedic astrology consultations, Kundli preparation, Kundli matching and Prashna Kundli with online booking.",
        ...(settings?.phone1 ? { telephone: settings.phone1 } : {}),
        email: kendraEmail(settings?.email),
        ...(settings?.addressEn || settings?.city
          ? {
              address: {
                "@type": "PostalAddress",
                ...(settings?.addressEn ? { streetAddress: settings.addressEn } : {}),
                ...(settings?.city ? { addressLocality: settings.city } : {}),
                addressCountry: "IN",
              },
            }
          : {}),
        areaServed: "IN",
        priceRange: "₹₹",
        knowsAbout: ["Vedic astrology", "Janam Kundli", "Kundli matching", "Prashna Kundli", "Panchang", "Puja and Vastu consultation"],
        ...(founderOk
          ? {
              founder: {
                "@type": "Person",
                name: founderRow!.nameEn,
                alternateName: founderRow!.nameHi,
                jobTitle: founderRow!.designationEn,
                url: `${SITE_URL}/en/founder`,
              },
            }
          : {}),
        mainEntityOfPage: `${SITE_URL}/en/about`,
        ...(catalogue.length
          ? {
              hasOfferCatalog: {
                "@type": "OfferCatalog",
                name: "Vedic astrology services",
                itemListElement: catalogue.map((svc) => ({
                  "@type": "OfferCatalog",
                  name: svc.titleEn,
                  url: `${SITE_URL}/en/services/${svc.slug}`,
                  itemListElement: svc.plans.map((p) => ({
                    "@type": "Offer",
                    name: p.titleEn,
                    price: (p.pricePaise / 100).toFixed(2),
                    priceCurrency: "INR",
                    availability: "https://schema.org/InStock",
                  })),
                })),
              },
            }
          : {}),
        availableLanguage: ["Hindi", "English"],
        ...(sameAs.length ? { sameAs } : {}),
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        inLanguage: ["hi", "en"],
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
    ],
  };

  return (
    <html lang={locale} className={`${poppins.variable} ${notoSans.variable} ${cormorant.variable} ${notoSerifDeva.variable} w-full max-w-full overflow-x-clip`} suppressHydrationWarning>
      <head>
        {themeStyles && <style dangerouslySetInnerHTML={{ __html: themeStyles }} />}
        {/* Opening screen: skipped at once for returning visits and for every page except the home page */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              (introOn ? '' : 'document.documentElement.classList.add("intro-seen");') + 'try{if(!/^\\/(hi|en)?\\/?$/.test(location.pathname)||sessionStorage.getItem("kjk_intro_seen")==="1")document.documentElement.classList.add("intro-seen")}catch(e){}',
          }}
        />
      </head>
      <body className="bg-surface font-sans text-on-surface antialiased flex flex-col min-h-screen w-full max-w-full overflow-x-clip relative">
        <JsonLd data={structuredData} />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <GoogleAnalytics />
          <AuthProvider>
          <ToolsProvider hidden={hiddenTools}>
            <IntroSplash
              isHindi={locale === "hi"}
              enabled={introOn}
              seconds={Number(introCfg.stayTime) || 7}
              title={String(introCfg.titleEn || "")}
              titleHi={String(introCfg.titleHi || "")}
              tagline={String(introCfg[locale === "hi" ? "taglineHi" : "taglineEn"] || "")}
              sub={String(introCfg[locale === "hi" ? "subHi" : "subEn"] || "")}
              symbol={String(introCfg.symbol || "")}
              logo={String(introCfg.logoImage ?? "")}
              welcomeHi={String(introCfg.welcomeHi || "")}
              welcomeEn={String(introCfg.welcomeEn || "")}
              mantra={String(introCfg.mantra || "")}
            />
          <SmoothScrollProvider>
            <Header
              topbar={topbarCfg as Record<string, boolean | string | number>}
              menu={menuRows.map((m) => ({ href: m.href, labelEn: m.labelEn, labelHi: m.labelHi }))}
              phone={settings?.phone1 ?? undefined}
              pages={menuPages.map((p) => ({ href: `/pages/${p.slug}`, labelEn: p.titleEn, labelHi: p.titleHi }))}
              panchang={panchang} social={social} logoUrl={sizedImage(String((await getSection("logo")).logoUrl || ""), 160)} />
            <div className="pt-[116px] w-full max-w-full overflow-x-hidden">
              <BannerSlot position="TOP" initialBanners={topBanners} />
            </div>
            {topMarquee.length > 0 && <MarqueeStrip items={topMarquee} position="TOP" />}
            <BackCornerButton />
            <main className="flex-1 w-full max-w-full overflow-x-clip pb-6 xl:pb-0">
              <PageNavButtons />
              <MaintenanceGate
                on={!!settings?.maintenanceMode}
                isAdmin={settings?.maintenanceMode ? (await getCurrentUser())?.role === "ADMIN" : false}
                isHindi={locale === "hi"}
                messageEn={settings?.maintenanceMessageEn ?? ""}
                messageHi={settings?.maintenanceMessageHi ?? ""}
              >
                {children}
              </MaintenanceGate>
            </main>
            <BannerSlot position="BOTTOM" initialBanners={bottomBanners} />
            <MarqueeStrip items={bottomMarquee} position="BOTTOM" />
            <div className="pb-32 xl:pb-14">
              <Footer />
            </div>
            <MobileNav />
            <OfferPopup />
            {features.showFloatingButtons !== false && (
            <FloatingActionBar
              phone={String(floatCfg.callNumber || "").trim() || settings?.phone1 || undefined}
              whatsappNumber={
                String(floatCfg.whatsappNumber || "").trim() ||
                settings?.socialWhatsapp ||
                settings?.whatsappNumber ||
                settings?.phone1 ||
                undefined
              }
              show={{ call: floatCfg.showCall !== false, whatsapp: floatCfg.showWhatsapp !== false, ai: floatCfg.showAi !== false, chat: floatCfg.showChat !== false, askBar: floatCfg.showAskBar !== false }}
              whatsappMessage={{ en: String(floatCfg.whatsappMessageEn || ""), hi: String(floatCfg.whatsappMessageHi || "") }}
            />
            )}
          </SmoothScrollProvider>
          </ToolsProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
