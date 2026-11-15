import { safeHref } from "@/lib/content/richText";

/**
 * Website settings the super admin can change without touching code.
 * Each section is a list of simple fields; one generic screen renders them all.
 * Pure module (no database) so it can be shared by the admin screen, the API and tests.
 */

export type FieldType = "text" | "textarea" | "url" | "link" | "toggle" | "number" | "color" | "image";

export interface FieldDef {
  key: string;
  en: string;
  hi: string;
  type: FieldType;
  max?: number;
  def?: string | boolean | number;
  help?: string;
  /** Text boxes that accept links ([words](address)) and bold (**words**). */
  rich?: boolean;
}

export interface SectionDef {
  id: string;
  en: string;
  hi: string;
  noteEn?: string;
  noteHi?: string;
  /** Sections that only point to another admin screen. */
  link?: { href: string; en: string; hi: string };
  fields: FieldDef[];
}

const bi = (key: string, en: string, hi: string, type: FieldType = "text", max = 300, def?: string | boolean | number, rich = false): FieldDef[] => [
  { key: `${key}En`, en: `${en} (English)`, hi: `${hi} (अंग्रेज़ी)`, type, max, def, rich },
  { key: `${key}Hi`, en: `${en} (Hindi)`, hi: `${hi} (हिंदी)`, type, max, rich },
];

