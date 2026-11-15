/**
 * The app's own wording for the Home blocks. The admin can replace any of it in the website's Settings
 * (the same boxes the website uses); an empty box keeps these words.
 */

export interface Pair {
  en: string;
  hi: string;
}
export interface Item {
  icon: string;
  title: Pair;
  text: Pair;
}

export const HOME_SLIDES: { image: string; title: Pair; text: Pair }[] = [
  {
    image: "/ref/hero-1.webp",
    title: { en: "Vedic Wisdom for a Balanced & Prosperous Life", hi: "संतुलित और समृद्ध जीवन के लिए वैदिक ज्ञान" },
    text: {
      en: "Personalized guidance for Kundli, Prashn Kundli, matching, Puja, Paath, Yagya, Vastu and important life decisions.",
      hi: "कुंडली, प्रश्न कुंडली, मिलान, पूजा, पाठ, यज्ञ, वास्तु और जीवन के महत्त्वपूर्ण निर्णयों के लिए व्यक्तिगत मार्गदर्शन।",
    },
  },
  {
    image: "/ref/hero-2.webp",
    title: { en: "Know Your Kundli. Plan With Confidence.", hi: "अपनी कुंडली जानिए, भरोसे से आगे बढ़िए" },
    text: {
      en: "Order a Kundli or matching report online and follow it step by step until it reaches you.",
      hi: "कुंडली या मिलान रिपोर्ट ऑनलाइन मँगवाएँ और उसकी हर प्रगति देखें।",
    },
  },
];

export const WHY: Item[] = [
  { icon: "sparkles", title: { en: "Traditional Vedic approach", hi: "पारंपरिक वैदिक पद्धति" }, text: { en: "Guidance built on established Jyotish principles.", hi: "स्थापित ज्योतिष सिद्धांतों पर आधारित मार्गदर्शन।" } },
  { icon: "heart", title: { en: "Personal attention", hi: "व्यक्तिगत ध्यान" }, text: { en: "Every reading uses your own birth details and your question.", hi: "हर विश्लेषण आपके जन्म विवरण और आपके प्रश्न पर आधारित होता है।" } },
  { icon: "lock-closed", title: { en: "Your details stay private", hi: "आपकी जानकारी गोपनीय" }, text: { en: "Your birth details and files are kept private and shared with no one.", hi: "आपका जन्म विवरण और फ़ाइलें निजी रहती हैं और किसी से साझा नहीं होतीं।" } },
  { icon: "receipt", title: { en: "Clear prices, proper invoice", hi: "साफ़ कीमत, उचित बिल" }, text: { en: "See the price before you pay and get an invoice for every order.", hi: "भुगतान से पहले कीमत देखें और हर ऑर्डर का बिल पाएँ।" } },
  { icon: "logo-whatsapp", title: { en: "Support on WhatsApp", hi: "व्हाट्सऐप पर सहायता" }, text: { en: "Ask a question, share details or follow up directly on WhatsApp.", hi: "सवाल पूछें, जानकारी भेजें या सीधे व्हाट्सऐप पर पूछताछ करें।" } },
  { icon: "language", title: { en: "Hindi and English", hi: "हिंदी और अंग्रेज़ी" }, text: { en: "The whole app and your reports are available in both languages.", hi: "पूरा ऐप और आपकी रिपोर्ट दोनों भाषाओं में उपलब्ध हैं।" } },
];

export const STEPS: Item[] = [
  { icon: "compass", title: { en: "Choose Service / Plan", hi: "सेवा / योजना चुनें" }, text: { en: "Select the required service or plan.", hi: "ज़रूरी सेवा या योजना चुनें।" } },
  { icon: "create", title: { en: "Enter Your Details", hi: "अपना विवरण भरें" }, text: { en: "Sign in and enter your birth and contact details.", hi: "लॉगिन करें और जन्म तथा संपर्क विवरण भरें।" } },
  { icon: "card", title: { en: "Confirm Fee & Pay", hi: "शुल्क देखें और भुगतान करें" }, text: { en: "Check the final amount and pay by UPI or bank.", hi: "अंतिम राशि देखें और UPI या बैंक से भुगतान करें।" } },
  { icon: "download", title: { en: "Track & Receive", hi: "ट्रैक करें और पाएँ" }, text: { en: "Follow the status and receive your report.", hi: "स्थिति देखें और अपनी रिपोर्ट पाएँ।" } },
];

