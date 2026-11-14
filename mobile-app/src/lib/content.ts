import { useCallback, useEffect, useState } from "react";
import { ApiError } from "./api";
import { API_URL } from "./config";
import { useSession } from "./session";

/** The public pages of the website as the server sends them (every text comes in English and Hindi). */

export interface Link {
  labelEn: string;
  labelHi: string;
  url: string;
}
export interface Block {
  id: string;
  type: "text" | "image" | "youtube" | "link";
  textEn: string;
  textHi: string;
  url: string | null;
  labelEn: string;
  labelHi: string;
}
export interface AboutContent {
  titleEn: string;
  titleHi: string;
  shortEn: string;
  shortHi: string;
  missionEn: string;
  missionHi: string;
  blocks: Block[];
}
export interface FounderContent {
  founder: {
    nameEn: string;
    nameHi: string;
    designationEn: string;
    designationHi: string;
    roleEn: string;
    roleHi: string;
    photoUrl: string | null;
    bioEn: string;
    bioHi: string;
    youtubeUrl: string | null;
    footerNoteEn: string | null;
    footerNoteHi: string | null;
    links: Link[];
    blocks: Block[];
  } | null;
  team: { id: string; nameEn: string; nameHi: string; roleEn: string; roleHi: string; bioEn: string | null; bioHi: string | null; photoUrl: string | null }[];
}
export interface FaqContent {
  items: { id: string; category: string; questionEn: string; questionHi: string; answerEn: string; answerHi: string }[];
}
export interface GalleryContent {
  items: {
    id: string;
    titleEn: string;
    titleHi: string;
    captionEn: string | null;
    captionHi: string | null;
    imageUrl: string | null;
    videoUrl: string | null;
    mediaType: string;
    externalLink: string | null;
  }[];
}
export interface BlogListContent {
  posts: { slug: string; titleEn: string; titleHi: string; excerptEn: string | null; excerptHi: string | null; coverImage: string | null; publishedAt: string | null }[];
}
export interface BlogPostContent {
  slug: string;
  titleEn: string;
  titleHi: string;
  contentEn: string;
  contentHi: string;
  coverImage: string | null;
  youtubeUrl: string | null;
  links: Link[];
  publishedAt: string | null;
}
export interface TestimonialsContent {
  items: {
    id: string;
    authorNameEn: string;
    authorNameHi: string;
    authorTitleEn: string;
    authorTitleHi: string;
    cityEn: string;
    cityHi: string;
    quoteEn: string;
    quoteHi: string;
    rating: number;
    photoUrl: string | null;
    youtubeUrl: string | null;
  }[];
}
export interface OffersContent {
  offers: {
    id: string;
    code: string;
    titleEn: string;
    titleHi: string;
    discountType: "FLAT" | "PERCENTAGE";
    discountValuePaise: number;
    maxDiscountPaise: number | null;
    minOrderValuePaise: number;
    autoApply: boolean;
    validUntil: string | null;
  }[];
}
export interface ContactContent {
  siteNameEn: string | null;
  siteNameHi: string | null;
  phone1: string | null;
  phone2: string | null;
  email: string | null;
  addressEn: string | null;
  addressHi: string | null;
  city: string | null;
  map: { lat: number; lng: number; labelEn: string | null; labelHi: string | null } | null;
  workingHoursEn: string;
  workingHoursHi: string;
  noteEn: string;
  noteHi: string;
  social: { id: string; name: string; url: string }[];
}

/** Pictures saved on the website start with "/"; the app adds the website address in front. */
export function imageUri(src: string | null | undefined): string | undefined {
  if (!src) return undefined;
  return src.startsWith("/") ? `${API_URL}${src}` : src;
}

/** Only web, phone and mail addresses are opened from the app. */
export function safeExternal(url: string | null | undefined): string | null {
  if (!url) return null;
  const v = url.trim();
  if (/^https?:\/\/[^\s]+$/i.test(v) || /^mailto:[^\s@]+@[^\s@]+$/i.test(v) || /^tel:\+?[\d\s-]{5,20}$/i.test(v)) return v;
  if (/^\/(?!\/)[^\s]*$/.test(v)) return `${API_URL}${v}`;
  return null;
}

export type RichPart = { type: "text" | "bold"; text: string } | { type: "link"; text: string; href: string };

/** Splits one line of the website's simple markup (**bold** and [words](address)) into pieces. */
export function parseInline(line: string): RichPart[] {
  const parts: RichPart[] = [];
  const re = /\[([^\]\n]{1,200})\]\(([^)\s]{1,600})\)|\*\*([^*\n]{1,300})\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    if (m.index > last) parts.push({ type: "text", text: line.slice(last, m.index) });
    if (m[3] !== undefined) {
      parts.push({ type: "bold", text: m[3] });
    } else {
      const href = safeExternal(m[2]);
      if (href) parts.push({ type: "link", text: m[1], href });
      else parts.push({ type: "text", text: m[0] });
    }
    last = m.index + m[0].length;
  }
  if (last < line.length) parts.push({ type: "text", text: line.slice(last) });
  return parts;
}

/** Paragraphs are separated by a blank line. */
export function paragraphs(text: string): string[] {
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** The discount of an offer in words, for example "₹500 off" or "25% off (up to ₹1,000)". */
export function offerValue(o: OffersContent["offers"][number], money: (paise: number) => string, off: string, upTo: string): string {
  if (o.discountType === "PERCENTAGE") {
    const cap = o.maxDiscountPaise ? ` (${upTo} ${money(o.maxDiscountPaise)})` : "";
    return `${o.discountValuePaise}% ${off}${cap}`;
  }
  return `${money(o.discountValuePaise)} ${off}`;
}

/** Loads one public page of the website; `reload` fetches it again. */
export function useContent<T>(path: string) {
  const { api } = useSession();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setError("");
    try {
      setData(await api.request<T>(`/api/mobile/v1/content/${path}`, { auth: false }));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    }
  }, [api, path]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, error, reload, loading: data === null && !error };
}

/** An excerpt without the simple markup, for a short preview. */
export function plainText(text: string | null | undefined): string {
  return (text || "").replace(/\*\*/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").trim();
}
