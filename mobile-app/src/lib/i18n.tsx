import { setApiLanguage } from "./api";
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
  register: { en: "New here? Create an account", hi: "नए हैं? खाता बनाएँ" },
  continueBrowsing: { en: "Continue browsing without signing in", hi: "बिना लॉगिन किए देखते रहें" },
  guestName: { en: "Guest", hi: "अतिथि" },
  guestOrdersTitle: { en: "Sign in to see your orders", hi: "अपने ऑर्डर देखने के लिए लॉगिन करें" },
  guestVaultTitle: { en: "Sign in to open your Vault", hi: "अपना वॉल्ट खोलने के लिए लॉगिन करें" },
  guestNote: { en: "Browsing is open to everyone. Sign in or create an account to book and pay. Your account works on the website too.", hi: "देखने के लिए लॉगिन ज़रूरी नहीं। बुक और पेमेंट करने के लिए लॉगिन या खाता बनाएँ। आपका खाता वेबसाइट पर भी चलेगा।" },
  loginToBook: { en: "Please sign in or create an account to continue. Your details here are kept.", hi: "आगे बढ़ने के लिए लॉगिन करें या खाता बनाएँ। यहाँ भरी जानकारी सुरक्षित रहेगी।" },
  createAccount: { en: "Create account", hi: "खाता बनाएँ" },
  registerTitle: { en: "Create your account", hi: "अपना खाता बनाएँ" },
  registerNote: { en: "The same account works on the website and in the app.", hi: "यही खाता वेबसाइट और ऐप दोनों पर चलेगा।" },
  emailAddress: { en: "Email address", hi: "ईमेल" },
  passwordOptional: { en: "Password (optional, at least 8 characters)", hi: "पासवर्ड (वैकल्पिक, कम से कम 8 अक्षर)" },
  passwordRequired: { en: "Password (at least 8 characters)", hi: "पासवर्ड (कम से कम 8 अक्षर)" },
  adultConfirm: { en: "I am 18 or older and accept the Terms and Privacy Policy.", hi: "मैं 18 वर्ष या उससे अधिक का हूँ और नियम एवं गोपनीयता नीति स्वीकार करता/करती हूँ।" },
  errEmailAddr: { en: "Enter a valid email address.", hi: "सही ईमेल लिखें।" },
  errPasswordShort: { en: "Password must be at least 8 characters.", hi: "पासवर्ड कम से कम 8 अक्षर का होना चाहिए।" },
  errAdult: { en: "Please confirm you are 18 or older.", hi: "कृपया पुष्टि करें कि आप 18 वर्ष या अधिक के हैं।" },
  alreadyHaveAccount: { en: "Already have an account? Sign in", hi: "पहले से खाता है? लॉगिन करें" },
  accountMade: { en: "Account created. A code was sent to your mobile number to sign in.", hi: "खाता बन गया। लॉगिन के लिए आपके मोबाइल पर कोड भेजा गया है।" },
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
  tapToBook: { en: "Choose a service to see its plans and book.", hi: "प्लान देखने और बुक करने के लिए सेवा चुनें।" },
  myOrders: { en: "My orders", hi: "मेरे ऑर्डर" },
  noOrders: { en: "You have no orders yet.", hi: "अभी आपका कोई ऑर्डर नहीं है।" },
  orderNo: { en: "Order", hi: "ऑर्डर" },
  plan: { en: "plan", hi: "प्लान" },
  choosePlan: { en: "Choose a plan", hi: "प्लान चुनें" },
  deliveryIn: { en: "Delivery in", hi: "डिलीवरी" },
  days: { en: "days", hi: "दिन" },
  pagesWord: { en: "pages", hi: "पृष्ठ" },
  callOf: { en: "Call of", hi: "कॉल" },
  minutes: { en: "min", hi: "मिनट" },
  includesCall: { en: "Includes a consultation call", hi: "परामर्श कॉल शामिल" },
  bookThisPlan: { en: "Book this plan", hi: "यह प्लान बुक करें" },
  noPlans: { en: "No plans are available for this service right now.", hi: "इस सेवा के लिए अभी कोई प्लान उपलब्ध नहीं है।" },
  bookingTitle: { en: "Book", hi: "बुकिंग" },
  yourDetails: { en: "Your birth details", hi: "आपकी जन्म जानकारी" },
  fullName: { en: "Full name", hi: "पूरा नाम" },
  gender: { en: "Gender", hi: "लिंग" },
  male: { en: "Male", hi: "पुरुष" },
  female: { en: "Female", hi: "महिला" },
  other: { en: "Other", hi: "अन्य" },
  dob: { en: "Date of birth (DD-MM-YYYY)", hi: "जन्म तिथि (DD-MM-YYYY)" },
  tob: { en: "Time of birth (24-hour, HH:MM)", hi: "जन्म समय (24 घंटे, HH:MM)" },
  timeUnknown: { en: "I do not know the birth time", hi: "मुझे जन्म समय नहीं पता" },
  pob: { en: "Place of birth", hi: "जन्म स्थान" },
  contactPhone: { en: "Mobile number", hi: "मोबाइल नंबर" },
  emailOptional: { en: "Email (optional)", hi: "ईमेल (वैकल्पिक)" },
  reportLanguage: { en: "Language of your report", hi: "रिपोर्ट की भाषा" },
  queries: { en: "Your questions (optional)", hi: "आपके प्रश्न (वैकल्पिक)" },
  familyDetails: { en: "Family details", hi: "पारिवारिक जानकारी" },
  fatherName: { en: "Father's name", hi: "पिता का नाम" },
  motherName: { en: "Mother's name", hi: "माता का नाम" },
  grandfatherName: { en: "Grandfather's name", hi: "दादा का नाम" },
  gotra: { en: "Gotra", hi: "गोत्र" },
  address: { en: "Address", hi: "पता" },
  partnerDetails: { en: "Partner's birth details", hi: "जीवनसाथी की जन्म जानकारी" },
  partnerName: { en: "Partner's full name", hi: "जीवनसाथी का पूरा नाम" },
  chooseSlot: { en: "Choose a call time", hi: "कॉल का समय चुनें" },
  noSlots: { en: "No call times are open right now. Please try again later.", hi: "अभी कोई कॉल समय उपलब्ध नहीं है। कृपया बाद में प्रयास करें।" },
  offerCode: { en: "Offer code (optional)", hi: "ऑफ़र कोड (वैकल्पिक)" },
  apply: { en: "Apply", hi: "लागू करें" },
  removeOffer: { en: "Remove", hi: "हटाएँ" },
  offerApplied: { en: "Offer applied", hi: "ऑफ़र लागू हुआ" },
  priceSummary: { en: "Price", hi: "मूल्य" },
  basePrice: { en: "Plan price", hi: "प्लान का मूल्य" },
  discount: { en: "Discount", hi: "छूट" },
  gstLine: { en: "GST", hi: "जीएसटी" },
  total: { en: "Total to pay", hi: "कुल देय" },
  placeOrder: { en: "Continue to payment", hi: "भुगतान के लिए आगे बढ़ें" },
  totalNote: { en: "The final amount is confirmed by the Kendra when your order is created.", hi: "अंतिम राशि ऑर्डर बनने पर केंद्र द्वारा तय की जाती है।" },
  errName: { en: "Enter at least 2 letters.", hi: "कम से कम 2 अक्षर लिखें।" },
  errDob: { en: "Enter a real date like 25-12-1990.", hi: "सही तारीख लिखें, जैसे 25-12-1990।" },
  errTob: { en: "Enter the time like 06:05 or 18:30.", hi: "समय ऐसे लिखें: 06:05 या 18:30।" },
  errPob: { en: "Enter the place of birth.", hi: "जन्म स्थान लिखें।" },
  errPhone: { en: "Enter a valid 10-digit mobile number.", hi: "सही 10 अंकों का मोबाइल नंबर लिखें।" },
  errEmail: { en: "Enter a valid email address.", hi: "सही ईमेल पता लिखें।" },
  errRequired: { en: "This is required.", hi: "यह जानकारी आवश्यक है।" },
  errSlot: { en: "Choose a time for the call.", hi: "कॉल के लिए समय चुनें।" },
  fixErrors: { en: "Please correct the marked fields.", hi: "कृपया चिह्नित जानकारी ठीक करें।" },
  payTitle: { en: "Payment", hi: "भुगतान" },
  amountToPay: { en: "Amount to pay", hi: "देय राशि" },
  payStep: { en: "Send the amount to the Kendra by UPI or bank transfer, then enter the reference number below.", hi: "राशि UPI या बैंक ट्रांसफर से केंद्र को भेजें, फिर नीचे संदर्भ संख्या लिखें।" },
  payByUpi: { en: "Pay by UPI", hi: "UPI से भुगतान" },
  payByBank: { en: "Bank transfer", hi: "बैंक ट्रांसफर" },
  upiId: { en: "UPI ID", hi: "UPI आईडी" },
  accountName: { en: "Account name", hi: "खाते का नाम" },
  accountNumber: { en: "Account number", hi: "खाता संख्या" },
  ifsc: { en: "IFSC", hi: "IFSC" },
  bank: { en: "Bank", hi: "बैंक" },
  copy: { en: "Copy", hi: "कॉपी" },
  copied: { en: "Copied", hi: "कॉपी हो गया" },
  utr: { en: "UPI UTR / bank reference number", hi: "UPI UTR / बैंक संदर्भ संख्या" },
  utrRequired: { en: "Enter the reference number of your payment.", hi: "अपने भुगतान की संदर्भ संख्या लिखें।" },
  submitPayment: { en: "I have paid, submit", hi: "मैंने भुगतान कर दिया, जमा करें" },
  paymentSent: { en: "Thank you. The Kendra will verify your payment and confirm your order.", hi: "धन्यवाद। केंद्र आपका भुगतान जाँचकर ऑर्डर की पुष्टि करेगा।" },
  payNow: { en: "Pay now", hi: "अभी भुगतान करें" },
  noPayInfo: { en: "The payment details are not set up yet. Please contact the Kendra.", hi: "भुगतान की जानकारी अभी नहीं जुड़ी है। कृपया केंद्र से संपर्क करें।" },
  orderStatus: { en: "Order status", hi: "ऑर्डर की स्थिति" },
  paymentStatus: { en: "Payment", hi: "भुगतान" },
  callTime: { en: "Call time", hi: "कॉल का समय" },
  rejectedNote: { en: "Your payment could not be verified", hi: "आपका भुगतान सत्यापित नहीं हो सका" },
  cancelled: { en: "Cancelled", hi: "रद्द" },
  placedOn: { en: "Placed on", hi: "ऑर्डर की तिथि" },
  invoiceNo: { en: "Invoice", hi: "इनवॉइस" },
  tabHome: { en: "Home", hi: "मुख्य" },
  tabServices: { en: "Services", hi: "सेवाएँ" },
  tabOrders: { en: "Orders", hi: "ऑर्डर" },
  tabVault: { en: "Vault", hi: "वॉल्ट" },
  tabDashboard: { en: "Dashboard", hi: "डैशबोर्ड" },
  tabAccount: { en: "Account", hi: "खाता" },
  homeSub: { en: "Vedic astrology & guidance", hi: "वैदिक ज्योतिष एवं मार्गदर्शन" },
  quickActions: { en: "Quick actions", hi: "त्वरित सुविधाएँ" },
  ourServices: { en: "Our services", hi: "हमारी सेवाएँ" },
  seeAll: { en: "See all", hi: "सभी देखें" },
  support: { en: "Help & support", hi: "सहायता" },
  vaultTitle: { en: "Your Vault", hi: "आपका वॉल्ट" },
  vaultNote: { en: "Your Kundli, reports and documents are kept here. Only you can open them.", hi: "आपकी कुंडली, रिपोर्ट और दस्तावेज़ यहाँ रखे जाते हैं। इन्हें केवल आप खोल सकते हैं।" },
  vaultEmpty: { en: "No documents yet", hi: "अभी कोई दस्तावेज़ नहीं" },
  vaultEmptyNote: { en: "Reports sent by the Kendra and files you upload will appear here.", hi: "केंद्र द्वारा भेजी गई रिपोर्ट और आपकी अपलोड की फ़ाइलें यहाँ दिखेंगी।" },
  uploadFile: { en: "Upload a file", hi: "फ़ाइल अपलोड करें" },
  fromKendra: { en: "From the Kendra", hi: "केंद्र से" },
  uploadedByYou: { en: "Uploaded by you", hi: "आपने अपलोड किया" },
  openFile: { en: "Open", hi: "खोलें" },
  fileTooBig: { en: "This file is too large. The limit is 4 MB.", hi: "यह फ़ाइल बहुत बड़ी है। सीमा 4 MB है।" },
  fileUploaded: { en: "File uploaded to your Vault.", hi: "फ़ाइल आपके वॉल्ट में जुड़ गई।" },
  newTicket: { en: "New ticket", hi: "नया टिकट" },
  ticket: { en: "Ticket", hi: "टिकट" },
  noTickets: { en: "No tickets yet", hi: "अभी कोई टिकट नहीं" },
  noTicketsNote: { en: "Raise a ticket if you need help with an order or your account.", hi: "ऑर्डर या खाते में सहायता चाहिए तो टिकट बनाएँ।" },
  subject: { en: "Subject", hi: "विषय" },
  yourMessage: { en: "Your message", hi: "आपका संदेश" },
  relatedOrder: { en: "Order number (optional)", hi: "ऑर्डर नंबर (वैकल्पिक)" },
  emailLabel: { en: "Email", hi: "ईमेल" },
  sendTicket: { en: "Send ticket", hi: "टिकट भेजें" },
  writeReply: { en: "Write a reply", hi: "उत्तर लिखें" },
  sendReply: { en: "Send reply", hi: "उत्तर भेजें" },
  fromYou: { en: "You", hi: "आप" },
  kendraName: { en: "Kendra", hi: "केंद्र" },
  helpCall: { en: "Need help? Raise a ticket and the Kendra will reply here.", hi: "सहायता चाहिए? टिकट बनाएँ, केंद्र यहीं उत्तर देगा।" },
  dashTitle: { en: "Associate dashboard", hi: "एसोसिएट डैशबोर्ड" },
  referralCode: { en: "Your referral code", hi: "आपका रेफ़रल कोड" },
  shareCode: { en: "Share with friends", hi: "मित्रों को भेजें" },
  earnPending: { en: "Pending", hi: "लंबित" },
  earnAvailable: { en: "Available", hi: "उपलब्ध" },
  earnRequested: { en: "Payout requested", hi: "भुगतान अनुरोधित" },
  earnPaid: { en: "Paid out", hi: "भुगतान हो चुका" },
  referredOrders: { en: "Referred orders", hi: "रेफ़र किए ऑर्डर" },
  commissions: { en: "Commissions", hi: "कमीशन" },
  noCommissions: { en: "No commissions yet. Share your code to start earning.", hi: "अभी कोई कमीशन नहीं। कमाई शुरू करने के लिए अपना कोड साझा करें।" },
  payouts: { en: "Payout requests", hi: "भुगतान अनुरोध" },
  requestPayout: { en: "Request payout", hi: "भुगतान का अनुरोध करें" },
  payoutHint: { en: "This asks the Kendra to pay all your available earnings.", hi: "यह केंद्र से आपकी सभी उपलब्ध कमाई के भुगतान का अनुरोध है।" },
  payoutDone: { en: "Payout requested. The Kendra will pay and confirm.", hi: "भुगतान का अनुरोध भेज दिया गया। केंद्र भुगतान करके सूचित करेगा।" },
  changeCode: { en: "Change code", hi: "कोड बदलें" },
  randomCode: { en: "Make a random code", hi: "नया कोड बनाएँ" },
  ownCode: { en: "Your own code (6 to 16 letters or numbers)", hi: "अपना कोड (6 से 16 अक्षर या अंक)" },
  saveCode: { en: "Save code", hi: "कोड सहेजें" },
  codeChanged: { en: "Your code was changed. Links with the old code stop working.", hi: "आपका कोड बदल गया। पुराने कोड वाले लिंक काम नहीं करेंगे।" },
  assocPending: { en: "Your Associate account is waiting for approval by the Kendra.", hi: "आपका एसोसिएट खाता केंद्र की स्वीकृति की प्रतीक्षा में है।" },
  assocRejected: { en: "Your Associate request was not approved.", hi: "आपका एसोसिएट अनुरोध स्वीकृत नहीं हुआ।" },
  assocSuspended: { en: "Your Associate account is suspended. Please contact the Kendra.", hi: "आपका एसोसिएट खाता निलंबित है। कृपया केंद्र से संपर्क करें।" },
  amountWord: { en: "Amount", hi: "राशि" },
  dateWord: { en: "Date", hi: "दिनांक" },
  shareText: { en: "Namaste. Book Kundli, matching and other Jyotish services with Maharshi Kanad Jyotish Kendra:", hi: "नमस्ते। महर्षि कणाद ज्योतिष केंद्र में कुंडली, मिलान और अन्य ज्योतिष सेवाएँ यहाँ से बुक करें:" },
  aboutKendra: { en: "About the Kendra", hi: "केंद्र के बारे में" },
  contactUs: { en: "Call the Kendra", hi: "केंद्र को कॉल करें" },
  errSubject: { en: "Write a short subject (at least 3 letters).", hi: "छोटा विषय लिखें (कम से कम 3 अक्षर)।" },
  errMessage: { en: "Describe your problem in a few words.", hi: "अपनी समस्या कुछ शब्दों में लिखें।" },
  errPhoneAny: { en: "Enter a valid phone number.", hi: "सही फ़ोन नंबर लिखें।" },
  errAddress: { en: "Enter your address.", hi: "अपना पता लिखें।" },
  pendingPayNote: { en: "You have an order waiting for payment.", hi: "आपका एक ऑर्डर भुगतान की प्रतीक्षा में है।" },
  explore: { en: "Explore", hi: "जानिए" },
  aboutUs: { en: "About us", hi: "हमारे बारे में" },
  founderTitle: { en: "The Founder", hi: "संस्थापक परिचय" },
  faqTitle: { en: "Questions and answers", hi: "सामान्य प्रश्न" },
  galleryTitle: { en: "Gallery", hi: "गैलरी" },
  blogsTitle: { en: "Articles", hi: "लेख" },
  testimonialsTitle: { en: "Experiences", hi: "अनुभव" },
  offersTitle: { en: "Offers", hi: "ऑफ़र" },
  contactTitle: { en: "Contact", hi: "संपर्क" },
  ourTeam: { en: "Our team", hi: "हमारी टीम" },
  ourMission: { en: "Our mission", hi: "हमारा उद्देश्य" },
  aboutDefault: { en: "Maharshi Kanad Jyotish Kendra offers Vedic astrology services: Kundli preparation, Kundli matching, Prashna Kundli and consultations.", hi: "महर्षि कणाद ज्योतिष केंद्र वैदिक ज्योतिष सेवाएँ प्रदान करता है: कुंडली निर्माण, कुंडली मिलान, प्रश्न कुंडली और परामर्श।" },
  founderSoon: { en: "The founder's profile will be published here soon.", hi: "संस्थापक का परिचय शीघ्र ही यहाँ प्रकाशित किया जाएगा।" },
  noContent: { en: "Nothing here yet. Please check again soon.", hi: "अभी यहाँ कुछ नहीं है। कृपया जल्द फिर देखें।" },
  watchVideo: { en: "Watch video", hi: "वीडियो देखें" },
  openLink: { en: "Open link", hi: "लिंक खोलें" },
  readArticle: { en: "Read article", hi: "लेख पढ़ें" },
  copyCode: { en: "Copy code", hi: "कोड कॉपी करें" },
  codeCopied: { en: "Code copied", hi: "कोड कॉपी हो गया" },
  offerHow: { en: "Enter this code when you book a service.", hi: "सेवा बुक करते समय यह कोड डालें।" },
  autoApplied: { en: "Applied automatically", hi: "अपने आप लागू होता है" },
  validTill: { en: "Valid till", hi: "मान्य तिथि" },
  minOrder: { en: "On orders above", hi: "इससे ऊपर के ऑर्डर पर" },
  maxOff: { en: "Up to", hi: "अधिकतम" },
  off: { en: "off", hi: "की छूट" },
  callUs: { en: "Call", hi: "कॉल करें" },
  emailUs: { en: "Email", hi: "ईमेल करें" },
  openMap: { en: "Open in Maps", hi: "नक्शे में खोलें" },
  workingHours: { en: "Working hours", hi: "कार्य समय" },
  addressLabel: { en: "Address", hi: "पता" },
  followUs: { en: "Follow us", hi: "हमसे जुड़ें" },
  goBack: { en: "Go back", hi: "वापस जाएँ" },
  askQuestion: { en: "Raise a support ticket", hi: "सहायता टिकट बनाएँ" },
  errPlace: { en: "Enter at least 2 letters.", hi: "कम से कम 2 अक्षर लिखें।" },
  errQuestion: { en: "Please write your question (at least 5 letters).", hi: "कृपया अपना प्रश्न लिखें (कम से कम 5 अक्षर)।" },
  kundliTool: { en: "Free Kundli", hi: "निःशुल्क कुंडली" },
  panchangTool: { en: "Panchang", hi: "पंचांग" },
  matchingTool: { en: "Kundli matching", hi: "कुंडली मिलान" },
  toolsIntro: { en: "Live tools, free to use.", hi: "लाइव टूल, निःशुल्क।" },
  toolOff: { en: "This tool is not available right now. Please try again later or contact us.", hi: "यह टूल अभी उपलब्ध नहीं है। कृपया बाद में प्रयास करें या हमसे संपर्क करें।" },
  openFull: { en: "Open full screen", hi: "पूरी स्क्रीन में खोलें" },
  toolCredit: { en: "This tool is provided by AstroSage; all rights belong to them.", hi: "यह टूल AstroSage द्वारा संचालित है; सभी अधिकार उनके पास सुरक्षित हैं।" },
  requestKundli: { en: "Ask for a Kundli", hi: "कुंडली का अनुरोध" },
  requestMatching: { en: "Ask for Kundli matching", hi: "कुंडली मिलान का अनुरोध" },
  requestPrashna: { en: "Prashna Kundli", hi: "प्रश्न कुंडली" },
  requestNote: { en: "Send your details and the Kendra's team will examine them and get back to you.", hi: "अपना विवरण भेजें; केंद्र की टीम उसे देखकर आपसे संपर्क करेगी।" },
  boy: { en: "Groom's details", hi: "वर का विवरण" },
  girl: { en: "Bride's details", hi: "कन्या का विवरण" },
  yourQuestion: { en: "Your question", hi: "आपका प्रश्न" },
  placeOfQuery: { en: "Place where you are asking", hi: "प्रश्न पूछने का स्थान" },
  topic: { en: "Topic", hi: "विषय" },
  sendRequest: { en: "Send request", hi: "अनुरोध भेजें" },
  requestSent: { en: "Request received", hi: "अनुरोध मिल गया" },
  requestSentNote: { en: "The Kendra's team will examine it and contact you.", hi: "केंद्र की टीम इसे देखकर आपसे संपर्क करेगी।" },
  requestGuestNote: { en: "Sign in to follow this request under Orders.", hi: "इस अनुरोध की प्रगति देखने के लिए लॉगिन करें।" },
  CAREER: { en: "Career", hi: "करियर" },
  MARRIAGE: { en: "Marriage", hi: "विवाह" },
  HEALTH: { en: "Health", hi: "स्वास्थ्य" },
  LEGAL: { en: "Legal", hi: "कानूनी" },
  FINANCE: { en: "Finance", hi: "धन" },
  PROPERTY: { en: "Property", hi: "संपत्ति" },
  GENERAL: { en: "General", hi: "सामान्य" },
} as const;