export const SECTIONS: SectionDef[] = [
  {
    id: "logo",
    en: "Logo",
    hi: "लोगो",
    noteEn: "Upload a logo with Admin → Media (any image), then paste its address here. Leave empty to use the default logo.",
    noteHi: "लोगो बदलने के लिए इमेज अपलोड करके उसका पता यहाँ डालें। खाली छोड़ने पर पुराना लोगो रहेगा।",
    fields: [
      { key: "logoUrl", en: "Logo image", hi: "लोगो इमेज", type: "image" },
      { key: "faviconUrl", en: "Browser tab icon", hi: "ब्राउज़र आइकन", type: "image" },
    ],
  },
  {
    id: "home",
    en: "Home page",
    hi: "होम पेज",
    fields: [
      ...bi("announcement", "Highlight strip below the top banner", "ऊपर की विशेष पट्टी", "text", 200),
      { key: "showSocialStrip", en: "Show social media row on the home page", hi: "होम पेज पर सोशल मीडिया दिखाएँ", type: "toggle", def: true },
    ],
  },
  {
    id: "general",
    en: "General",
    hi: "सामान्य सेटिंग",
    fields: [
      ...bi("tagline", "Tagline", "टैगलाइन", "text", 160),
      ...bi("footerNote", "Footer note", "फुटर संदेश", "textarea", 400),
      ...bi("copyright", "Copyright line", "कॉपीराइट पंक्ति", "text", 200),
    ],
  },
  {
    id: "contact",
    en: "Contact",
    hi: "संपर्क",
    noteEn: "Phone, email, address and the map are in Settings. These are extra details for the Contact page.",
    noteHi: "फ़ोन, ईमेल, पता और नक्शा 'सेटिंग्स' में हैं। यहाँ संपर्क पेज की अतिरिक्त जानकारी है।",
    fields: [
      ...bi("workingHours", "Working hours", "कार्य समय", "text", 200),
      ...bi("contactNote", "Note shown on Contact page", "संपर्क पेज का संदेश", "textarea", 500),
      { key: "supportEmail", en: "Support email", hi: "सहायता ईमेल", type: "text", max: 120 },
    ],
  },
  { id: "social", en: "Social media", hi: "सोशल मीडिया", fields: [] },
  {
    id: "menu",
    en: "Main menu links",
    hi: "मुख्य मेन्यू के लिंक",
    noteEn: "The links in the top menu. Add, remove, rename or reorder them. If you remove everything the standard menu returns.",
    noteHi: "ऊपर के मेन्यू के लिंक। जोड़ें, हटाएँ, नाम बदलें या क्रम बदलें। सब हटा दें तो डिफ़ॉल्ट मेन्यू लौट आएगा।",
    fields: [],
  },
  {
    id: "footerLinks",
    en: "Extra footer links",
    hi: "फुटर के अतिरिक्त लिंक",
    noteEn: "An extra 'More links' list in the footer, for example your WhatsApp group, a YouTube video or another website.",
    noteHi: "फुटर में 'और लिंक' की सूची, जैसे आपका व्हाट्सऐप ग्रुप, यूट्यूब वीडियो या कोई दूसरी वेबसाइट।",
    fields: [],
  },
  {
    id: "usefulLinks",
    en: "Useful links (home page)",
    hi: "उपयोगी लिंक (होम पेज)",
    noteEn: "Name and web address of each useful link. The ones switched on appear in a 'Useful links' block on the home page. Leave the list empty to hide the block.",
    noteHi: "हर उपयोगी लिंक का नाम और वेब पता। चालू लिंक होम पेज पर 'उपयोगी लिंक' में दिखेंगे। सूची खाली हो तो ब्लॉक नहीं दिखेगा।",
    fields: [],
  },
  {
    id: "seo",
    en: "SEO",
    hi: "एसईओ (खोज में दिखना)",
    fields: [
      ...bi("metaTitle", "Page title", "पेज शीर्षक", "text", 70),
      ...bi("metaDescription", "Description for Google", "गूगल के लिए विवरण", "textarea", 200),
      { key: "keywords", en: "Keywords (comma separated)", hi: "कीवर्ड (कॉमा से अलग)", type: "textarea", max: 400 },
      { key: "shareImage", en: "Share image (WhatsApp/Facebook)", hi: "शेयर इमेज", type: "image" },
      { key: "googleVerification", en: "Google Search Console code", hi: "गूगल सर्च कंसोल कोड", type: "text", max: 120 },
      { key: "bingVerification", en: "Bing Webmaster code", hi: "बिंग वेबमास्टर कोड", type: "text", max: 120 },
    ],
  },
  {
    id: "content",
    en: "Content",
    hi: "कंटेंट",
    noteEn: "Services, blog, gallery, FAQ and pages have their own screens in the Admin menu.",
    noteHi: "सेवाएँ, ब्लॉग, गैलरी, FAQ और पेज एडमिन मेनू में अलग से हैं।",
    fields: [
      ...bi("aboutShort", "Short about text", "संक्षिप्त परिचय", "textarea", 600),
      ...bi("missionText", "Mission text", "उद्देश्य", "textarea", 600),
    ],
  },
  {
    id: "features",
    en: "Features",
    hi: "सुविधाएँ चालू/बंद",
    fields: [
      { key: "showFloatingButtons", en: "Floating Call / WhatsApp / Chat buttons", hi: "फ्लोटिंग कॉल/व्हाट्सऐप/चैट बटन", type: "toggle", def: true },
      { key: "showCredentialsLink", en: "Credentials link in footer", hi: "फुटर में प्रमाणपत्र लिंक", type: "toggle", def: true },
      { key: "showBlogLink", en: "Blog link in menus", hi: "मेनू में ब्लॉग", type: "toggle", def: true },
    ],
  },
  {
    id: "business",
    en: "Business",
    hi: "व्यवसाय जानकारी",
    noteEn: "GST number, bank and UPI are in Settings. Extra business details to show on the site:",
    noteHi: "GST, बैंक और UPI 'सेटिंग्स' में हैं। यहाँ अन्य व्यवसाय जानकारी है:",
    fields: [
      ...bi("businessName", "Registered business name", "पंजीकृत व्यवसाय नाम", "text", 160),
      { key: "ownerName", en: "Owner / proprietor", hi: "स्वामी / प्रोपराइटर", type: "text", max: 120, def: "Krishna Tiwari" },
      { key: "msmeNumber", en: "MSME / Udyam number", hi: "MSME / उद्यम संख्या", type: "text", max: 60, def: "UDYAM-CG-05-0069748" },
      { key: "foundedYear", en: "Year started", hi: "स्थापना वर्ष", type: "number", def: 2026 },
    ],
  },
  {
    id: "analytics",
    en: "Analytics",
    hi: "एनालिटिक्स",
    noteEn: "The Google Analytics ID is saved under Admin → API keys. Here you manage what is tracked.",
    noteHi: "गूगल एनालिटिक्स ID 'API कीज़' में रखी जाती है। यहाँ ट्रैकिंग नियंत्रित करें।",
    fields: [
      { key: "trackingEnabled", en: "Allow visitor statistics", hi: "विज़िटर आँकड़े चालू", type: "toggle", def: true },
    ],
  },
  {
    id: "legal",
    en: "Legal pages",
    hi: "कानूनी पेज",
    noteEn: "Privacy policy, terms, refund policy and disclaimer are edited in Pages.",
    noteHi: "प्राइवेसी पॉलिसी, नियम-शर्तें, रिफंड नीति आदि 'पेज' में बदलें।",
    link: { href: "/admin/pages", en: "Open Pages", hi: "पेज खोलें" },
    fields: [
      ...bi("disclaimer", "Short disclaimer shown in footer", "फुटर की संक्षिप्त सूचना", "textarea", 500),
    ],
  },
  {
    id: "heroAnimation",
    en: "Hero animation",
    hi: "हीरो एनिमेशन",
    fields: [
      { key: "enabled", en: "Show the large Om mark behind the headline", hi: "शीर्षक के पीछे बड़ा ॐ चिह्न दिखाएँ", type: "toggle", def: true },
      { key: "glow", en: "Soft glow behind headline", hi: "शीर्षक के पीछे हल्की चमक", type: "toggle", def: false },
      { key: "accent", en: "Small heading colour", hi: "छोटे शीर्षक का रंग", type: "color", def: "#F4C65D" },
    ],
  },
  {
    id: "hero",
    en: "Hero content",
    hi: "हीरो कंटेंट",
    noteEn: "Leave a box empty to keep the standard wording.",
    noteHi: "डिफ़ॉल्ट शब्द रखने के लिए खाली छोड़ें।",
    fields: [
      ...bi("eyebrow", "Small heading", "छोटा शीर्षक", "text", 120),
      ...bi("title", "Main heading", "मुख्य शीर्षक", "text", 160),
      ...bi("lead", "Intro text", "परिचय पंक्ति", "textarea", 400),
    ],
  },
  {
    id: "technology",
    en: "Technology information",
    hi: "टेक्नोलॉजी जानकारी",
    noteEn: "The calculation method and accuracy note (for example Lahiri Ayanamsha) are shown on the Kundli pages. Below them is an internal record of how this website is built: server, frontend, backend, database, security and other details. Visitors do not see it.",
    noteHi: "गणना पद्धति और शुद्धता की सूचना कुंडली पेजों पर दिखती है। उसके नीचे इस वेबसाइट के बनने का आंतरिक रिकॉर्ड है: सर्वर, फ्रंटएंड, बैकएंड, डेटाबेस, सुरक्षा आदि। आगंतुकों को यह नहीं दिखता।",
    fields: [
      ...bi("calcMethod", "Calculation method", "गणना पद्धति", "textarea", 600),
      ...bi("accuracyNote", "Accuracy note", "शुद्धता संबंधी सूचना", "textarea", 400),
      { key: "techHosting", en: "Hosting / Server", hi: "होस्टिंग / सर्वर", type: "text", max: 300, def: "Vercel (managed serverless hosting with a global CDN; server functions run in Singapore)" },
      { key: "techDomain", en: "Domain & DNS", hi: "डोमेन व DNS", type: "text", max: 300, def: "Domain registered by the Kendra; DNS pointed to Vercel at the domain registrar" },
      { key: "techFrontend", en: "Frontend Technology", hi: "फ्रंटएंड तकनीक", type: "text", max: 300, def: "Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS" },
      { key: "techUi", en: "UI Library / Design System", hi: "UI लाइब्रेरी / डिज़ाइन सिस्टम", type: "text", max: 300, def: "Custom design system on Tailwind CSS, lucide-react icons, next-intl for Hindi and English" },
      { key: "techBackend", en: "Backend Technology", hi: "बैकएंड तकनीक", type: "text", max: 300, def: "Next.js server routes (Node.js, TypeScript) with Zod input validation" },
      { key: "techDatabase", en: "Database", hi: "डेटाबेस", type: "text", max: 300, def: "PostgreSQL (Supabase, Singapore region) accessed through the Prisma ORM" },
      { key: "techStorage", en: "File Storage", hi: "फ़ाइल स्टोरेज", type: "text", max: 300, def: "Vercel Blob object storage (pictures, videos, documents, payment proofs)" },
      { key: "techCms", en: "CMS / Content Management", hi: "CMS / कंटेंट प्रबंधन", type: "text", max: 300, def: "Built-in Admin Panel (custom CMS) for every page, service, package, plan, offer and setting" },
      { key: "techAuth", en: "Authentication", hi: "ऑथेंटिकेशन", type: "text", max: 300, def: "Email or mobile OTP and password sign-in (NextAuth), role-based access: admin, user, associate" },
      { key: "techSecurity", en: "Site Security", hi: "साइट सुरक्षा", type: "text", max: 300, def: "HTTPS/TLS, server-side role checks on every admin action, CSRF origin checks, rate limiting, API keys encrypted with AES-256-GCM, hashed passwords" },
      { key: "techSsl", en: "SSL Certificate", hi: "SSL प्रमाणपत्र", type: "text", max: 300, def: "Automatic TLS certificate, auto-renewed by the host" },
      { key: "techBackup", en: "Backup & Recovery", hi: "बैकअप व रिकवरी", type: "text", max: 300, def: "Admin Backups page (download a copy of content and records) and a scheduled backup job" },
      { key: "techPayment", en: "Payment Gateway", hi: "पेमेंट गेटवे", type: "text", max: 300, def: "Razorpay (UPI, cards, netbanking) once keys are added, plus UPI ID, QR code and bank transfer with manual verification" },
      { key: "techSms", en: "SMS / WhatsApp Gateway", hi: "SMS / WhatsApp गेटवे", type: "text", max: 300, def: "MSG91 for SMS OTP; WhatsApp Business Cloud API for chats (switched on by adding the keys in API keys & Analytics)" },
      { key: "techEmail", en: "Email Service", hi: "ईमेल सेवा", type: "text", max: 300, def: "SMTP email (Nodemailer) for receipts, confirmations and notifications" },
      { key: "techAnalytics", en: "Analytics & Tracking", hi: "एनालिटिक्स व ट्रैकिंग", type: "text", max: 300, def: "Google Analytics 4 (measurement ID set in API keys & Analytics)" },
      { key: "techSeo", en: "SEO Tools", hi: "SEO टूल", type: "text", max: 300, def: "Meta tags, sitemap.xml, robots.txt, JSON-LD structured data, Hindi and English alternate pages" },
      { key: "techLanguages", en: "Languages Supported", hi: "समर्थित भाषाएँ", type: "text", max: 300, def: "Hindi (default), English" },
      { key: "techPdf", en: "Documents / PDF Engine", hi: "दस्तावेज़ / PDF इंजन", type: "text", max: 300, def: "PDFKit for GST invoices; printable pages for confirmation tickets and guides" },
      { key: "techMaintainedBy", en: "Maintained By / Developer", hi: "रखरखाव / डेवलपर", type: "text", max: 200 },
      { key: "techNotes", en: "Other technical notes", hi: "अन्य तकनीकी टिप्पणी", type: "textarea", max: 600, def: "Panchang and Kundli tools use a built-in ephemeris with an AstroSage API option; QR codes are generated on the server; maintenance mode and page-by-page help are built into the admin." },
    ],
  },
  {
    id: "packagePolicy",
    en: "Package cancellation, refund & upgrade",
    hi: "पैकेज रद्दीकरण, धनवापसी और अपग्रेड",
    noteEn: "Shown under every package and plan, and printed in the package download. Change the wording to match your real policy.",
    noteHi: "हर पैकेज और प्लान के नीचे और डाउनलोड में दिखता है। अपनी असली नीति के अनुसार शब्द बदलें।",
    fields: [
      { key: "cancelEn", en: "Service / package cancellation (English)", hi: "सेवा / पैकेज रद्दीकरण (अंग्रेज़ी)", type: "textarea", max: 1200, def: "Cancel before the consultation, report or ritual work has started and you can cancel from your dashboard or by raising a support ticket. Once work has started (kundli prepared, call scheduled or ritual begun) the booking cannot be cancelled. Packages with a fixed start date can be cancelled up to 48 hours before the start date." },
      { key: "cancelHi", en: "Service / package cancellation (Hindi)", hi: "सेवा / पैकेज रद्दीकरण (हिंदी)", type: "textarea", max: 1200, def: "परामर्श, रिपोर्ट या अनुष्ठान का कार्य शुरू होने से पहले आप अपने डैशबोर्ड से या सपोर्ट टिकट बनाकर बुकिंग रद्द कर सकते हैं। कार्य शुरू हो जाने (कुंडली बन जाने, कॉल तय हो जाने या अनुष्ठान आरंभ होने) के बाद बुकिंग रद्द नहीं होगी। निश्चित प्रारंभ तिथि वाले पैकेज प्रारंभ तिथि से 48 घंटे पहले तक रद्द किए जा सकते हैं।" },
      { key: "refundEn", en: "Refund (English)", hi: "धनवापसी (अंग्रेज़ी)", type: "textarea", max: 1200, def: "If you cancel in time, the amount you paid is refunded to the original payment method within 7 working days. If we cannot deliver the service, you get a full refund. Once a report or consultation has been delivered, the dakshina is not refundable. Details are in the Refund Policy page." },
      { key: "refundHi", en: "Refund (Hindi)", hi: "धनवापसी (हिंदी)", type: "textarea", max: 1200, def: "समय पर रद्द करने पर भुगतान की गई राशि 7 कार्यदिवस के भीतर मूल भुगतान माध्यम में वापस की जाएगी। यदि हम सेवा उपलब्ध नहीं करा पाते, तो पूरी राशि वापस होगी। रिपोर्ट या परामर्श मिल जाने के बाद दक्षिणा वापस नहीं होगी। विस्तृत जानकारी धनवापसी नीति पेज पर है।" },
      { key: "upgradeEn", en: "Plan upgrade (English)", hi: "प्लान अपग्रेड (अंग्रेज़ी)", type: "textarea", max: 1200, def: "You can upgrade to a higher plan of the same package at any time before the work is delivered. Raise a support ticket or call the Kendra, and you pay only the difference between the two plans. Downgrading to a cheaper plan is treated as a cancellation and refund under the policy above." },
      { key: "upgradeHi", en: "Plan upgrade (Hindi)", hi: "प्लान अपग्रेड (हिंदी)", type: "textarea", max: 1200, def: "काम मिलने से पहले आप कभी भी उसी पैकेज के ऊँचे प्लान में अपग्रेड कर सकते हैं। सपोर्ट टिकट बनाएँ या केंद्र को कॉल करें; आपको केवल दोनों प्लान के बीच का अंतर देना होगा। सस्ते प्लान में जाना रद्दीकरण माना जाएगा और ऊपर की नीति के अनुसार धनवापसी होगी।" },
    ],
  },
  {
    id: "mobileApp",
    en: "Mobile app",
    hi: "मोबाइल ऐप",
    fields: [
      { key: "enabled", en: "Show app download section", hi: "ऐप डाउनलोड सेक्शन दिखाएँ", type: "toggle", def: true },
      ...bi("appText", "Text shown with the download", "डाउनलोड के साथ का संदेश", "text", 200),
      // 1. Android app (Google Play)
      { key: "androidEnabled", en: "1. Android app: show it", hi: "1. एंड्रॉइड ऐप: दिखाएँ", type: "toggle", def: true },
      ...bi("androidName", "1. Android app: name", "1. एंड्रॉइड ऐप: नाम", "text", 80, "Android App (Google Play)"),
      { key: "androidIcon", en: "1. Android app: icon (for example the Play Store icon)", hi: "1. एंड्रॉइड ऐप: आइकन (जैसे प्ले स्टोर का आइकन)", type: "image" },
      { key: "playStoreUrl", en: "1. Android app: Google Play link", hi: "1. एंड्रॉइड ऐप: गूगल प्ले लिंक", type: "url" },
      { key: "androidQrImage", en: "1. Android app: QR code picture (leave empty to make it from the link)", hi: "1. एंड्रॉइड ऐप: QR कोड की तस्वीर (खाली छोड़ें तो लिंक से बनेगा)", type: "image" },
      // 2. APK file app
      { key: "apkEnabled", en: "2. APK file app: show it", hi: "2. APK फ़ाइल ऐप: दिखाएँ", type: "toggle", def: true },
      ...bi("apkName", "2. APK file app: name", "2. APK फ़ाइल ऐप: नाम", "text", 80, "APK file app"),
      { key: "apkIcon", en: "2. APK file app: icon", hi: "2. APK फ़ाइल ऐप: आइकन", type: "image" },
      { key: "apkUrl", en: "2. APK file app: direct download link", hi: "2. APK फ़ाइल ऐप: सीधा डाउनलोड लिंक", type: "url" },
      { key: "apkQrImage", en: "2. APK file app: QR code picture (leave empty to make it from the link)", hi: "2. APK फ़ाइल ऐप: QR कोड की तस्वीर (खाली छोड़ें तो लिंक से बनेगा)", type: "image" },
      // iPhone
      { key: "appStoreUrl", en: "App Store link (iPhone, optional)", hi: "ऐप स्टोर लिंक (आईफ़ोन, वैकल्पिक)", type: "url" },
    ],
  },
  {
    id: "tools",
    en: "Panchang, Kundli and Matching tools",
    hi: "पंचांग, कुंडली व मिलान टूल",
    noteEn: "These pages show a live tool from another website inside ours. Paste a different address to change the tool, or leave empty for the standard one. Use {lang} where the page language should go (hi or en).",
    noteHi: "ये पेज किसी दूसरी वेबसाइट का लाइव टूल हमारी साइट के अंदर दिखाते हैं। टूल बदलने के लिए नया पता डालें, खाली छोड़ने पर सामान्य टूल रहेगा। भाषा की जगह {lang} लिखें (hi या en)।",
    fields: [
      { key: "panchangEnabled", en: "Panchang page ON", hi: "पंचांग पेज चालू", type: "toggle", def: true },
      { key: "kundliEnabled", en: "Kundli page ON", hi: "कुंडली पेज चालू", type: "toggle", def: true },
      { key: "matchingEnabled", en: "Kundli matching page ON", hi: "कुंडली मिलान पेज चालू", type: "toggle", def: true },
      { key: "panchangUrl", en: "Panchang calendar address", hi: "पंचांग कैलेंडर का पता", type: "url", max: 400, def: "https://panchang.astrosage.com/?language={lang}" },
      { key: "kundliUrl", en: "Kundli (birth chart) address", hi: "कुंडली का पता", type: "url", max: 400, def: "https://www.astrosage.com/freekundli/" },
      { key: "matchingUrl", en: "Kundli matching address", hi: "कुंडली मिलान का पता", type: "url", max: 400, def: "https://www.astrosage.com/freechart/matchmaking.asp" },
    ],
  },
  {
    id: "homeSections",
    en: "Home page: show or hide sections",
    hi: "होम पेज: सेक्शन दिखाएँ/छिपाएँ",
    noteEn: "Switch any block of the home page on or off. Hidden blocks stay saved.",
    noteHi: "होम पेज का कोई भी हिस्सा चालू या बंद करें। बंद किए हिस्से सुरक्षित रहते हैं।",
    fields: [
      { key: "showQuickCards", en: "Three cards under the banner", hi: "बैनर के नीचे तीन कार्ड", type: "toggle", def: true },
      { key: "showAbout", en: "About", hi: "परिचय", type: "toggle", def: true },
      { key: "showServices", en: "All services grid", hi: "सभी सेवाओं की सूची", type: "toggle", def: true },
      { key: "showPlans", en: "Kundli, Prashn and Matching plans", hi: "कुंडली, प्रश्न और मिलान योजनाएँ", type: "toggle", def: true },
      { key: "showConnected", en: "Connected services", hi: "संबद्ध सेवाएँ", type: "toggle", def: true },
      { key: "showTools", en: "Free tools", hi: "निःशुल्क उपकरण", type: "toggle", def: true },
      { key: "showRequestForm", en: "Kundli request form", hi: "कुंडली अनुरोध फ़ॉर्म", type: "toggle", def: true },
      { key: "showGallery", en: "Gallery", hi: "गैलरी", type: "toggle", def: true },
      { key: "showBooking", en: "Booking steps", hi: "बुकिंग के चरण", type: "toggle", def: true },
      { key: "showPayment", en: "Payment information", hi: "भुगतान की जानकारी", type: "toggle", def: true },
      { key: "showReviews", en: "Reviews", hi: "समीक्षाएँ", type: "toggle", def: true },
      { key: "showFaq", en: "FAQ", hi: "सामान्य प्रश्न", type: "toggle", def: true },
      { key: "showContact", en: "Contact block", hi: "संपर्क हिस्सा", type: "toggle", def: true },
    ],
  },
  {
    id: "homeHero",
    en: "Home page: banner (hero)",
    hi: "होम पेज: मुख्य बैनर",
    noteEn: "Pictures, text and the two buttons of the large banner. Leave a box empty to keep the standard wording.",
    noteHi: "बड़े बैनर की तस्वीरें, लिखावट और दो बटन। डिफ़ॉल्ट शब्दों के लिए खाली छोड़ें।",
    fields: [
      { key: "image1", en: "Banner picture 1", hi: "बैनर तस्वीर 1", type: "image" },
      { key: "image2", en: "Banner picture 2 (fades in and out)", hi: "बैनर तस्वीर 2 (धीरे-धीरे बदलती है)", type: "image" },
      { key: "overlay", en: "Darkness over the pictures (0 to 90)", hi: "तस्वीरों पर अँधेरा (0 से 90)", type: "number", def: 60 },
      ...bi("cta1Label", "First button text", "पहले बटन का टेक्स्ट", "text", 60),
      { key: "cta1Url", en: "First button goes to", hi: "पहला बटन कहाँ जाए", type: "link", max: 400, def: "/services" },
      ...bi("cta2Label", "Second button text", "दूसरे बटन का टेक्स्ट", "text", 60),
      { key: "cta2Url", en: "Second button goes to", hi: "दूसरा बटन कहाँ जाए", type: "link", max: 400, def: "/kundli" },
      { key: "showCta2", en: "Show the second button", hi: "दूसरा बटन दिखाएँ", type: "toggle", def: true },
    ],
  },
  {
    id: "homeCards",
    en: "Home page: three cards and About",
    hi: "होम पेज: तीन कार्ड और परिचय",
    fields: [
      ...bi("quick1Title", "Card 1 title", "कार्ड 1 शीर्षक", "text", 80),
      ...bi("quick1Text", "Card 1 text", "कार्ड 1 टेक्स्ट", "textarea", 300, undefined, true),
      ...bi("quick2Title", "Card 2 title", "कार्ड 2 शीर्षक", "text", 80),
      ...bi("quick2Text", "Card 2 text", "कार्ड 2 टेक्स्ट", "textarea", 300, undefined, true),
      ...bi("quick3Title", "Card 3 title", "कार्ड 3 शीर्षक", "text", 80),
      ...bi("aboutLabel", "About: small heading", "परिचय: छोटा शीर्षक", "text", 100),
      ...bi("aboutTitle", "About: heading", "परिचय: शीर्षक", "text", 120),
      ...bi("aboutIntro", "About: text", "परिचय: टेक्स्ट", "textarea", 900, undefined, true),
      { key: "aboutImage", en: "About: picture", hi: "परिचय: तस्वीर", type: "image" },
      ...bi("feature1Title", "About point 1 title", "बिंदु 1 शीर्षक", "text", 80),
      ...bi("feature1Text", "About point 1 text", "बिंदु 1 टेक्स्ट", "text", 200),
      ...bi("feature2Title", "About point 2 title", "बिंदु 2 शीर्षक", "text", 80),
      ...bi("feature2Text", "About point 2 text", "बिंदु 2 टेक्स्ट", "text", 200),
      ...bi("feature3Title", "About point 3 title", "बिंदु 3 शीर्षक", "text", 80),
      ...bi("feature3Text", "About point 3 text", "बिंदु 3 टेक्स्ट", "text", 200),
      ...bi("aboutButton", "About button text", "परिचय बटन टेक्स्ट", "text", 60),
      { key: "aboutButtonUrl", en: "About button goes to (empty = WhatsApp)", hi: "बटन कहाँ जाए (खाली = व्हाट्सऐप)", type: "link", max: 400 },
    ],
  },
  {
    id: "homeServices",
    en: "Home page: services, plans and tools headings",
    hi: "होम पेज: सेवाओं, योजनाओं और उपकरणों के शीर्षक",
    fields: [
      ...bi("servicesLabel", "Services: small heading", "सेवाएँ: छोटा शीर्षक", "text", 100),
      ...bi("servicesTitle", "Services: heading", "सेवाएँ: शीर्षक", "text", 120),
      ...bi("servicesIntro", "Services: text", "सेवाएँ: टेक्स्ट", "textarea", 400, undefined, true),
      ...bi("consultLabel", "Service card link text", "सेवा कार्ड लिंक टेक्स्ट", "text", 40),
      ...bi("janamTitle", "Janam Kundli plans heading", "जन्म कुंडली योजनाओं का शीर्षक", "text", 120),
      ...bi("janamIntro", "Janam Kundli plans text", "जन्म कुंडली योजनाओं का टेक्स्ट", "textarea", 300, undefined, true),
      ...bi("prashnTitle", "Prashn Kundli plans heading", "प्रश्न कुंडली योजनाओं का शीर्षक", "text", 120),
      ...bi("prashnIntro", "Prashn Kundli plans text", "प्रश्न कुंडली योजनाओं का टेक्स्ट", "textarea", 300, undefined, true),
      ...bi("matchingTitle", "Matching plans heading", "मिलान योजनाओं का शीर्षक", "text", 120),
      ...bi("matchingIntro", "Matching plans text", "मिलान योजनाओं का टेक्स्ट", "textarea", 300, undefined, true),
      ...bi("selectPlanLabel", "Plan button text", "योजना बटन टेक्स्ट", "text", 40),
      ...bi("connectedLabel", "Connected services: small heading", "संबद्ध सेवाएँ: छोटा शीर्षक", "text", 100),
      ...bi("connectedTitle", "Connected services: heading", "संबद्ध सेवाएँ: शीर्षक", "text", 120),
      ...bi("toolsLabel", "Free tools: small heading", "निःशुल्क उपकरण: छोटा शीर्षक", "text", 100),
      ...bi("toolsTitle", "Free tools: heading", "निःशुल्क उपकरण: शीर्षक", "text", 120),
      ...bi("toolsIntro", "Free tools: text", "निःशुल्क उपकरण: टेक्स्ट", "textarea", 300, undefined, true),
    ],
  },
  {
    id: "homeProcess",
    en: "Home page: request form, gallery, booking and payment",
    hi: "होम पेज: अनुरोध फ़ॉर्म, गैलरी, बुकिंग और भुगतान",
    fields: [
      ...bi("formLabel", "Request form: small heading", "अनुरोध फ़ॉर्म: छोटा शीर्षक", "text", 100),
      ...bi("formTitle", "Request form: heading", "अनुरोध फ़ॉर्म: शीर्षक", "text", 120),
      ...bi("formIntro", "Request form: text", "अनुरोध फ़ॉर्म: टेक्स्ट", "textarea", 300, undefined, true),
      ...bi("formSideTitle", "Request form side panel title", "साइड पैनल शीर्षक", "text", 80),
      ...bi("formSideText", "Request form side panel text", "साइड पैनल टेक्स्ट", "textarea", 300, undefined, true),
      ...bi("galleryLabel", "Gallery: small heading", "गैलरी: छोटा शीर्षक", "text", 100),
      ...bi("galleryTitle", "Gallery: heading", "गैलरी: शीर्षक", "text", 120),
      ...bi("bookingLabel", "Booking: small heading", "बुकिंग: छोटा शीर्षक", "text", 100),
      ...bi("bookingTitle", "Booking: heading", "बुकिंग: शीर्षक", "text", 120),
      ...bi("bookingIntro", "Booking: text", "बुकिंग: टेक्स्ट", "textarea", 300, undefined, true),
      ...bi("step1Title", "Step 1 title", "चरण 1 शीर्षक", "text", 80),
      ...bi("step1Text", "Step 1 text", "चरण 1 टेक्स्ट", "text", 200),
      ...bi("step2Title", "Step 2 title", "चरण 2 शीर्षक", "text", 80),
      ...bi("step2Text", "Step 2 text", "चरण 2 टेक्स्ट", "text", 200),
      ...bi("step3Title", "Step 3 title", "चरण 3 शीर्षक", "text", 80),
      ...bi("step3Text", "Step 3 text", "चरण 3 टेक्स्ट", "text", 200),
      ...bi("step4Title", "Step 4 title", "चरण 4 शीर्षक", "text", 80),
      ...bi("step4Text", "Step 4 text", "चरण 4 टेक्स्ट", "text", 200),
      ...bi("bookingButton", "Booking button text", "बुकिंग बटन टेक्स्ट", "text", 60),
      ...bi("paymentLabel", "Payment: small heading", "भुगतान: छोटा शीर्षक", "text", 100),
      ...bi("paymentTitle", "Payment: heading", "भुगतान: शीर्षक", "text", 120),
      ...bi("paymentIntro", "Payment: text", "भुगतान: टेक्स्ट", "textarea", 300, undefined, true),
      ...bi("payBeforeTitle", "Payment left box title", "भुगतान बाएँ बॉक्स का शीर्षक", "text", 80),
      ...bi("payBeforeText", "Payment left box steps (one per line)", "भुगतान बाएँ बॉक्स के चरण (हर पंक्ति में एक)", "textarea", 600),
      ...bi("payGatewayTitle", "Payment right box title", "भुगतान दाएँ बॉक्स का शीर्षक", "text", 80),
      ...bi("payGatewayText", "Payment right box text", "भुगतान दाएँ बॉक्स का टेक्स्ट", "textarea", 500, undefined, true),
    ],
  },
  {
    id: "homeContact",
    en: "Home page: reviews, FAQ and contact block",
    hi: "होम पेज: समीक्षाएँ, प्रश्न और संपर्क",
    fields: [
      ...bi("reviewsLabel", "Reviews: small heading", "समीक्षाएँ: छोटा शीर्षक", "text", 100),
      ...bi("reviewsTitle", "Reviews: heading", "समीक्षाएँ: शीर्षक", "text", 120),
      ...bi("faqLabel", "FAQ: small heading", "प्रश्न: छोटा शीर्षक", "text", 100),
      ...bi("faqTitle", "FAQ: heading", "प्रश्न: शीर्षक", "text", 120),
      ...bi("contactLabel", "Contact: small heading", "संपर्क: छोटा शीर्षक", "text", 100),
      ...bi("contactTitle", "Contact: heading", "संपर्क: शीर्षक", "text", 120),
      ...bi("contactIntro", "Contact: text", "संपर्क: टेक्स्ट", "textarea", 400, undefined, true),
      ...bi("helpTitle", "Right box title", "दाएँ बॉक्स का शीर्षक", "text", 80),
      ...bi("help1Title", "Help point 1 title", "बिंदु 1 शीर्षक", "text", 80),
      ...bi("help1Text", "Help point 1 text", "बिंदु 1 टेक्स्ट", "text", 200),
      ...bi("help2Title", "Help point 2 title", "बिंदु 2 शीर्षक", "text", 80),
      ...bi("help2Text", "Help point 2 text", "बिंदु 2 टेक्स्ट", "text", 200),
      ...bi("help3Title", "Help point 3 title", "बिंदु 3 शीर्षक", "text", 80),
      ...bi("help3Text", "Help point 3 text", "बिंदु 3 टेक्स्ट", "text", 200),
      ...bi("contactButton", "Contact button text", "संपर्क बटन टेक्स्ट", "text", 60),
    ],
  },
  {
    id: "homeExtras",
    en: "Home page: extra sections (numbers, why us, guidance, credentials, blog, founder, app prompt)",
    hi: "होम पेज: अतिरिक्त हिस्से (आँकड़े, हमें क्यों चुनें, मार्गदर्शन, प्रमाणपत्र, ब्लॉग, संस्थापक, ऐप संदेश)",
    noteEn: "New blocks for the home page. Each can be switched on or off. Leave a text empty to keep the standard wording. The numbers block stays hidden until you switch it on and type real numbers.",
    noteHi: "होम पेज के नए हिस्से। हर एक को चालू या बंद किया जा सकता है। मानक शब्दों के लिए टेक्स्ट खाली छोड़ें। आँकड़ों वाला हिस्सा तब तक छिपा रहता है जब तक आप उसे चालू करके असली संख्याएँ न लिखें।",
    fields: [
      { key: "showStats", en: "Show the numbers block (e.g. families guided)", hi: "आँकड़ों वाला हिस्सा दिखाएँ", type: "toggle", def: false },
      ...bi("statsLabel", "Numbers: small heading", "आँकड़े: छोटा शीर्षक", "text", 100),
      ...bi("statsTitle", "Numbers: heading", "आँकड़े: शीर्षक", "text", 120),
      { key: "stat1Value", en: "Number 1 (e.g. 5000+)", hi: "संख्या 1 (जैसे 5000+)", type: "text", max: 20 },
      ...bi("stat1Label", "Number 1 label", "संख्या 1 का नाम", "text", 50),
      { key: "stat2Value", en: "Number 2", hi: "संख्या 2", type: "text", max: 20 },
      ...bi("stat2Label", "Number 2 label", "संख्या 2 का नाम", "text", 50),
      { key: "stat3Value", en: "Number 3", hi: "संख्या 3", type: "text", max: 20 },
      ...bi("stat3Label", "Number 3 label", "संख्या 3 का नाम", "text", 50),
      { key: "stat4Value", en: "Number 4", hi: "संख्या 4", type: "text", max: 20 },
      ...bi("stat4Label", "Number 4 label", "संख्या 4 का नाम", "text", 50),

      { key: "showWhy", en: "Show 'Why choose us'", hi: "'हमें क्यों चुनें' दिखाएँ", type: "toggle", def: true },
      ...bi("whyLabel", "Why us: small heading", "हमें क्यों चुनें: छोटा शीर्षक", "text", 100),
      ...bi("whyTitle", "Why us: heading", "हमें क्यों चुनें: शीर्षक", "text", 120),
      ...bi("whyIntro", "Why us: text", "हमें क्यों चुनें: टेक्स्ट", "textarea", 300, undefined, true),
      ...bi("why1Title", "Why us 1 title", "कारण 1 शीर्षक", "text", 80),
      ...bi("why1Text", "Why us 1 text", "कारण 1 टेक्स्ट", "text", 200),
      ...bi("why2Title", "Why us 2 title", "कारण 2 शीर्षक", "text", 80),
      ...bi("why2Text", "Why us 2 text", "कारण 2 टेक्स्ट", "text", 200),
      ...bi("why3Title", "Why us 3 title", "कारण 3 शीर्षक", "text", 80),
      ...bi("why3Text", "Why us 3 text", "कारण 3 टेक्स्ट", "text", 200),
      ...bi("why4Title", "Why us 4 title", "कारण 4 शीर्षक", "text", 80),
      ...bi("why4Text", "Why us 4 text", "कारण 4 टेक्स्ट", "text", 200),
      ...bi("why5Title", "Why us 5 title", "कारण 5 शीर्षक", "text", 80),
      ...bi("why5Text", "Why us 5 text", "कारण 5 टेक्स्ट", "text", 200),
      ...bi("why6Title", "Why us 6 title", "कारण 6 शीर्षक", "text", 80),
      ...bi("why6Text", "Why us 6 text", "कारण 6 टेक्स्ट", "text", 200),

      { key: "showTips", en: "Show 'Before your consultation' guidance", hi: "'परामर्श से पहले' मार्गदर्शन दिखाएँ", type: "toggle", def: true },
      ...bi("tipsLabel", "Guidance: small heading", "मार्गदर्शन: छोटा शीर्षक", "text", 100),
      ...bi("tipsTitle", "Guidance: heading", "मार्गदर्शन: शीर्षक", "text", 120),
      ...bi("tip1Title", "Guidance 1 title", "सुझाव 1 शीर्षक", "text", 80),
      ...bi("tip1Text", "Guidance 1 text", "सुझाव 1 टेक्स्ट", "text", 220),
      ...bi("tip2Title", "Guidance 2 title", "सुझाव 2 शीर्षक", "text", 80),
      ...bi("tip2Text", "Guidance 2 text", "सुझाव 2 टेक्स्ट", "text", 220),
      ...bi("tip3Title", "Guidance 3 title", "सुझाव 3 शीर्षक", "text", 80),
      ...bi("tip3Text", "Guidance 3 text", "सुझाव 3 टेक्स्ट", "text", 220),
      ...bi("tip4Title", "Guidance 4 title", "सुझाव 4 शीर्षक", "text", 80),
      ...bi("tip4Text", "Guidance 4 text", "सुझाव 4 टेक्स्ट", "text", 220),

      { key: "showCredentials", en: "Show credentials (from Admin > Credentials)", hi: "प्रमाणपत्र दिखाएँ (एडमिन > प्रमाणपत्र से)", type: "toggle", def: true },
      ...bi("credLabel", "Credentials: small heading", "प्रमाणपत्र: छोटा शीर्षक", "text", 100),
      ...bi("credTitle", "Credentials: heading", "प्रमाणपत्र: शीर्षक", "text", 120),

      { key: "showBlog", en: "Show latest blog posts", hi: "नवीनतम ब्लॉग दिखाएँ", type: "toggle", def: true },
      ...bi("blogLabel", "Blog: small heading", "ब्लॉग: छोटा शीर्षक", "text", 100),
      ...bi("blogTitle", "Blog: heading", "ब्लॉग: शीर्षक", "text", 120),

      { key: "showFounder", en: "Show founder block (from Admin > Founder)", hi: "संस्थापक हिस्सा दिखाएँ (एडमिन > संस्थापक से)", type: "toggle", def: true },
      ...bi("founderLabel", "Founder: small heading", "संस्थापक: छोटा शीर्षक", "text", 100),
      ...bi("founderQuote", "Founder: short quote or prayer", "संस्थापक: छोटा कथन", "textarea", 300),
      ...bi("founderButton", "Founder: button text", "संस्थापक: बटन टेक्स्ट", "text", 60),

      { key: "showInstall", en: "Show 'Install the app on your phone' tip to visitors", hi: "आगंतुकों को 'फ़ोन पर ऐप जोड़ें' सुझाव दिखाएँ", type: "toggle", def: true },
      ...bi("installTitle", "Install tip: title", "ऐप सुझाव: शीर्षक", "text", 80),
      ...bi("installText", "Install tip: text", "ऐप सुझाव: टेक्स्ट", "text", 200),
    ],
  },
  {
    id: "topbar",
    en: "Top bar (date and time line)",
    hi: "ऊपरी पट्टी (तारीख और समय)",
    noteEn: "Choose what the thin dark bar at the very top shows.",
    noteHi: "सबसे ऊपर की पतली पट्टी में क्या दिखे, यह चुनें।",
    fields: [
      { key: "showTime", en: "Time", hi: "समय", type: "toggle", def: true },
      { key: "showSeconds", en: "Seconds in the time", hi: "समय में सेकंड", type: "toggle", def: true },
      { key: "showDay", en: "Day of the week", hi: "वार", type: "toggle", def: true },
      { key: "showDate", en: "Date, month and year", hi: "तारीख, महीना और वर्ष", type: "toggle", def: true },
      { key: "showPaksha", en: "Paksha", hi: "पक्ष", type: "toggle", def: true },
      { key: "showTithi", en: "Tithi (with end time)", hi: "तिथि (समाप्ति समय सहित)", type: "toggle", def: true },
      { key: "showMasa", en: "Hindu month", hi: "हिंदू माह", type: "toggle", def: true },
      { key: "showSamvat", en: "Vikram Samvat", hi: "विक्रम संवत", type: "toggle", def: true },
      { key: "showPanchangButton", en: "Panchang Calendar button", hi: "पंचांग कैलेंडर बटन", type: "toggle", def: true },
      { key: "showPhone", en: "Phone number", hi: "फ़ोन नंबर", type: "toggle", def: true },
      { key: "showSocial", en: "Social media icons", hi: "सोशल मीडिया आइकन", type: "toggle", def: true },
      { key: "showAuthLinks", en: "Sign in and Register links", hi: "साइन इन और रजिस्टर लिंक", type: "toggle", def: true },
      { key: "showBar", en: "Show the whole top bar", hi: "पूरी ऊपरी पट्टी दिखाएँ", type: "toggle", def: true },
    ],
  },
  {
    id: "floating",
    en: "Floating buttons (call, WhatsApp, AI, chat)",
    hi: "फ्लोटिंग बटन (कॉल, व्हाट्सऐप, AI, चैट)",
    fields: [
      { key: "showCall", en: "Call button", hi: "कॉल बटन", type: "toggle", def: true },
      { key: "showWhatsapp", en: "WhatsApp button", hi: "व्हाट्सऐप बटन", type: "toggle", def: true },
      { key: "showAi", en: "Ask AI button", hi: "AI बटन", type: "toggle", def: true },
      { key: "showChat", en: "Chat button", hi: "चैट बटन", type: "toggle", def: true },
      { key: "showAskBar", en: "Ask-a-question bar at the bottom (large screens)", hi: "नीचे का प्रश्न पूछें बार (बड़ी स्क्रीन)", type: "toggle", def: true },
      { key: "callNumber", en: "Number the call button dials (empty = main phone)", hi: "कॉल बटन का नंबर (खाली = मुख्य फ़ोन)", type: "text", max: 20 },
      { key: "whatsappNumber", en: "WhatsApp number (empty = main phone)", hi: "व्हाट्सऐप नंबर (खाली = मुख्य फ़ोन)", type: "text", max: 20 },
      ...bi("whatsappMessage", "First WhatsApp message", "व्हाट्सऐप का पहला संदेश", "textarea", 300),
    ],
  },
  {
    id: "intro",
    en: "Opening screen",
    hi: "ओपनिंग स्क्रीन",
    fields: [
      { key: "enabled", en: "Show the opening screen on the first visit", hi: "पहली बार खुलने पर ओपनिंग स्क्रीन दिखाएँ", type: "toggle", def: true },
      { key: "stayTime", en: "How long it stays (seconds, 1 to 12)", hi: "कितनी देर दिखे (सेकंड, 1 से 12)", type: "number", def: 7 },
      { key: "mantra", en: "Mantra between the Om and the photo (one line per row)", hi: "ओम और फोटो के बीच का मंत्र (हर पंक्ति अलग)", type: "textarea", max: 300, def: "ॐ असतो मा सद्गमय। तमसो मा ज्योतिर्गमय। मृत्योर्मा अमृतं गमय॥\nॐ शान्तिः शान्तिः शान्तिः" },
      { key: "welcomeEn", en: "Welcome line at the bottom (English)", hi: "नीचे का स्वागत वाक्य (अंग्रेज़ी)", type: "text", max: 120, def: "Welcome to Maharshi Kanad Jyotish Kendra" },
      { key: "welcomeHi", en: "Welcome line at the bottom (Hindi)", hi: "नीचे का स्वागत वाक्य (हिंदी)", type: "text", max: 120, def: "महर्षि कणाद ज्योतिष केंद्र में आपका स्वागत है" },
      ...bi("title", "Name shown", "दिखने वाला नाम", "text", 80),
      ...bi("tagline", "Line under the name", "नाम के नीचे की पंक्ति", "text", 120),
      ...bi("sub", "Small capital line", "छोटी पंक्ति", "text", 80),
      { key: "logoImage", en: "Photo of Maharshi Kanad shown under the Om (clear it to hide)", hi: "ओम के नीचे महर्षि कणाद की फोटो (हटाने के लिए खाली करें)", type: "image", def: "/logo-intro-small.jpg" },
      { key: "symbol", en: "Symbol in the circle", hi: "सर्कल का चिह्न", type: "text", max: 4, def: "ॐ" },
    ],
  },
  {
    id: "theme",
    en: "Colours of the website",
    hi: "वेबसाइट के रंग",
    noteEn: "Leave a colour empty to keep the standard one. Pick dark colours for 'Dark brown' so white text stays readable on it.",
    noteHi: "डिफ़ॉल्ट रंग के लिए खाली छोड़ें। 'गहरा भूरा' के लिए गहरा रंग चुनें ताकि उस पर सफ़ेद अक्षर साफ़ दिखें।",
    fields: [
      { key: "brand", en: "Main button colour", hi: "मुख्य बटन का रंग", type: "color" },
      { key: "saffron", en: "Orange accent (cards, lines)", hi: "नारंगी रंग (कार्ड, रेखाएँ)", type: "color" },
      { key: "dark", en: "Dark brown (top bar, footer, banners)", hi: "गहरा भूरा (ऊपरी पट्टी, फुटर)", type: "color" },
      { key: "gold", en: "Gold (highlights)", hi: "सुनहरा (हाइलाइट)", type: "color" },
      { key: "page", en: "Page background", hi: "पेज की पृष्ठभूमि", type: "color" },
      { key: "text", en: "Normal text colour", hi: "सामान्य लिखावट का रंग", type: "color" },
      { key: "heading", en: "Headings colour", hi: "शीर्षकों का रंग", type: "color" },
      { key: "link", en: "Links and small highlights", hi: "लिंक व छोटे हाइलाइट", type: "color" },
      { key: "buttonText", en: "Text on main buttons", hi: "मुख्य बटन पर लिखावट", type: "color" },
      { key: "card", en: "Cards and boxes background", hi: "कार्ड व बॉक्स की पृष्ठभूमि", type: "color" },
      { key: "border", en: "Lines and borders", hi: "रेखाएँ व किनारे", type: "color" },
      { key: "footerBg", en: "Footer background", hi: "फुटर की पृष्ठभूमि", type: "color" },
      { key: "topbarBg", en: "Top bar background", hi: "ऊपरी पट्टी की पृष्ठभूमि", type: "color" },
      { key: "mapButton", en: "Get directions button colour", hi: "रास्ता देखें बटन का रंग", type: "color" },
      { key: "mapButtonText", en: "Get directions button text", hi: "रास्ता देखें बटन की लिखावट", type: "color" },
      { key: "btn_book", en: "Book Consultation button", hi: "बुक परामर्श बटन", type: "color" },
      { key: "btn_account", en: "Sign in / account round button", hi: "साइन इन / खाता गोल बटन", type: "color" },
      { key: "btn_panchang", en: "Panchang Calendar button", hi: "पंचांग कैलेंडर बटन", type: "color" },
      { key: "btn_lang", en: "Selected language button (EN / हिं)", hi: "चुनी हुई भाषा का बटन", type: "color" },
      { key: "btn_call", en: "Floating Call button", hi: "फ़्लोटिंग कॉल बटन", type: "color" },
      { key: "btn_whatsapp", en: "Floating WhatsApp button", hi: "फ़्लोटिंग व्हाट्सएप बटन", type: "color" },
      { key: "btn_ai", en: "Floating Ask AI button", hi: "फ़्लोटिंग Ask AI बटन", type: "color" },
      { key: "btn_chat", en: "Floating Chat button", hi: "फ़्लोटिंग चैट बटन", type: "color" },
      { key: "bodyFont", en: "Text font - Poppins, Noto Sans, Arial, Verdana, Tahoma or Trebuchet MS", hi: "लिखावट का फ़ॉन्ट (जैसे Georgia)", type: "text", max: 60 },
      { key: "headingFont", en: "Headings font - Cormorant Garamond, Georgia, Times New Roman or Palatino", hi: "शीर्षक का फ़ॉन्ट (जैसे Georgia)", type: "text", max: 60 },
    ],
  },
  {
    id: "invoice",
    en: "Invoice (bill)",
    hi: "इनवॉइस (बिल)",
    noteEn: "What the customer's invoice shows. Leave a text box empty to keep the standard wording. Business address and email come from Settings and are printed only if filled there and switched on here.",
    noteHi: "ग्राहक के इनवॉइस पर क्या दिखे। खाली छोड़ने पर सामान्य शब्द रहेंगे। पता और ईमेल 'सेटिंग्स' से आते हैं और तभी छपते हैं जब वे भरे हों और यहाँ चालू हों।",
    fields: [
      { key: "title", en: "Heading of the invoice", hi: "इनवॉइस का शीर्षक", type: "text", max: 80, def: "TAX INVOICE / DAKSHINA RECEIPT" },
      { key: "tagline", en: "Line under the business name", hi: "नाम के नीचे की पंक्ति", type: "text", max: 160 },
      { key: "numberLabel", en: "Name for the invoice number", hi: "इनवॉइस नंबर का नाम", type: "text", max: 40, def: "Invoice No" },
      { key: "showAddress", en: "Print business address", hi: "व्यवसाय का पता छापें", type: "toggle", def: true },
      { key: "showPhone", en: "Print business phone", hi: "व्यवसाय का फ़ोन छापें", type: "toggle", def: true },
      { key: "showEmail", en: "Print business email", hi: "व्यवसाय का ईमेल छापें", type: "toggle", def: true },
      { key: "showLogo", en: "Print the logo", hi: "लोगो छापें", type: "toggle", def: true },
      { key: "showGstin", en: "Print GSTIN", hi: "GSTIN छापें", type: "toggle", def: true },
      { key: "showCustomerEmail", en: "Print customer email", hi: "ग्राहक का ईमेल छापें", type: "toggle", def: true },
      { key: "showOfferCode", en: "Print the offer code used", hi: "प्रयुक्त ऑफर कोड छापें", type: "toggle", def: true },
      { key: "terms", en: "Terms and declaration (one point per line)", hi: "नियम व घोषणा (हर पंक्ति में एक बिंदु)", type: "textarea", max: 800 },
      { key: "footerLine", en: "Blessing / closing line", hi: "समापन पंक्ति", type: "text", max: 160, def: "ॐ सर्वे भवन्तु सुखिनः सर्वे सन्तु निरामयाः॥" },
      { key: "signatureName", en: "Name for the signature", hi: "हस्ताक्षर का नाम", type: "text", max: 80 },
      { key: "signatureTitle", en: "Designation under the signature", hi: "हस्ताक्षर के नीचे पद", type: "text", max: 80 },
      { key: "userCanDownload", en: "Customers can download their invoice", hi: "ग्राहक अपना इनवॉइस डाउनलोड कर सकें", type: "toggle", def: true },
    ],
  },
  {
    id: "ticket",
    en: "Confirmation ticket",
    hi: "कन्फर्मेशन टिकट",
    noteEn: "The ticket a customer gets after payment is confirmed. The admin can open the same ticket for any order.",
    noteHi: "भुगतान की पुष्टि के बाद ग्राहक को मिलने वाला टिकट। एडमिन किसी भी ऑर्डर का यही टिकट खोल सकता है।",
    fields: [
      { key: "enabled", en: "Give customers a confirmation ticket", hi: "ग्राहक को कन्फर्मेशन टिकट दें", type: "toggle", def: true },
      ...bi("title", "Heading", "शीर्षक", "text", 80),
      ...bi("message", "Message to the customer", "ग्राहक के लिए संदेश", "textarea", 600),
      ...bi("steps", "What happens next (one point per line)", "आगे क्या होगा (हर पंक्ति में एक बिंदु)", "textarea", 800),
      ...bi("support", "Help line (for example: call us on...)", "सहायता पंक्ति", "text", 200),
      { key: "showAmount", en: "Show the amount paid", hi: "भुगतान की राशि दिखाएँ", type: "toggle", def: true },
      { key: "showSlot", en: "Show the appointment date and time", hi: "अपॉइंटमेंट की तारीख़ और समय दिखाएँ", type: "toggle", def: true },
      { key: "showBirth", en: "Show the birth details", hi: "जन्म विवरण दिखाएँ", type: "toggle", def: true },
      { key: "showPhone", en: "Show the Kendra phone number", hi: "केंद्र का फ़ोन नंबर दिखाएँ", type: "toggle", def: true },
      { key: "showAddress", en: "Show the Kendra address (if filled in Settings)", hi: "केंद्र का पता दिखाएँ (यदि सेटिंग्स में भरा हो)", type: "toggle", def: true },
    ],
  },
  {
    id: "offerPopup",
    en: "Offers pop-up",
    hi: "ऑफर पॉप-अप",
    noteEn: "The pop-up visitors see when the site opens. It lists the offers marked \"show in the pop-up\" in Admin → Offers. Visitors can close it.",
    noteHi: "साइट खुलने पर आने वाला पॉप-अप। इसमें 'ऑफर' पेज में चुने गए ऑफर दिखते हैं। आगंतुक इसे बंद कर सकते हैं।",
    fields: [
      { key: "enabled", en: "Show the offers pop-up", hi: "ऑफर पॉप-अप दिखाएँ", type: "toggle", def: true },
      { key: "showList", en: "List each offer (code, discount, validity) in the pop-up", hi: "पॉप-अप में हर ऑफर की सूची दिखाएँ", type: "toggle", def: true },
      { key: "homeOnly", en: "Show only on the home page (otherwise on whichever page the visitor opens first)", hi: "केवल होम पेज पर दिखाएँ", type: "toggle", def: false },
      { key: "showWhenNoOffers", en: "Show the pop-up even when no offer is running", hi: "कोई ऑफर न हो तब भी पॉप-अप दिखाएँ", type: "toggle", def: false },
      { key: "delaySeconds", en: "Show after (seconds)", hi: "कितने सेकंड बाद दिखे", type: "number", def: 4 },
      { key: "repeatHours", en: "Show again after (hours, 0 = on every visit). New offers always show again.", hi: "दोबारा कितने घंटे बाद (0 = हर बार)", type: "number", def: 24 },
      { key: "maxOffers", en: "Most offers to list (1 to 10)", hi: "अधिकतम कितने ऑफर दिखें (1 से 10)", type: "number", def: 4 },
      ...bi("title", "Heading", "शीर्षक", "text", 80),
      ...bi("intro", "Short message under the heading", "शीर्षक के नीचे संदेश", "textarea", 240),
      ...bi("ctaLabel", "Button text", "बटन का नाम", "text", 40),
      { key: "ctaLink", en: "Where the button goes", hi: "बटन कहाँ ले जाए", type: "link", max: 300, def: "/services" },
    ],
  },
  {
    id: "mapPage",
    en: "Map and contact icons",
    hi: "मैप व संपर्क आइकन",
    noteEn: "The row of icons on the Contact page: Map, Navigation, Enquiry, Support and Tickets. Map, address, phone and email themselves are in Settings.",
    noteHi: "संपर्क पेज के आइकन: मैप, नेविगेशन, पूछताछ, सहायता और टिकट। मैप, पता, फ़ोन और ईमेल 'सेटिंग्स' में भरें।",
    fields: [
      { key: "showIcons", en: "Show the icon row", hi: "आइकन की पंक्ति दिखाएँ", type: "toggle", def: true },
      { key: "showMap", en: "Show the Google map on the Contact page", hi: "संपर्क पेज पर गूगल मैप दिखाएँ", type: "toggle", def: true },
      { key: "showFooterBand", en: "Show the map with Help, Enquiry and Support just above the footer (every page)", hi: "फ़ुटर के ऊपर मैप तथा सहायता, पूछताछ और सहयोग दिखाएँ (हर पेज पर)", type: "toggle", def: true },
      { key: "showNavigation", en: "Navigation icon (opens directions)", hi: "नेविगेशन आइकन (रास्ता खुले)", type: "toggle", def: true },
      { key: "showEnquiry", en: "Enquiry icon (goes to the enquiry form)", hi: "पूछताछ आइकन (फ़ॉर्म पर ले जाए)", type: "toggle", def: true },
      { key: "showSupport", en: "Support icon", hi: "सहायता आइकन", type: "toggle", def: true },
      { key: "showTickets", en: "Tickets icon", hi: "टिकट आइकन", type: "toggle", def: true },
      ...bi("navigationLabel", "Navigation label", "नेविगेशन का नाम", "text", 40),
      ...bi("enquiryLabel", "Enquiry label", "पूछताछ का नाम", "text", 40),
      ...bi("supportLabel", "Support label", "सहायता का नाम", "text", 40),
      ...bi("ticketsLabel", "Tickets label", "टिकट का नाम", "text", 40),
      { key: "supportLink", en: "Where Support opens (page, WhatsApp link or phone like tel:98xxxxxxxx)", hi: "सहायता कहाँ खुले (पेज, व्हाट्सऐप लिंक या tel:98xxxxxxxx)", type: "link", max: 300, def: "/help" },
      { key: "ticketsLink", en: "Where Tickets opens", hi: "टिकट कहाँ खुले", type: "link", max: 300, def: "/tickets" },
      { key: "showAddress", en: "Show the full office address block", hi: "पूरा कार्यालय पता दिखाएँ", type: "toggle", def: true },
      { key: "showPhone", en: "Show mobile number", hi: "मोबाइल नंबर दिखाएँ", type: "toggle", def: true },
      { key: "showEmail", en: "Show email (only if filled in Settings)", hi: "ईमेल दिखाएँ (केवल यदि सेटिंग्स में भरा हो)", type: "toggle", def: true },
    ],
  },
  {
    id: "admin",
    en: "Admin settings",
    hi: "एडमिन सेटिंग",
    noteEn: "Quick links to the other control screens.",
    noteHi: "अन्य कंट्रोल स्क्रीन के लिंक।",
    link: { href: "/admin/settings", en: "Open Settings", hi: "सेटिंग्स खोलें" },
    fields: [
      { key: "adminNote", en: "Private notes for admin (not shown to visitors)", hi: "एडमिन के निजी नोट", type: "textarea", max: 1000 },
    ],
  },
];

