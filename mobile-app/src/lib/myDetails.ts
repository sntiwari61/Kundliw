import { useCallback, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { parseDate, parseTime, type Gender } from "./booking";

/**
 * The person's own birth details, kept on this phone only (never sent anywhere until they book or
 * ask for something), so the booking and request forms can be filled in with one tap.
 */
export interface MyDetails {
  name: string;
  gender: Gender;
  /** DD-MM-YYYY as typed */
  dob: string;
  /** HH:MM (24 hours) as typed; empty when the time is not known */
  tob: string;
  timeUnknown: boolean;
  pob: string;
}

export const EMPTY_DETAILS: MyDetails = { name: "", gender: "MALE", dob: "", tob: "", timeUnknown: false, pob: "" };

export type DetailsErrorKey = "errName" | "errDob" | "errTob" | "errPob";

/** What is wrong with the details, as the keys of the app's own messages; an empty object means they can be saved. */
export function validateDetails(d: MyDetails): Partial<Record<keyof MyDetails, DetailsErrorKey>> {
  const e: Partial<Record<keyof MyDetails, DetailsErrorKey>> = {};
  if (d.name.trim().length < 2) e.name = "errName";
  if (!parseDate(d.dob)) e.dob = "errDob";
  if (!d.timeUnknown && !parseTime(d.tob)) e.tob = "errTob";
  if (d.pob.trim().length < 2) e.pob = "errPob";
  return e;
}

/** The saved details as read from the phone; anything unreadable gives nothing. */
export function parseDetails(raw: string | null | undefined): MyDetails | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<MyDetails> | null;
    if (!v || typeof v !== "object") return null;
    const text = (x: unknown, max: number) => (typeof x === "string" ? x.slice(0, max) : "");
    const gender: Gender = v.gender === "FEMALE" || v.gender === "OTHER" ? v.gender : "MALE";
    const d: MyDetails = { name: text(v.name, 100), gender, dob: text(v.dob, 10), tob: text(v.tob, 5), timeUnknown: v.timeUnknown === true, pob: text(v.pob, 120) };
    return d.name || d.dob || d.pob ? d : null;
  } catch {
    return null;
  }
}

const KEY = "my-details";
let cache: MyDetails | null | undefined;
const listeners = new Set<(v: MyDetails | null) => void>();

async function load(): Promise<MyDetails | null> {
  if (cache !== undefined) return cache;
  try {
    cache = parseDetails(await SecureStore.getItemAsync(KEY));
  } catch {
    cache = null;
  }
  return cache;
}

/** The saved details; `save` and `clear` keep every screen that uses them in step. */
export function useMyDetails() {
  const [details, setDetails] = useState<MyDetails | null>(cache ?? null);
  const [loaded, setLoaded] = useState(cache !== undefined);

  useEffect(() => {
    listeners.add(setDetails);
    load().then((v) => {
      setDetails(v);
      setLoaded(true);
    });
    return () => {
      listeners.delete(setDetails);
    };
  }, []);

  const save = useCallback(async (next: MyDetails) => {
    cache = next;
    listeners.forEach((l) => l(next));
    await SecureStore.setItemAsync(KEY, JSON.stringify(next));
  }, []);

  const clear = useCallback(async () => {
    cache = null;
    listeners.forEach((l) => l(null));
    await SecureStore.deleteItemAsync(KEY).catch(() => undefined);
  }, []);

  return { details, loaded, save, clear };
}
