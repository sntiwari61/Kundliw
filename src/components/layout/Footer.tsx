import { getLocale, getTranslations } from "next-intl/server";
import { SocialLinks } from "@/components/content/SocialLinks";
import { Link } from "@/i18n/routing";
import { getLinkList, getSection } from "@/lib/siteConfig/service";
import { RichText } from "@/components/content/RichText";
import { safeHref } from "@/lib/content/richText";
import { prisma } from "@/lib/prisma";
import { kendraEmail } from "@/lib/content/contact";
import { ownKundliHref } from "@/lib/content/ownKundli";
import { isCorePageSlug } from "@/lib/content/pages";
import { LocationMap } from "@/components/content/LocationMap";
import QRCode from "qrcode";
import { ExternalLink, Phone, Mail, Clock, Globe, HelpCircle, MessageSquare, Headphones, Download, Smartphone } from "lucide-react";
import { sizedImage } from "@/lib/content/media";
import { LEGAL_DEFAULT_SLUGS } from "@/lib/legal/defaults";

export async function Footer() {
  const locale = await getLocale();
  const t = await getTranslations("footer");
  const tCommon = await getTranslations("common");
  const tNav = await getTranslations("nav");
  const tools = await getSection("tools");
  const featureCfg = await getSection("features");
  const extraLinks = await getLinkList("footerLinks");
  const general = await getSection("general");
  const logoCfg = await getSection("logo");
  const legalCfg = await getSection("legal");
  const business = await getSection("business");
  const pickG = (cfg: Record<string, string | boolean | number>, k: string) => String(cfg[k + (locale === "hi" ? "Hi" : "En")] || "").trim();

  // Fetch admin settings for live contact numbers, address, and social links
  const settingsP = prisma.adminSettings
    .findUnique({
      where: { id: "default" },
    })
    .catch(() => null);

  // Custom pages the admin chose to list under Quick Links
  const footerPagesP = prisma.staticPage
    .findMany({
      where: { isActive: true, showInFooter: true },
      orderBy: { updatedAt: "asc" },
      select: { slug: true, titleEn: true, titleHi: true },
    })
    .then((rows) => rows.filter((r) => !isCorePageSlug(r.slug)))
    .catch(() => []);

  // Legal pages are listed only when they exist and are switched on, so no footer link leads to a missing page
  const LEGAL_PAGES: Array<{ slug: string; label: string }> = [
    { slug: "privacy", label: t("privacyLink") },
    { slug: "terms", label: t("termsLink") },
    { slug: "refund", label: locale === "hi" ? "धनवापसी नीति" : "Refund Policy" },
    { slug: "cancellation", label: locale === "hi" ? "रद्दीकरण नीति" : "Cancellation Policy" },
    { slug: "platform-guidelines", label: locale === "hi" ? "प्लेटफ़ॉर्म दिशानिर्देश" : "Platform Guidelines" },
    { slug: "member-agreement", label: locale === "hi" ? "सदस्य अनुबंध" : "Member Agreement" },
    { slug: "rules-regulations", label: locale === "hi" ? "नियम एवं विनियम" : "Rules & Regulations" },
    { slug: "ephemeris-sources", label: t("ephemerisLink") },
  ];
  const livePagesP = prisma.staticPage
    .findMany({ where: { slug: { in: LEGAL_PAGES.flatMap((l) => [`legal/${l.slug}`, l.slug]) } }, select: { slug: true, isActive: true } })
    .then((rows) => {
      const live = new Set(rows.filter((r) => r.isActive).map((r) => r.slug.replace(/^legal\//, "")));
      const hidden = new Set(rows.filter((r) => !r.isActive).map((r) => r.slug.replace(/^legal\//, "")));
      // A page the admin has not written yet shows the standard text, so it is listed too
      for (const d of LEGAL_DEFAULT_SLUGS) if (!hidden.has(d)) live.add(d);
      return live;
    })
    .catch(() => null);
  // The three database reads run together
  const [settings, footerPages, livePages] = await Promise.all([settingsP, footerPagesP, livePagesP]);
  const legalLinks = livePages ? LEGAL_PAGES.filter((l) => livePages.has(l.slug)) : LEGAL_PAGES.slice(0, 2);

  // Android app: the admin's Mobile app settings (Google Play, App Store, direct APK) or the older single link
  const appCfg = await getSection("mobileApp");
  const playUrl = String(appCfg.playStoreUrl || "").trim();
  const storeUrl = String(appCfg.appStoreUrl || "").trim();
  const apkUrl = String(appCfg.apkUrl || "").trim();
  const primaryAppUrl = playUrl || apkUrl || storeUrl || String(settings?.appDownloadUrl || "").trim();
  const showApp = appCfg.enabled !== false && Boolean(primaryAppUrl);
  const appQr = showApp ? await QRCode.toDataURL(primaryAppUrl, { margin: 1, width: 220, color: { dark: "#641E2B", light: "#FFFFFF" } }).catch(() => null) : null;
  const appText = pickG(appCfg, "appText");

  const phone1 = settings?.phone1 || "+91 98279 91224";
  const phone2 = settings?.phone2;
  const email = kendraEmail(settings?.email);
  const addressLine1 =
    (locale === "hi"
      ? settings?.addressHi || settings?.addressEn
      : settings?.addressEn || settings?.addressHi) || "";

  const wa = String(settings?.whatsappNumber || phone1 || "").replace(/[^\d]/g, "");
  const hi = locale === "hi";
  const mapCfg = await getSection("mapPage");
  const showBand = mapCfg.showFooterBand !== false;
  const mapTitle = (hi ? settings?.mapLabelHi : settings?.mapLabelEn) || (hi ? "हमारा स्थान" : "Find us");
  const helpCards: Array<{ href: string; external?: boolean; icon: typeof Phone; title: string; body: string }> = [
    { href: "/help", icon: HelpCircle, title: hi ? "सहायता" : "Help", body: hi ? "सामान्य प्रश्न और बुकिंग में मदद" : "Answers and help with booking" },
    { href: "/contact#enquiry", icon: MessageSquare, title: pickG(mapCfg, "enquiryLabel") || (hi ? "पूछताछ" : "Enquiry"), body: hi ? "अपनी जिज्ञासा हमें भेजें" : "Send us your question" },
  ];

  return (
    <>
    {showBand && (
    <section aria-label={hi ? "स्थान और सहायता" : "Location and support"} className="w-full bg-gradient-to-b from-gold/10 via-saffron/5 to-maroon/5 border-t-2 border-gold/60">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-8 grid grid-cols-1 lg:grid-cols-5 gap-6 text-left">
        <div className="lg:col-span-3 min-w-0">
          <LocationMap settings={settings || {}} title={mapTitle} address={addressLine1} isHindi={hi} />
        </div>
        <div className="lg:col-span-2 rounded-2xl border border-maroon/20 border-t-4 border-t-saffron bg-gradient-to-br from-gold/20 via-on-maroon to-saffron/10 p-5 space-y-4 lg:mt-8 lg:self-stretch shadow-sm">
          <h2 className="font-serif text-xl font-bold text-maroon pb-2 border-b border-maroon/15">{hi ? "सहायता, पूछताछ एवं सहयोग" : "Help, Enquiry & Support"}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {helpCards.map((c) => (
              <Link key={c.href} href={c.href} className="rounded-xl border border-maroon/20 bg-white/60 p-3 hover:bg-gold/25 hover:border-saffron/60 transition-colors min-h-[44px]">
                <div className="flex items-center gap-2 font-bold text-secondary text-sm">
                  <c.icon className="w-5 h-5 text-saffron" aria-hidden="true" />
                  {c.title}
                </div>
                <p className="text-xs text-on-surface-variant mt-1">{c.body}</p>
              </Link>
            ))}
          </div>
          <div>
            <div className="flex items-center gap-2 font-bold text-maroon text-sm mb-2 pt-3 border-t border-maroon/15">
              <Headphones className="w-5 h-5 text-saffron" aria-hidden="true" />
              {pickG(mapCfg, "supportLabel") || (hi ? "सहयोग (संपर्क)" : "Support")}
            </div>
            <ul className="space-y-2 text-sm">
              {[phone1, phone2].filter(Boolean).map((p) => (
                <li key={p}>
                  <a href={`tel:${String(p).replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-2 min-h-[44px] font-semibold text-on-surface hover:text-primary">
                    <Phone className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                    {p}
                  </a>
                </li>
              ))}
              {wa && (
                <li>
                  <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 min-h-[44px] font-semibold text-on-surface hover:text-primary">
                    <MessageSquare className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                    WhatsApp
                  </a>
                </li>
              )}
              {email && (
                <li>
                  <a href={`mailto:${email}`} className="inline-flex items-center gap-2 min-h-[44px] font-semibold text-on-surface hover:text-primary break-all">
                    <Mail className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                    {email}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </section>
    )}
    <footer className="w-full bg-[rgb(var(--footer-bg-rgb,128_0_0))] text-on-maroon border-t-4 border-gold pt-8 pb-6 text-left">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 xl:gap-8 pb-8 border-b border-gold/40 text-left">
          {/* Col 1: Identity & Sanctum Address with Logo */}
          <div className="space-y-3">
            <Link href="/" aria-label={t("title")} className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={sizedImage(String(logoCfg.logoUrl || ""), 160) || "/logo-small.webp"} alt={t("title")} width={72} height={54} className="h-14 w-auto rounded-md bg-surface shrink-0" />
              <div className="flex flex-col">
                <span className="font-serif text-base font-bold text-white leading-tight">
                  {t("title")}
                </span>
                <span className="text-[10px] uppercase tracking-widest text-white font-bold">
                  {pickG(general, "tagline") || tCommon("tagline")}
                </span>
              </div>
            </Link>
            <div className="text-xs text-on-maroon leading-relaxed space-y-2 [&_a]:!text-white [&_a]:underline">
              <RichText text={pickG(general, "footerNote") || t("bio")} />
            </div>
            {(pickG(business, "businessName") || business.ownerName || business.msmeNumber || Number(business.foundedYear) > 0) && (
              <p className="text-[11px] text-on-maroon/80">
                {[pickG(business, "businessName"), business.ownerName ? `${locale === "hi" ? "संचालक" : "Proprietor"}: ${business.ownerName}` : "", business.msmeNumber ? `MSME: ${business.msmeNumber}` : "", Number(business.foundedYear) > 0 ? `${locale === "hi" ? "स्थापना" : "Since"} ${business.foundedYear}` : ""].filter(Boolean).join(" · ")}
              </p>
            )}
            {addressLine1 && (
            <div className="text-xs text-on-maroon space-y-1 pt-1">
              <div className="font-semibold text-white uppercase tracking-wider text-[11px]">
                {t("campusLabel")}
              </div>
              <div>{addressLine1}</div>
              {settings?.city && (
                <div className="italic text-on-maroon/80">
                  {settings.city} ({settings.latitude?.toFixed(4)}°N, {settings.longitude?.toFixed(4)}°E)
                </div>
              )}
            </div>
            )}
          </div>

          {/* Col 2: Quick Links (Tools & Services) */}
          <div>
            <div className="font-serif text-base lg:text-lg font-bold text-white mb-3 uppercase tracking-wider">
              {t("servicesTitle")}
            </div>
            <ul className="space-y-1.5 text-xs text-on-maroon">
              <li>
                <Link href="/services" className="hover:text-white hover:underline transition-colors block py-0.5">
                  {tNav("services")}
                </Link>
              </li>
              <li>
                <Link href="/services#packages" className="hover:text-white hover:underline transition-colors block py-0.5">
                  {locale === "hi" ? "पैकेज" : "Packages"}
                </Link>
              </li>
              <li>
                <Link href="/services#plans" className="hover:text-white hover:underline transition-colors block py-0.5">
                  {tNav("pricingPlansShort")}
                </Link>
              </li>
              {(
<li>
                <Link href={ownKundliHref("/kundli") as never} className="hover:text-white hover:underline transition-colors block py-0.5">
                  {tNav("kundli")}
                </Link>
              </li>
)}
              {(
<li>
                <Link href={ownKundliHref("/kundli/matching") as never} className="hover:text-white hover:underline transition-colors block py-0.5">
                  {tNav("kundliMatching")}
                </Link>
              </li>
)}
              <li>
                <Link href={ownKundliHref("/kundli/prashna") as never} className="hover:text-white hover:underline transition-colors block py-0.5">
                  {tNav("prashna")}
                </Link>
              </li>
              {tools.panchangEnabled !== false && (
<li>
                <Link href="/panchang" className="hover:text-white hover:underline transition-colors block py-0.5">
                  {tNav("panchang")}
                </Link>
              </li>
)}
              <li>
                <Link href="/other-services" className="hover:text-white hover:underline transition-colors block py-0.5">
                  {tNav("otherServices")}
                </Link>
              </li>
              <li>
                <Link href="/kundli/astrosage" className="hover:text-white hover:underline transition-colors block py-0.5">
                  {tNav("astrosageTool")}
                </Link>
              </li>
              <li>
                <Link href="/vault" className="hover:text-white hover:underline transition-colors block py-0.5">
                  {tNav("vault")}
                </Link>
              </li>
              {footerPages.map((fp) => (
                <li key={fp.slug}>
                  <Link href={`/pages/${fp.slug}` as never} className="hover:text-white hover:underline transition-colors block py-0.5">
                    {locale === "hi" ? fp.titleHi : fp.titleEn}
                  </Link>
                </li>
              ))}
              {showApp && (
                <li>
                  <Link href="/app" className="hover:text-white hover:underline transition-colors block py-0.5">
                    {locale === "hi" ? "एंड्रॉइड ऐप" : "Android App"}
                  </Link>
                </li>
              )}
            </ul>

            {/* Social media pages added in Admin → Website settings, shown right under Quick Links */}
            <SocialLinks tone="light" className="pt-4" />
          </div>

          {/* Col 2b: Legal Pages, beside Quick Links, every legal page listed */}
          <div>
            <div className="font-serif text-base lg:text-lg font-bold text-white mb-3 uppercase tracking-wider">
              {locale === "hi" ? "लीगल पेजेस" : "Legal Pages"}
            </div>
            <ul className="space-y-1.5 text-xs text-on-maroon">
            {featureCfg.showCredentialsLink !== false && (
              <li>
                <Link href="/credentials" className="hover:text-white hover:underline transition-colors block py-0.5">
                  {tNav("credentials")}
                </Link>
              </li>
            )}
            {legalLinks.map((l) => (
              <li key={l.slug}>
                <Link href={`/legal/${l.slug}`} className="hover:text-white hover:underline transition-colors block py-0.5">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          </div>

          {/* Col 3: Lineage & Kendra */}
          <div>
            <div className="font-serif text-base lg:text-lg font-bold text-white mb-3 uppercase tracking-wider">
              {tNav("about")} &amp; केंद्र
            </div>
            <ul className="space-y-1.5 text-xs text-on-maroon">
              <li>
                <Link href="/about" className="hover:text-white hover:underline transition-colors block py-0.5">
                  {tNav("about")}
                </Link>
              </li>
              <li>
                <Link href="/founder" className="hover:text-white hover:underline transition-colors block py-0.5">
                  {tNav("founder")}
                </Link>
              </li>
              <li>
                <Link href="/gallery" className="hover:text-white hover:underline transition-colors block py-0.5">
                  {tNav("gallery")}
                </Link>
              </li>
              {featureCfg.showBlogLink !== false && (
<li>
                <Link href="/blogs" className="hover:text-white hover:underline transition-colors block py-0.5">
                  {tNav("blogs")}
                </Link>
              </li>
)}
              <li>
                <Link href="/testimonials" className="hover:text-white hover:underline transition-colors block py-0.5">
                  {tNav("testimonials")}
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-white hover:underline transition-colors block py-0.5">
                  {tNav("help")}
                </Link>
              </li>
              <li>
                <Link href="/track" className="hover:text-white hover:underline transition-colors block py-0.5">
                  {tNav("tracker")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Sister Portals & Legal Pages */}
          <div className="space-y-4">
            <div>
              <div className="font-serif text-base lg:text-lg font-bold text-white mb-3 uppercase tracking-wider">
                सहयोगी सेवाएँ • Sister Portals
              </div>
              <ul className="space-y-1.5 text-xs">
                <li>
                  <a
                    href="https://bharatdarshanmpcg.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-white hover:underline font-medium"
                  >
                    <span>Bharat Darshan MPCG</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://vindhyavivahsanskar.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-white hover:underline font-medium"
                  >
                    <span>Vindhya Vivah Sanskar</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </li>
              </ul>
            </div>

          </div>

          {/* Col 5: Helpline & Support Contact */}
          <div className="min-w-0">
            <div className="font-serif text-base lg:text-lg font-bold text-white mb-3 uppercase tracking-wider">
              {t("contactTitle")}
            </div>
            <ul className="space-y-1.5 text-xs text-on-maroon">
              {phone1 && (
                <li>
                  <a href={`tel:${phone1.replace(/\s+/g, "")}`} className="hover:text-white hover:underline font-semibold text-on-maroon block">
                    {phone1}
                  </a>
                </li>
              )}
              {phone2 && (
                <li>
                  <a href={`tel:${phone2.replace(/\s+/g, "")}`} className="hover:text-white hover:underline text-on-maroon block">
                    {phone2}
                  </a>
                </li>
              )}
              {email && (
                <li>
                  <a href={`mailto:${email}`} className="hover:text-white hover:underline block break-all">
                    {email}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        {showApp && (
          <section aria-label={locale === "hi" ? "ऐप डाउनलोड" : "Download the app"} className="my-6 rounded-xl border border-gold/40 bg-black/15 p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 min-w-0">
              <div className="flex items-center gap-2 font-serif text-lg font-bold text-white">
                <Smartphone className="w-5 h-5 text-gold" aria-hidden="true" />
                {locale === "hi" ? "हमारा एंड्रॉइड ऐप डाउनलोड करें" : "Download Our Android App"}
              </div>
              <p className="text-sm text-on-maroon">
                {appText || (locale === "hi" ? "बुकिंग करें, ऑर्डर ट्रैक करें और अपडेट पाएँ, अपने फ़ोन पर।" : "Book services, track orders and get updates on your phone.")}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                {(playUrl || primaryAppUrl) && (
                  <a
                    href={playUrl || primaryAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 min-h-[44px] px-5 rounded-lg bg-gold text-on-gold font-bold text-sm hover:opacity-90"
                  >
                    <Download className="w-4 h-4" aria-hidden="true" />
                    {playUrl ? (locale === "hi" ? "Google Play पर पाएँ" : "Get it on Google Play") : locale === "hi" ? "ऐप डाउनलोड करें" : "Download the app"}
                  </a>
                )}
                {storeUrl && (
                  <a href={storeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 min-h-[44px] px-5 rounded-lg border border-gold text-white font-bold text-sm hover:bg-white/10">
                    <Download className="w-4 h-4" aria-hidden="true" />
                    App Store
                  </a>
                )}
                {apkUrl && playUrl && (
                  <a href={apkUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-on-maroon underline underline-offset-2 hover:text-white">
                    {locale === "hi" ? "सीधा APK डाउनलोड" : "Direct APK download"}
                  </a>
                )}
              </div>
            </div>
            {appQr && (
              <a href={primaryAppUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 self-start md:self-auto text-center text-xs text-on-maroon" aria-label={locale === "hi" ? "ऐप डाउनलोड" : "Download the app"}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={appQr} alt={locale === "hi" ? "ऐप डाउनलोड के लिए QR कोड" : "QR code to download the app"} width={120} height={120} className="h-28 w-28 rounded-lg bg-white p-1" />
                <span className="block mt-1">{locale === "hi" ? "स्कैन करें / क्लिक करें" : "Scan / click to download"}</span>
              </a>
            )}
          </section>
        )}

        {extraLinks.length > 0 && (
          <nav aria-label={locale === "hi" ? "और लिंक" : "More links"} className="py-4 border-b border-gold/30 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
            <span className="font-semibold text-white uppercase tracking-wider text-[11px]">{locale === "hi" ? "और लिंक" : "More links"}</span>
            {extraLinks.map((l, i) => {
              const ok = safeHref(l.href);
              if (!ok) return null;
              const label = (locale === "hi" ? l.labelHi || l.labelEn : l.labelEn || l.labelHi) || l.href;
              return (
                <a key={i} href={ok.href} {...(ok.external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="text-on-maroon hover:text-white hover:underline underline-offset-2 hover:underline">
                  {label}
                </a>
              );
            })}
          </nav>
        )}

        {/* Bottom Bar: Broadsheet Copyright & Lineage Seal */}
        <div className="pt-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-on-maroon">
          <div className="text-left">
            {pickG(general, "copyright") || t("copyright", { year: new Intl.NumberFormat(locale === "hi" ? "hi-IN-u-nu-deva" : "en-IN", { useGrouping: false }).format(new Date().getFullYear()) })}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold">दृग्गणित सिद्धान्त</span>
            <span>({t("standardBadge")})</span>
          </div>
        </div>
        {pickG(legalCfg, "disclaimer") && (
          <p className="pt-3 text-[11px] leading-relaxed text-on-maroon/80">{pickG(legalCfg, "disclaimer")}</p>
        )}
      </div>
    </footer>
    </>
  );
}