const TICKET_STATUS = {
  OPEN: { en: "Open", hi: "खुला" },
  IN_PROGRESS: { en: "In progress", hi: "प्रक्रिया में" },
  RESOLVED: { en: "Resolved", hi: "हल हुआ" },
} as const;
const COMMISSION_STATUS = {
  PENDING: { en: "Pending", hi: "लंबित" },
  EARNED: { en: "Earned", hi: "अर्जित" },
  PAID: { en: "Paid", hi: "भुगतान हुआ" },
  CANCELLED: { en: "Cancelled", hi: "रद्द" },
} as const;
const PAYOUT_STATUS = {
  REQUESTED: { en: "Requested", hi: "अनुरोधित" },
  PAID: { en: "Paid", hi: "भुगतान हुआ" },
  REJECTED: { en: "Rejected", hi: "अस्वीकृत" },
} as const;

const lookup = (map: Record<string, { en: string; hi: string }>, lang: "hi" | "en", key: string) => map[key]?.[lang] ?? key;
export const ticketStatusLabel = (lang: "hi" | "en", s: string) => lookup(TICKET_STATUS, lang, s);
export const commissionStatusLabel = (lang: "hi" | "en", s: string) => lookup(COMMISSION_STATUS, lang, s);
export const payoutStatusLabel = (lang: "hi" | "en", s: string) => lookup(PAYOUT_STATUS, lang, s);

