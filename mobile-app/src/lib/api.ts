import type { TokenStore, Tokens } from "./tokenStore";

/** An answer from the server that is not a success. `message` is safe to show to the person. */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export interface ApiUser {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: "USER" | "ASSOCIATE" | "ADMIN";
  associateStatus?: string | null;
}

export interface SignInResult extends Tokens {
  user: ApiUser;
}

export type Portal = "user" | "associate";

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** JSON by default; pass a FormData to upload a file */
  body?: unknown;
  /** a longer time allowance for uploads */
  timeoutMs?: number;
  /** false for sign-in and other calls made before the person is signed in */
  auth?: boolean;
}

export interface ApiClientOptions {
  baseUrl: string;
  store: TokenStore;
  fetchImpl?: typeof fetch;
  /** Called when the server no longer accepts the saved sign-in, so the app can show the sign-in screen. */
  onSignedOut?: () => void;
  timeoutMs?: number;
}

let apiLanguage: "hi" | "en" = "hi";
/** The screen language, so messages the server does not supply are shown in it */
export function setApiLanguage(lang: "hi" | "en") {
  apiLanguage = lang;
}

const MESSAGES = {
  network: {
    en: "Could not reach the server. Please check your internet connection.",
    hi: "सर्वर से संपर्क नहीं हो पाया। कृपया अपना इंटरनेट जाँचें।",
  },
  unavailable: {
    en: "This feature is not available right now. Please try again later or update the app.",
    hi: "यह सुविधा अभी उपलब्ध नहीं है। कृपया बाद में प्रयास करें या ऐप अपडेट करें।",
  },
  server: {
    en: "The server had a problem. Please try again in a little while.",
    hi: "सर्वर में समस्या आई। कृपया थोड़ी देर बाद फिर प्रयास करें।",
  },
  generic: {
    en: "Something went wrong. Please try again.",
    hi: "कुछ गड़बड़ हो गई। कृपया फिर प्रयास करें।",
  },
} as const;

function fallbackMessage(status: number): string {
  const kind = status === 404 ? "unavailable" : status >= 500 ? "server" : "generic";
  return MESSAGES[kind][apiLanguage];
}

/**
 * The one place the app talks to the server. It adds the access token, and when the server answers
 * 401 it swaps the refresh token for a new pair once (several calls at the same moment share that
 * one refresh) and repeats the call. If the refresh is refused, the saved sign-in is removed.
 */
export function createApiClient(opts: ApiClientOptions) {
  const doFetch = opts.fetchImpl ?? fetch;
  const timeoutMs = opts.timeoutMs ?? 20000;
  let tokens: Tokens | null = null;
  let loaded = false;
  let refreshing: Promise<boolean> | null = null;

  async function ensureLoaded() {
    if (!loaded) {
      tokens = await opts.store.load();
      loaded = true;
    }
  }

  async function raw(path: string, o: RequestOptions, accessToken: string | null): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), o.timeoutMs ?? timeoutMs);
    const isForm = typeof FormData !== "undefined" && o.body instanceof FormData;
    try {
      return await doFetch(`${opts.baseUrl}${path}`, {
        method: o.method ?? "GET",
        headers: {
          Accept: "application/json",
          ...(o.body !== undefined && !isForm ? { "Content-Type": "application/json" } : {}),
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: o.body === undefined ? undefined : isForm ? (o.body as FormData) : JSON.stringify(o.body),
        signal: controller.signal,
      });
    } catch {
      throw new ApiError(MESSAGES.network[apiLanguage], 0);
    } finally {
      clearTimeout(timer);
    }
  }

  async function parse<T>(res: Response): Promise<T> {
    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    if (!res.ok) {
      let message =
        data && typeof data === "object" && typeof (data as { error?: unknown }).error === "string"
          ? (data as { error: string }).error
          : fallbackMessage(res.status);
      // The website's validation answer lists the faulty fields; show the first reason instead of "Validation failed"
      const details = data && typeof data === "object" ? (data as { details?: unknown }).details : null;
      if (details && typeof details === "object") {
        const first = Object.values(details as Record<string, unknown>).flat().find((v) => typeof v === "string");
        if (typeof first === "string") message = first;
      }
      throw new ApiError(message, res.status);
    }
    return data as T;
  }

  async function setTokens(next: Tokens | null) {
    tokens = next;
    loaded = true;
    if (next) await opts.store.save(next);
    else await opts.store.clear();
  }

  /** true when a new pair of tokens was saved */
  function refresh(): Promise<boolean> {
    if (!refreshing) {
      refreshing = (async () => {
        const current = tokens;
        if (!current) return false;
        let res: Response;
        try {
          res = await raw("/api/mobile/v1/auth/refresh", { method: "POST", body: { refreshToken: current.refreshToken } }, null);
        } catch {
          return false; // no network: keep the saved sign-in and let the call fail
        }
        if (res.status === 401) {
          await setTokens(null);
          opts.onSignedOut?.();
          return false;
        }
        if (!res.ok) return false;
        const data = (await res.json()) as SignInResult;
        await setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
        return true;
      })().finally(() => {
        refreshing = null;
      });
    }
    return refreshing;
  }

  async function request<T>(path: string, o: RequestOptions = {}): Promise<T> {
    const useAuth = o.auth !== false;
    if (!useAuth) return parse<T>(await raw(path, o, null));
    await ensureLoaded();
    let res = await raw(path, o, tokens?.accessToken ?? null);
    if (res.status === 401 && tokens && (await refresh())) {
      res = await raw(path, o, tokens?.accessToken ?? null);
    }
    return parse<T>(res);
  }

  async function signedIn(result: SignInResult): Promise<ApiUser> {
    await setTokens({ accessToken: result.accessToken, refreshToken: result.refreshToken });
    return result.user;
  }

  return {
    request,
    /** true when a sign-in is saved on this phone */
    async hasSession(): Promise<boolean> {
      await ensureLoaded();
      return tokens !== null;
    },
    sendOtp(phone: string) {
      return request<{ success: boolean }>("/api/auth/otp/send", { method: "POST", body: { phone }, auth: false });
    },
    async signInWithOtp(phone: string, otp: string, portal: Portal) {
      return signedIn(await request<SignInResult>("/api/mobile/v1/auth/otp/verify", { method: "POST", body: { phone, otp, portal }, auth: false }));
    },
    async signInWithPassword(identifier: string, password: string, portal: Portal) {
      return signedIn(await request<SignInResult>("/api/mobile/v1/auth/login", { method: "POST", body: { identifier, password, portal }, auth: false }));
    },
    async me() {
      return (await request<{ user: ApiUser }>("/api/mobile/v1/me")).user;
    },
    /** The current access token, for downloads that cannot go through `request`. Call `me()` first to refresh an expired one. */
    async accessToken(): Promise<string | null> {
      await ensureLoaded();
      return tokens?.accessToken ?? null;
    },
    /** Signing out only removes the tokens from this phone. */
    async signOut() {
      await setTokens(null);
    },
    async deleteAccount(password?: string) {
      await request<{ ok: true }>("/api/account/delete", { method: "POST", body: { confirm: "DELETE", password } });
      await setTokens(null);
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