export const SECTION_IDS = SECTIONS.map((s) => s.id);

/* ---------------- Social media ---------------- */

export const SOCIAL_PLATFORMS = [
  { id: "youtube", name: "YouTube" },
  { id: "whatsapp", name: "WhatsApp" },
  { id: "facebook", name: "Facebook" },
  { id: "instagram", name: "Instagram" },
  { id: "twitter", name: "Twitter / X" },
  { id: "linkedin", name: "LinkedIn" },
  { id: "telegram", name: "Telegram" },
] as const;

export interface SocialLink {
  id: string;
  name: string;
  url: string;
  active: boolean;
}

const PLATFORM_IDS: string[] = SOCIAL_PLATFORMS.map((p) => p.id);

/** Accepts a web address; for WhatsApp also a bare phone number. Returns "" when not usable. */
export function cleanSocialUrl(id: string, raw: unknown): string {
  const v = String(raw ?? "").trim();
  if (!v) return "";
  if (id === "whatsapp" && /^\+?[\d\s-]{8,16}$/.test(v)) {
    let digits = v.replace(/\D/g, "");
    if (digits.length === 10) digits = `91${digits}`;
    return `https://wa.me/${digits}`;
  }
  try {
    const u = new URL(v);
    if (u.protocol !== "https:" && u.protocol !== "http:") return "";
    return u.toString().slice(0, 500);
  } catch {
    return "";
  }
}