/** Words for the order and payment states the server sends. */
const ORDER_STATUS = {
  ORDER_RECEIVED: { en: "Order received", hi: "ऑर्डर प्राप्त" },
  KUNDLI_IN_PROGRESS: { en: "Being prepared", hi: "तैयार हो रहा है" },
  KUNDLI_COMPLETE: { en: "Ready", hi: "तैयार" },
  DISPATCHED: { en: "Dispatched", hi: "भेजा गया" },
  DELIVERED: { en: "Delivered", hi: "वितरित" },
  EXECUTION_COMPLETE: { en: "Completed", hi: "पूर्ण" },
} as const;
const PAYMENT_STATUS = {
  PENDING: { en: "Payment pending", hi: "भुगतान बाकी" },
  AWAITING_VERIFICATION: { en: "Payment being verified", hi: "भुगतान की जाँच हो रही है" },
  PAID: { en: "Paid", hi: "भुगतान हो गया" },
  FAILED: { en: "Payment failed", hi: "भुगतान विफल" },
  REFUNDED: { en: "Refunded", hi: "धनवापसी हुई" },
} as const;

export function orderStatusLabel(lang: Lang, status: string): string {
  return (ORDER_STATUS as Record<string, { en: string; hi: string }>)[status]?.[lang] ?? status;
}
export function paymentStatusLabel(lang: Lang, status: string): string {
  return (PAYMENT_STATUS as Record<string, { en: string; hi: string }>)[status]?.[lang] ?? status;
}

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
  setApiLanguage(lang);

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
