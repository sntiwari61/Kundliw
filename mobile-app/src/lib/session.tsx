import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ApiError, createApiClient, type ApiClient, type ApiUser, type Portal } from "./api";
import { API_URL } from "./config";
import { secureTokenStore } from "./tokenStore";

interface SessionValue {
  /** null while signed out */
  user: ApiUser | null;
  /** true until the saved sign-in has been checked at start-up */
  isLoading: boolean;
  /** true when a sign-in is saved but the server could not be reached at start-up */
  isOffline: boolean;
  retry: () => void;
  api: ApiClient;
  signInWithOtp: (phone: string, otp: string, portal: Portal) => Promise<void>;
  signInWithPassword: (identifier: string, password: string, portal: Portal) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: (password?: string) => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const signedOutRef = useRef<() => void>(() => undefined);
  signedOutRef.current = () => setUser(null);

  const api = useMemo(
    () => createApiClient({ baseUrl: API_URL, store: secureTokenStore, onSignedOut: () => signedOutRef.current() }),
    [],
  );

  // At start-up: if a sign-in is saved, ask the server who it is
  useEffect(() => {
    let alive = true;
    setIsLoading(true);
    setIsOffline(false);
    (async () => {
      try {
        if (await api.hasSession()) {
          const me = await api.me();
          if (alive) setUser(me);
        }
      } catch (e) {
        // Refused sign-in: start signed out. Anything else (no network, server down): keep the saved sign-in and offer Try again.
        if (e instanceof ApiError && e.status === 401) await api.signOut();
        else if (alive) setIsOffline(true);
      } finally {
        if (alive) setIsLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [api, attempt]);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  const signInWithOtp = useCallback(
    async (phone: string, otp: string, portal: Portal) => setUser(await api.signInWithOtp(phone, otp, portal)),
    [api],
  );
  const signInWithPassword = useCallback(
    async (identifier: string, password: string, portal: Portal) => setUser(await api.signInWithPassword(identifier, password, portal)),
    [api],
  );
  const signOut = useCallback(async () => {
    await api.signOut();
    setUser(null);
  }, [api]);
  const deleteAccount = useCallback(
    async (password?: string) => {
      await api.deleteAccount(password);
      setUser(null);
    },
    [api],
  );

  const value = useMemo<SessionValue>(
    () => ({ user, isLoading, isOffline, retry, api, signInWithOtp, signInWithPassword, signOut, deleteAccount }),
    [user, isLoading, isOffline, retry, api, signInWithOtp, signInWithPassword, signOut, deleteAccount],
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside SessionProvider");
  return value;
}
