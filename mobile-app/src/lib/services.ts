import { useCallback, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { ApiError } from "./api";
import type { Link } from "./content";
import { useSession } from "./session";

/** One service and one "other service" card as the server sends them: every text comes in English and Hindi. */

export interface ItineraryDay {
  titleEn: string;
  titleHi: string;
  detailsEn: string;
  detailsHi: string;
}

export interface Demo {
  kind: "link" | "image" | "video" | "social";
  labelEn: string;
  labelHi: string;
  url: string;
}

export interface ServicePlanDetail {
  id: string;
  packageId: string | null;
  slug: string;
  titleEn: string;
  titleHi: string;
  descriptionEn: string;
  descriptionHi: string;
  pricePaise: number;
  originalPricePaise: number | null;
  deliveryDays: number | null;
  pages: number | null;
  hasCall: boolean;
  callDurationMinutes: number | null;
  featuresEn: string[];
  featuresHi: string[];
  programEn: string;
  programHi: string;
  preparationEn: string;
  preparationHi: string;
  samagriEn: string;
  samagriHi: string;
  isPopular: boolean;
  imageUrl: string | null;
}

export interface ServicePackageDetail {
  id: string;
  titleEn: string;
  titleHi: string;
  descriptionEn: string;
  descriptionHi: string;
  numberOfDays: number | null;
  startDate: string | null;
  endDate: string | null;
  days: ItineraryDay[];
  inclusionsEn: string[];
  inclusionsHi: string[];
  exclusionsEn: string[];
  exclusionsHi: string[];
  materialsEn: string[];
  materialsHi: string[];
  imageUrl: string | null;
  youtubeUrl: string | null;
  availability: { status: string; reason?: string | null; seatsLeft?: number | null };
}

export interface ServiceDetail {
  slug: string;
  titleEn: string;
  titleHi: string;
  taglineEn: string | null;
  taglineHi: string | null;
  descriptionEn: string;
  descriptionHi: string;
  highlightsEn: string[];
  highlightsHi: string[];
  notesEn: string;
  notesHi: string;
  itineraryEn: string;
  itineraryHi: string;
  samagriEn: string;
  samagriHi: string;
  imageUrl: string | null;
  youtubeUrl: string | null;
  links: Link[];
  demos: Demo[];
  packages: ServicePackageDetail[];
  plans: ServicePlanDetail[];
}

export interface OtherServiceDetail {
  slug: string;
  titleEn: string;
  titleHi: string;
  taglineEn: string | null;
  taglineHi: string | null;
  descriptionEn: string;
  descriptionHi: string;
  natureEn: string | null;
  natureHi: string | null;
  imageUrl: string | null;
  numberOfDays: number | null;
  startDate: string | null;
  endDate: string | null;
  days: ItineraryDay[];
  actionUrl: string | null;
  actionTextEn: string | null;
  actionTextHi: string | null;
  serviceSlug: string | null;
  facebookUrl: string | null;
  whatsappGroupUrl: string | null;
  youtubeUrl: string | null;
  links: Link[];
  demos: Demo[];
}

/** Loads one page from the server (no sign-in needed); `reload` fetches it again. */
export function useServerPage<T>(path: string) {
  const { api } = useSession();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setError("");
    try {
      setData(await api.request<T>(path, { auth: false }));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    }
  }, [api, path]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, error, reload, loading: data === null && !error };
}

/** The list of lines of a plan or package in the chosen language, falling back to the other language when one is empty. */
export function pickList(lang: "hi" | "en", en: string[] | undefined, hi: string[] | undefined): string[] {
  const a = lang === "hi" ? hi : en;
  const b = lang === "hi" ? en : hi;
  return a && a.length > 0 ? a : (b ?? []);
}

/** "3 days", or the dates, for a package or an other-service card. */
export function dateRange(start: string | null, end: string | null): string | null {
  if (!start) return null;
  return end && end !== start ? `${start} → ${end}` : start;
}

/** The address of a service's page on the website, for sharing. */
export function serviceShareUrl(base: string, slug: string, lang: "hi" | "en"): string {
  return `${base.replace(/\/+$/, "")}/${lang}/services/${encodeURIComponent(slug)}`;
}

/* ---------- Saved services (kept on this phone only) ---------- */

const SAVED_KEY = "saved-services";

/** The saved list as read from the phone: only text entries, no repeats. */
export function parseSaved(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? Array.from(new Set(v.filter((x): x is string => typeof x === "string" && x.length > 0 && x.length < 120))) : [];
  } catch {
    return [];
  }
}

/** Adds the service to the saved list, or takes it out when it is already there. */
export function toggleSaved(list: string[], slug: string): string[] {
  return list.includes(slug) ? list.filter((x) => x !== slug) : [...list, slug];
}

let cache: string[] | null = null;
const listeners = new Set<(v: string[]) => void>();

async function loadSaved(): Promise<string[]> {
  if (cache) return cache;
  try {
    cache = parseSaved(await SecureStore.getItemAsync(SAVED_KEY));
  } catch {
    cache = [];
  }
  return cache;
}

/** The services this person has marked with a heart. Every screen that uses it stays in step. */
export function useSaved() {
  const [saved, setSaved] = useState<string[]>(cache ?? []);

  useEffect(() => {
    listeners.add(setSaved);
    loadSaved().then(setSaved);
    return () => {
      listeners.delete(setSaved);
    };
  }, []);

  const toggle = useCallback(async (slug: string) => {
    const next = toggleSaved(await loadSaved(), slug);
    cache = next;
    listeners.forEach((l) => l(next));
    SecureStore.setItemAsync(SAVED_KEY, JSON.stringify(next)).catch(() => undefined);
  }, []);

  return { saved, toggle, isSaved: (slug: string) => saved.includes(slug) };
}