export const TIPS: Item[] = [
  { icon: "calendar", title: { en: "Keep your birth details ready", hi: "जन्म विवरण तैयार रखें" }, text: { en: "Date, exact time and place of birth. A birth certificate or hospital record is the best source.", hi: "तारीख, सही समय और जन्म स्थान। जन्म प्रमाणपत्र या अस्पताल का रिकॉर्ड सबसे अच्छा स्रोत है।" } },
  { icon: "chatbubble-ellipses", title: { en: "Write your question clearly", hi: "अपना प्रश्न साफ़ लिखें" }, text: { en: "One focused question, such as marriage, career or health, gives a clearer answer.", hi: "विवाह, करियर या स्वास्थ्य जैसा एक स्पष्ट प्रश्न साफ़ उत्तर देता है।" } },
  { icon: "call", title: { en: "Choose a quiet time for the call", hi: "कॉल के लिए शांत समय चुनें" }, text: { en: "Pick a slot when you can talk without interruption and keep a pen and paper nearby.", hi: "ऐसा समय चुनें जब आप बिना रुकावट बात कर सकें और कलम-काग़ज़ पास रखें।" } },
  { icon: "pricetag", title: { en: "Keep your order number", hi: "ऑर्डर नंबर संभालकर रखें" }, text: { en: "Your order number lets you track the order and reach us quickly with any question.", hi: "ऑर्डर नंबर से आप ऑर्डर ट्रैक कर सकते हैं और जल्दी संपर्क कर सकते हैं।" } },
];

export const ABOUT: { title: Pair; text: Pair; points: Item[] } = {
  title: { en: "Ancient Wisdom. Personal Guidance.", hi: "प्राचीन ज्ञान। व्यक्तिगत मार्गदर्शन।" },
  text: {
    en: "Maharshi Kanad Jyotish Kendra provides Vedic astrology, Janam Kundli, Prashn Kundli, Kundli Matching, Puja, Paath, Yagya, Vastu and connected support services.",
    hi: "महर्षि कणाद ज्योतिष केंद्र वैदिक ज्योतिष, जन्म कुंडली, प्रश्न कुंडली, कुंडली मिलान, पूजा, पाठ, यज्ञ, वास्तु और संबद्ध सहयोगी सेवाएँ प्रदान करता है।",
  },
  points: [
    { icon: "checkmark-circle", title: { en: "Traditional Vedic Approach", hi: "पारंपरिक वैदिक पद्धति" }, text: { en: "Consultations structured around established Jyotish principles.", hi: "स्थापित ज्योतिष सिद्धांतों पर आधारित परामर्श।" } },
    { icon: "checkmark-circle", title: { en: "Personalized Guidance", hi: "व्यक्तिगत मार्गदर्शन" }, text: { en: "Guidance is based on your submitted details and specific requirements.", hi: "मार्गदर्शन आपके दिए विवरण और विशेष ज़रूरतों पर आधारित है।" } },
    { icon: "checkmark-circle", title: { en: "Online & Offline Support", hi: "ऑनलाइन और ऑफ़लाइन सहायता" }, text: { en: "Book online or continue directly through WhatsApp.", hi: "ऑनलाइन बुक करें या सीधे व्हाट्सऐप से आगे बढ़ें।" } },
  ],
};

/** Section headings: key in the website's settings, with the app's own words */
export const HEADINGS = {
  services: { key: "servicesTitle", en: "Our Services", hi: "हमारी सेवाएँ" },
  other: { key: "connectedTitle", en: "Puja, Vastu & More", hi: "पूजा, वास्तु और अन्य सेवाएँ" },
  why: { key: "whyTitle", en: "Trust Built on Care and Clarity", hi: "भरोसा, देखभाल और स्पष्टता से" },
  steps: { key: "bookingTitle", en: "Simple Booking Flow", hi: "बुकिंग का आसान तरीका" },
  tips: { key: "tipsTitle", en: "Get the Most From Your Consultation", hi: "परामर्श का पूरा लाभ पाएँ" },
  reviews: { key: "reviewsTitle", en: "What people say", hi: "लोग क्या कहते हैं" },
  blog: { key: "blogTitle", en: "Guidance and Insights", hi: "मार्गदर्शन और जानकारी" },
  faq: { key: "faqTitle", en: "Frequently Asked Questions", hi: "सामान्य प्रश्न" },
  contact: { key: "contactTitle", en: "Begin Your Consultation", hi: "अपना परामर्श शुरू करें" },
  gallery: { key: "galleryTitle", en: "Sacred Moments", hi: "पावन क्षण" },
  offers: { key: "", en: "Offers for you", hi: "आपके लिए ऑफ़र" },
} as const;
