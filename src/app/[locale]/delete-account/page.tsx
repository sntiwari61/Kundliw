import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { Role } from "@prisma/client";
import { Link } from "@/i18n/routing";
import { BackBar } from "@/components/layout/BackBar";
import { getCurrentUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { DeleteAccountForm } from "@/features/account/DeleteAccountForm";
import { kendraEmail } from "@/lib/content/contact";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { locale } = await props.params;
  return {
    title: locale === "hi" ? "खाता हटाएँ" : "Delete your account",
    robots: { index: true, follow: true },
  };
}

/** Public page for "how do I delete my account and data" (the address Google Play asks for), with the form for signed-in people. */
export default async function DeleteAccountPage(props: Props) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const isHindi = locale === "hi";
  const t = (en: string, hi: string) => (isHindi ? hi : en);

  const user = await getCurrentUser();
  const hasPassword = user
    ? Boolean((await prisma.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } }))?.passwordHash)
    : false;
  const email = kendraEmail(
    (await prisma.adminSettings.findUnique({ where: { id: "default" }, select: { email: true } }).catch(() => null))?.email,
  );

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-10 text-left sm:px-6">
      <BackBar fallbackHref="/" backLabel={isHindi ? "वापस जाएँ" : "Back"} />
      <header className="space-y-2">
        <h1 className="font-serif text-3xl font-bold text-secondary">{t("Delete your account", "अपना खाता हटाएँ")}</h1>
        <p className="text-sm text-on-surface-variant">Maharshi Kanad Jyotish Kendra</p>
      </header>

      <section className="space-y-3 rounded-lg border border-outline-variant/50 bg-surface p-5 text-sm leading-relaxed text-on-surface">
        <p>
          {t(
            "You can delete your account and personal data from the website or the mobile app at any time.",
            "आप वेबसाइट या मोबाइल ऐप से कभी भी अपना खाता और व्यक्तिगत डेटा हटा सकते हैं।",
          )}
        </p>
        <p className="font-bold">{t("What is deleted", "क्या हटाया जाता है")}</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>{t("Your name, e-mail, mobile number, password and sign-in links (Google, Facebook)", "आपका नाम, ईमेल, मोबाइल नंबर, पासवर्ड और लॉगिन लिंक (Google, Facebook)")}</li>
          <li>{t("The files in your Vault", "आपके वॉल्ट की फ़ाइलें")}</li>
          <li>{t("The contact details on your support tickets", "आपके सहायता टिकटों पर संपर्क विवरण")}</li>
          <li>{t("For Associates: payout details (UPI, bank account)", "एसोसिएट के लिए: भुगतान विवरण (UPI, बैंक खाता)")}</li>
        </ul>
        <p className="font-bold">{t("What is kept", "क्या रखा जाता है")}</p>
        <p>
          {t(
            "Orders, GST invoices and commission records are kept because tax and accounting law requires it. They no longer point to a named person.",
            "ऑर्डर, GST इनवॉइस और कमीशन के अभिलेख कर तथा लेखा कानून के कारण रखे जाते हैं। वे अब किसी नामित व्यक्ति से नहीं जुड़े रहते।",
          )}
        </p>
        <p>
          {t(
            "If you have a paid order still in progress, or an Associate commission not yet paid out, please finish or settle it first.",
            "यदि आपका भुगतान किया ऑर्डर अभी चल रहा है, या एसोसिएट कमीशन का भुगतान बाकी है, तो पहले उसे पूरा या निपटा लें।",
          )}
        </p>
      </section>

      {user ? (
        user.role === Role.ADMIN ? (
          <p className="text-sm">{t("Administrator accounts are closed by another administrator.", "एडमिन खाता दूसरा एडमिन बंद करता है।")}</p>
        ) : (
          <DeleteAccountForm hasPassword={hasPassword} />
        )
      ) : (
        <section className="space-y-2 rounded-lg border border-outline-variant/50 bg-surface p-5 text-sm">
          <p>{t("Sign in to delete your account.", "खाता हटाने के लिए लॉगिन करें।")}</p>
          <Link href="/auth/signin" className="inline-flex min-h-[44px] items-center rounded border border-maroon px-4 font-bold text-primary">
            {t("Sign in", "लॉग इन")}
          </Link>
        </section>
      )}

      <p className="text-sm text-on-surface-variant">
        {t("Cannot sign in? Write to us from your registered e-mail or phone number:", "लॉगिन नहीं हो पा रहा? अपने पंजीकृत ईमेल या फ़ोन नंबर से हमें लिखें:")}{" "}
        <a href={`mailto:${email}`} className="font-semibold text-secondary hover:underline">
          {email}
        </a>
      </p>
    </div>
  );
}
