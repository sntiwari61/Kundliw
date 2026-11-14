import { useCallback, useEffect, useState } from "react";
import { ApiError } from "./api";
import { useSession } from "./session";
import { parseDate, parseTime } from "./booking";
import { isValidPhone } from "./validation";

/** The Panchang, Kundli and Matching tools (settings from the website's admin panel) and the three free request forms. */

export type ToolKey = "panchang" | "kundli" | "matching";
export interface ToolInfo {
  enabled: boolean;
  urlEn: string;
  urlHi: string;
}
export interface ToolsContent {
  panchang: ToolInfo;
  kundli: ToolInfo;
  matching: ToolInfo;
  noteEn: string;
  noteHi: string;
}

export function useTools() {
  const { api } = useSession();
  const [data, setData] = useState<ToolsContent | null>(null);
  const [error, setError] = useState("");
  const reload = useCallback(async () => {
    setError("");
    try {
      setData(await api.request<ToolsContent>("/api/mobile/v1/tools", { auth: false }));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    }
  }, [api]);
  useEffect(() => {
    reload();
  }, [reload]);
  return { data, error, reload, loading: data === null && !error };
}

export type Gender = "MALE" | "FEMALE" | "OTHER";
export interface BirthForm {
  name: string;
  gender: Gender | "";
  dob: string;
  tob: string;
  pob: string;
}
export const emptyBirth = (gender: Gender | "" = "MALE"): BirthForm => ({ name: "", gender, dob: "", tob: "", pob: "" });

/** The text keys of the problems found in a set of birth details (empty when all is well). */
export function validateBirth(f: BirthForm): Partial<Record<keyof BirthForm, string>> {
  const e: Partial<Record<keyof BirthForm, string>> = {};
  if (f.name.trim().length < 2) e.name = "errName";
  if (!parseDate(f.dob)) e.dob = "errDob";
  if (!parseTime(f.tob)) e.tob = "errTob";
  if (f.pob.trim().length < 2) e.pob = "errPlace";
  return e;
}

export function birthPayload(f: BirthForm) {
  return { name: f.name.trim(), ...(f.gender ? { gender: f.gender } : {}), dob: parseDate(f.dob) as string, tob: parseTime(f.tob) as string, pob: f.pob.trim() };
}

export const PRASHNA_CATEGORIES = ["CAREER", "MARRIAGE", "HEALTH", "LEGAL", "FINANCE", "PROPERTY", "GENERAL"] as const;
export type PrashnaCategory = (typeof PRASHNA_CATEGORIES)[number];

export interface PrashnaForm {
  name: string;
  phone: string;
  email: string;
  category: PrashnaCategory;
  questionText: string;
  placeOfQuery: string;
}

export function validatePrashna(f: PrashnaForm): Partial<Record<keyof PrashnaForm, string>> {
  const e: Partial<Record<keyof PrashnaForm, string>> = {};
  if (f.name.trim().length < 2) e.name = "errName";
  if (!isValidPhone(f.phone)) e.phone = "errPhone";
  if (f.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = "errEmailAddr";
  if (f.questionText.trim().length < 5) e.questionText = "errQuestion";
  if (f.placeOfQuery.trim().length < 2) e.placeOfQuery = "errPlace";
  return e;
}

/** The moment of the question, as the website records it (local time, to the minute). */
export function queryTimestamp(now = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}T${p(now.getHours())}:${p(now.getMinutes())}`;
}

export function prashnaPayload(f: PrashnaForm, now = new Date()) {
  return {
    name: f.name.trim(),
    phone: f.phone.trim(),
    ...(f.email.trim() ? { email: f.email.trim() } : {}),
    category: f.category,
    questionText: f.questionText.trim(),
    queryTimestamp: queryTimestamp(now),
    placeOfQuery: f.placeOfQuery.trim(),
  };
}
