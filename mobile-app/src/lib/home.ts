import { useCallback, useEffect, useState } from "react";
import { ApiError } from "./api";
import { useSession } from "./session";
import type { Lang } from "./i18n";

/** The Home screen's content, read from the website's settings (the admin changes both at once). */

type Values = Record<string, string | boolean | number | null>;

export interface HomeSlide {
  id: string;
  imageUrl: string | null;
  titleEn: string;
  titleHi: string;
  descEn: string;
  descHi: string;
  youtubeUrl: string | null;
  serviceSlug: string | null;
  titleColor: string | null;
}
export interface HomeContent {
  app: Values;
  hero: Values;
  cards: Values;
  servicesCfg: Values;
  process: Values;
  contactCfg: Values;
  extras: Values;
  sections: Values;
  slides: HomeSlide[];
  notices: { id: string; textEn: string; textHi: string }[];
  offers: {
    id: string;
    code: string;
    titleEn: string;
    titleHi: string;
    discountType: "FLAT" | "PERCENTAGE";
    discountValuePaise: number;
    maxDiscountPaise: number | null;
    autoApply: boolean;
  }[];
  otherServices: { slug: string; titleEn: string; titleHi: string; descEn: string; descHi: string; imageUrl: string | null; actionUrl: string | null }[];
  testimonials: { id: string; authorNameEn: string; authorNameHi: string; cityEn: string; cityHi: string; quoteEn: string; quoteHi: string; rating: number; photoUrl: string | null }[];
  posts: { slug: string; titleEn: string; titleHi: string; excerptEn: string | null; excerptHi: string | null; coverImage: string | null }[];
  faqs: { id: string; questionEn: string; questionHi: string; answerEn: string; answerHi: string }[];
  gallery: { id: string; titleEn: string; titleHi: string; imageUrl: string | null }[];
  contact: { phone: string; phone2: string | null; email: string | null; whatsapp: string };
}

/** A switch from the admin panel; blocks are on unless the admin turned them off. */
export function isOn(values: Values | undefined, key: string, fallback = true): boolean {
  const v = values?.[key];
  return typeof v === "boolean" ? v : fallback;
}

/** A text the admin typed in the chosen language, or the app's own wording when the box is empty. */
export function pickText(values: Values | undefined, base: string, lang: Lang, fallback: string): string {
  const own = values?.[`${base}${lang === "hi" ? "Hi" : "En"}`];
  if (typeof own === "string" && own.trim()) return own.trim();
  // The other language beats nothing at all, but only when this language has its own default
  return fallback;
}

/** "1.2.10" against "1.2.9": negative when a is older than b. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map((n) => parseInt(n, 10) || 0);
  const pb = b.split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d < 0 ? -1 : 1;
  }
  return 0;
}

export function useHome() {
  const { api } = useSession();
  const [data, setData] = useState<HomeContent | null>(null);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setError("");
    try {
      setData(await api.request<HomeContent>("/api/mobile/v1/home", { auth: false }));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    }
  }, [api]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, error, reload, loading: data === null && !error };
}