export function normalizeSocial(input: unknown): { ok: true; items: SocialLink[] } | { ok: false; error: string } {
  const list = Array.isArray((input as { items?: unknown })?.items) ? ((input as { items: unknown[] }).items) : null;
  if (!list) return { ok: false, error: "Invalid social links." };
  const out: SocialLink[] = [];
  for (const row of list.slice(0, 20)) {
    const r = row as Partial<SocialLink>;
    const id = String(r.id || "");
    if (!PLATFORM_IDS.includes(id)) return { ok: false, error: "Unknown platform." };
    const rawUrl = String(r.url ?? "").trim();
    const url = cleanSocialUrl(id, rawUrl);
    if (rawUrl && !url) return { ok: false, error: `${id}: please enter a full web address starting with https://` };
    const name = String(r.name || SOCIAL_PLATFORMS.find((p) => p.id === id)?.name || id).trim().slice(0, 40);
    out.push({ id, name, url, active: r.active === true });
  }
  return { ok: true, items: out };
}

/** Fills missing platforms so the admin always sees every row. */
export function completeSocial(items: SocialLink[] | null | undefined): SocialLink[] {
  return SOCIAL_PLATFORMS.map((p) => {
    const found = items?.find((i) => i.id === p.id);
    return found ?? { id: p.id, name: p.name, url: "", active: false };
  });
}

