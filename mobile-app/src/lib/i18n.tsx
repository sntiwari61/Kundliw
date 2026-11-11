import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import * as SecureStore from "expo-secure-store";

export type Lang = "hi" | "en";
const LANG_KEY = "kjk.lang";

/** Every word the app shows, in English and Hindi. Hindi labels match the website's. */
const STRINGS = {
  appName: { en: "Maharshi Kanad Jyotish Kendra", hi: "महर्षि कणाद ज्योतिष केंद्र" },
  user: { en: "User", hi: "यूज़र" },
  associate: { en: "Associate", hi: "एसोसिएट" },
  signInAs: { en: "Sign in as", hi: "लॉगिन का प्रकार" },
  mobileOtp: { en: "Mobile OTP", hi: "मोबाइल ओटीपी" },
  emailPassword: { en: "Email & password", hi: "ईमेल एवं पासवर्ड" },
  mobileNumber: { en: "Mobile number (+91)", hi: "मोबाइल नंबर (+91)" },
  sendOtp: { en: "Send OTP", hi: "ओटीपी (OTP) भेजें" },
  otpSent: { en: "A 6-digit code was sent to your mobile number.", hi: "आपके मोबाइल नंबर पर 6 अंकों का कोड भेजा गया है।" },
  enterOtp: { en: "6-digit code", hi: "6 अंकों का कोड" },
  verify: { en: "Verify and sign in", hi: "सत्यापित कर लॉगिन करें" },
  changeNumber: { en: "Change number", hi: "नंबर बदलें" },
  emailOrMobile: { en: "Email or mobile number", hi: "ईमेल या मोबाइल नंबर" },
  password: { en: "Password", hi: "पासवर्ड" },
  showPassword: { en: "Show password", hi: "पासवर्ड दिखाएँ" },
  hidePassword: { en: "Hide password", hi: "पासवर्ड छिपाएँ" },
  signIn: { en: "Sign in", hi: "लॉगिन" },
  forgotPassword: { en: "Forgot password?", hi: "पासवर्ड भूल गए?" },
  register: { en: "New here? Register on the website", hi: "नए हैं? वेबसाइट पर पंजीकरण करें" },
  invalidPhone: { en: "Enter a valid 10-digit mobile number.", hi: "सही 10 अंकों का मोबाइल नंबर लिखें।" },
  invalidOtp: { en: "Enter the 6-digit code.", hi: "6 अंकों का कोड लिखें।" },
  fillBoth: { en: "Enter your email or mobile number and your password.", hi: "अपना ईमेल या मोबाइल नंबर और पासवर्ड लिखें।" },
  home: { en: "Home", hi: "मुख्य पृष्ठ" },
  account: { en: "My account", hi: "मेरा खाता" },
  namaste: { en: "Namaste", hi: "नमस्ते" },
  services: { en: "Services", hi: "सेवाएँ" },
  from: { en: "From", hi: "प्रारंभ" },
  plans: { en: "plans", hi: "प्लान" },
  noServices: { en: "No services are listed right now.", hi: "अभी कोई सेवा सूचीबद्ध नहीं है।" },
  retry: { en: "Try again", hi: "फिर कोशिश करें" },
  bookOnWebsite: { en: "Booking in the app is coming soon. Tap a service to book it on the website.", hi: "ऐप में बुकिंग शीघ्र आ रही है। वेबसाइट पर बुक करने के लिए सेवा पर दबाएँ।" },
  role: { en: "Account type", hi: "खाते का प्रकार" },
  mobile: { en: "Mobile", hi: "मोबाइल" },
  email: { en: "Email", hi: "ईमेल" },
  associateStatus: { en: "Associate status", hi: "एसोसिएट स्थिति" },
  language: { en: "Language", hi: "भाषा" },
  legal: { en: "Policies", hi: "नीतियाँ" },
  terms: { en: "Terms & Conditions", hi: "नियम एवं शर्तें" },
  privacy: { en: "Privacy Policy", hi: "गोपनीयता नीति" },
  refund: { en: "Refund Policy", hi: "धनवापसी नीति" },
  cancellation: { en: "Cancellation Policy", hi: "रद्दीकरण नीति" },
  signOut: { en: "Log out", hi: "लॉग आउट" },
  deleteAccount: { en: "Delete my account", hi: "मेरा खाता हटाएँ" },
  deleteTitle: { en: "Delete your account", hi: "अपना खाता हटाएँ" },
  deleteWarning: { en: "This cannot be undone.", hi: "इसे वापस नहीं किया जा सकता।" },
  deleteWhat: {
    en: "Your name, email, mobile number, password, Vault files and (for Associates) payout details are removed. Orders, GST invoices and commission records are kept as the law requires, without your name.",
    hi: "आपका नाम, ईमेल, मोबाइल नंबर, पासवर्ड, वॉल्ट की फ़ाइलें और (एसोसिएट के लिए) भुगतान विवरण हटा दिए जाते हैं। ऑर्डर, GST इनवॉइस और कमीशन के अभिलेख कानून के अनुसार आपके नाम के बिना रखे जाते हैं।",
  },
  typeDelete: { en: "Type DELETE to confirm", hi: "पुष्टि के लिए DELETE लिखें" },
  passwordIfAny: { en: "Your password (if your account has one)", hi: "आपका पासवर्ड (यदि खाते में है)" },
  cancel: { en: "Cancel", hi: "रद्द करें" },
  loading: { en: "Loading...", hi: "लोड हो रहा है..." },
} as const;

export type StringKey = keyof typeof STRINGS;

interface LanguageValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: StringKey) => string;
  /** Picks the English or Hindi field of something from the server. */
  pick: (en: string | null | undefined, hi: string | null | undefined) => string;
}

const LanguageContext = createContext<LanguageValue | null>(null);

export function translate(lang: Lang, key: StringKey): string {
  return STRINGS[key][lang];
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Hindi first, like the website
  const [lang, setLangState] = useState<Lang>("hi");

  useEffect(() => {
    SecureStore.getItemAsync(LANG_KEY)
      .then((saved) => {
        if (saved === "en" || saved === "hi") setLangState(saved);
      })
      .catch(() => undefined);
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    SecureStore.setItemAsync(LANG_KEY, next).catch(() => undefined);
  }, []);

  const value = useMemo<LanguageValue>(
    () => ({
      lang,
      setLang,
      t: (key) => translate(lang, key),
      pick: (en, hi) => (lang === "hi" ? hi || en || "" : en || hi || ""),
    }),
    [lang, setLang],
  );
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageValue {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used inside LanguageProvider");
  return value;
}
