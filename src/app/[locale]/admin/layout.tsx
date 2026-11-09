import { ReactNode } from "react";
import { Link } from "@/i18n/routing";
import { requireAdmin } from "@/lib/auth/guards";
import { SignOutButton } from "@/components/ui/SignOutButton";
import { ShieldAlert, ExternalLink } from "lucide-react";
import { AdminIdleLogout } from "@/components/layout/AdminIdleLogout";
import { AdminNav } from "@/components/layout/AdminNav";
import { AdminPageHelp } from "@/components/admin/AdminPageHelp";
import { PAGE_DEMOS_KEY } from "@/lib/admin/pageHelp";
import { prisma } from "@/lib/prisma";

interface AdminLayoutProps {
  children: ReactNode;
  params: Promise<{
    locale: string;
  }>;
}

export default async function AdminLayout(props: AdminLayoutProps) {
  const params = await props.params;

  const {
    locale
  } = params;

  const {
    children
  } = props;

  // Enforce server-side DB-verified admin check
  const admin = await requireAdmin(`/admin/services`, locale);
  const isHindi = locale === "hi";
  const demoRow = await prisma.siteConfig.findUnique({ where: { key: PAGE_DEMOS_KEY } }).catch(() => null);
  const demos: Record<string, string> =
    demoRow && typeof demoRow.value === "object" && demoRow.value && !Array.isArray(demoRow.value) ? (demoRow.value as Record<string, string>) : {};

  return (
    <div className="w-full min-h-[calc(100vh-120px)] bg-surface text-on-surface text-left">
      {/* Admin Command Bar */}
      <div className="w-full bg-maroon-deep text-on-maroon border-b border-gold/30 py-3 px-4 sm:px-6">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
          <div className="flex items-center gap-3">
            <span className="px-2 py-1 rounded bg-gold text-on-gold font-bold text-xs uppercase tracking-widest flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>CMS Admin</span>
            </span>
            <span className="font-serif font-bold text-sm sm:text-base">
              {isHindi
                ? "महर्षि कणाद ज्योतिष केंद्र • प्रबंधन नियंत्रण कक्ष"
                : "Maharshi Kanad Jyotish Kendra • Master Control"}
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 text-xs font-mono">
            <span className="hidden md:inline">
              {isHindi ? "प्रशासक:" : "Admin:"} {admin.email || admin.phone || admin.name}
            </span>
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-gold hover:underline"
            >
              <span>{isHindi ? "सार्वजनिक पोर्टल" : "Public Site"}</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
            <SignOutButton label={isHindi ? "लॉग आउट" : "Log out"} className="!min-h-[40px] !px-4 !text-sm !font-bold !bg-white !text-maroon !border-white hover:!bg-gold hover:!text-on-gold shadow-md" />
          </div>
        </div>
      </div>

      {/* Menu + content */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 flex flex-col lg:flex-row gap-6 items-start">
        <AdminIdleLogout />
        <AdminNav isHindi={isHindi} />
        <main className="flex-1 min-w-0 w-full text-left">
          <AdminPageHelp isHindi={isHindi} demos={demos} />
          {children}
        </main>
      </div>
    </div>
  );
}

// Reads the visitor (session or address details), so this page is built fresh for every visit
export const dynamic = "force-dynamic";