/* ---------------- Generic sections ---------------- */

export type SectionValues = Record<string, string | boolean | number>;

export function defaultsFor(section: SectionDef): SectionValues {
  const out: SectionValues = {};
  for (const f of section.fields) out[f.key] = f.def ?? (f.type === "toggle" ? false : f.type === "number" ? 0 : "");
  return out;
}

function validAddress(v: string): boolean {
  return v.startsWith("/") && !v.startsWith("//") ? true : /^https:\/\//i.test(v);
}

export function normalizeSection(
  section: SectionDef,
  input: unknown
): { ok: true; values: SectionValues } | { ok: false; error: string } {
  const src = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const values: SectionValues = {};
  for (const f of section.fields) {
    const raw = src[f.key];
    if (f.type === "toggle") {
      values[f.key] = raw === true;
    } else if (f.type === "number") {
      const n = Number(raw);
      values[f.key] = Number.isFinite(n) ? Math.max(0, Math.min(100000, Math.round(n))) : 0;
    } else {
      const s = String(raw ?? "").trim();
      if (s.length > (f.max ?? 300)) return { ok: false, error: `${f.en} is too long.` };
      if (f.type === "link" && s && !safeHref(s)) return { ok: false, error: `${f.en}: enter a page like /services, a full web address (https://...), tel:+91... or mailto:...` };
      if (f.type === "url" && s && !/^https?:\/\//i.test(s)) return { ok: false, error: `${f.en}: enter a full address starting with https://` };
      if (f.type === "image" && s && !validAddress(s)) return { ok: false, error: `${f.en}: use an uploaded image or an https:// address.` };
      if (f.type === "color" && s && !/^#[0-9a-fA-F]{6}$/.test(s)) return { ok: false, error: `${f.en}: colour must look like #E77B18.` };
      values[f.key] = s;
    }
  }
  return { ok: true, values };
}

/* ---------------- Link lists (menu, footer links) ---------------- */

export interface LinkRow {
  labelEn: string;
  labelHi: string;
  href: string;
  show: boolean;
}

export const LINK_LIST_IDS = ["menu", "footerLinks", "usefulLinks"] as const;

export function normalizeLinkList(input: unknown): { ok: true; items: LinkRow[] } | { ok: false; error: string } {
  const list = Array.isArray((input as { items?: unknown })?.items) ? (input as { items: unknown[] }).items : null;
  if (!list) return { ok: false, error: "Invalid list." };
  const out: LinkRow[] = [];
  for (const row of list.slice(0, 40)) {
    const r = row as Partial<LinkRow>;
    const labelEn = String(r.labelEn ?? "").trim().slice(0, 60);
    const labelHi = String(r.labelHi ?? "").trim().slice(0, 60);
    const href = String(r.href ?? "").trim();
    if (!labelEn && !labelHi && !href) continue;
    if (!labelEn && !labelHi) return { ok: false, error: "Every link needs a name." };
    const ok = safeHref(href);
    if (!ok) return { ok: false, error: `"${labelEn || labelHi}": enter a page like /services, a full web address (https://...), tel:+91... or mailto:...` };
    out.push({ labelEn, labelHi, href: ok.href, show: r.show !== false });
  }
  return { ok: true, items: out };
}
