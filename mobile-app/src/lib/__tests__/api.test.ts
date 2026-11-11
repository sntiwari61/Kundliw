import { ApiError, createApiClient } from "../api";
import type { TokenStore, Tokens } from "../tokenStore";
import { formatPaise, isValidOtp, isValidPhone } from "../validation";

function memoryStore(initial: Tokens | null = null): TokenStore & { current: Tokens | null } {
  const s = {
    current: initial,
    async load() {
      return s.current;
    },
    async save(t: Tokens) {
      s.current = t;
    },
    async clear() {
      s.current = null;
    },
  };
  return s;
}

const json = (status: number, body: unknown) =>
  ({ ok: status >= 200 && status < 300, status, json: async () => body }) as unknown as Response;

type Call = { url: string; init: RequestInit };

function fakeFetch(handler: (call: Call) => Response | Promise<Response>) {
  const calls: Call[] = [];
  const impl = (async (url: string, init: RequestInit) => {
    const call = { url: String(url), init };
    calls.push(call);
    return handler(call);
  }) as unknown as typeof fetch;
  return { impl, calls };
}

const auth = (c: Call) => (c.init.headers as Record<string, string>).Authorization;
const user = { id: "u1", name: "Aditya", email: null, phone: "+919999900002", role: "USER" as const };

describe("api client", () => {
  it("sends the access token and returns the data", async () => {
    const store = memoryStore({ accessToken: "A1", refreshToken: "R1" });
    const f = fakeFetch(() => json(200, { user }));
    const api = createApiClient({ baseUrl: "https://x.test", store, fetchImpl: f.impl });
    expect(await api.me()).toEqual(user);
    expect(f.calls[0].url).toBe("https://x.test/api/mobile/v1/me");
    expect(auth(f.calls[0])).toBe("Bearer A1");
  });

  it("refreshes once on 401 and repeats the call with the new token", async () => {
    const store = memoryStore({ accessToken: "old", refreshToken: "R1" });
    const f = fakeFetch((c) => {
      if (c.url.endsWith("/auth/refresh")) return json(200, { user, accessToken: "new", refreshToken: "R2" });
      return auth(c) === "Bearer new" ? json(200, { user }) : json(401, { error: "expired" });
    });
    const api = createApiClient({ baseUrl: "https://x.test", store, fetchImpl: f.impl });
    expect(await api.me()).toEqual(user);
    expect(store.current).toEqual({ accessToken: "new", refreshToken: "R2" });
    expect(f.calls.map((c) => c.url.replace("https://x.test", ""))).toEqual(["/api/mobile/v1/me", "/api/mobile/v1/auth/refresh", "/api/mobile/v1/me"]);
    expect(JSON.parse(String(f.calls[1].init.body))).toEqual({ refreshToken: "R1" });
    expect(auth(f.calls[1])).toBeUndefined();
  });

  it("shares one refresh between calls made at the same moment", async () => {
    const store = memoryStore({ accessToken: "old", refreshToken: "R1" });
    let refreshes = 0;
    const f = fakeFetch(async (c) => {
      if (c.url.endsWith("/auth/refresh")) {
        refreshes += 1;
        await new Promise((r) => setTimeout(r, 5));
        return json(200, { user, accessToken: "new", refreshToken: "R2" });
      }
      return auth(c) === "Bearer new" ? json(200, { user }) : json(401, { error: "expired" });
    });
    const api = createApiClient({ baseUrl: "https://x.test", store, fetchImpl: f.impl });
    const results = await Promise.all([api.me(), api.me(), api.me()]);
    expect(results).toHaveLength(3);
    expect(refreshes).toBe(1);
  });

  it("signs out when the refresh token is refused", async () => {
    const store = memoryStore({ accessToken: "old", refreshToken: "bad" });
    const onSignedOut = jest.fn();
    const f = fakeFetch(() => json(401, { error: "Please sign in again." }));
    const api = createApiClient({ baseUrl: "https://x.test", store, fetchImpl: f.impl, onSignedOut });
    await expect(api.me()).rejects.toMatchObject({ status: 401 });
    expect(store.current).toBeNull();
    expect(onSignedOut).toHaveBeenCalledTimes(1);
  });

  it("keeps the saved sign-in when the network is down", async () => {
    const store = memoryStore({ accessToken: "A1", refreshToken: "R1" });
    const f = fakeFetch(() => {
      throw new TypeError("Network request failed");
    });
    const api = createApiClient({ baseUrl: "https://x.test", store, fetchImpl: f.impl });
    await expect(api.me()).rejects.toMatchObject({ status: 0 });
    expect(store.current).toEqual({ accessToken: "A1", refreshToken: "R1" });
  });

  it("shows the server's error message", async () => {
    const f = fakeFetch(() => json(429, { error: "Too many OTP requests for this mobile number." }));
    const api = createApiClient({ baseUrl: "https://x.test", store: memoryStore(), fetchImpl: f.impl });
    const err = await api.sendOtp("9876543210").catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.message).toBe("Too many OTP requests for this mobile number.");
    expect(auth(f.calls[0])).toBeUndefined();
  });

  it("saves the tokens after sign-in and removes them on sign-out and account deletion", async () => {
    const store = memoryStore();
    const f = fakeFetch((c) =>
      c.url.endsWith("/account/delete") ? json(200, { ok: true }) : json(200, { user, accessToken: "A1", refreshToken: "R1" }),
    );
    const api = createApiClient({ baseUrl: "https://x.test", store, fetchImpl: f.impl });
    expect(await api.hasSession()).toBe(false);
    expect(await api.signInWithPassword("a@example.com", "pw", "user")).toEqual(user);
    expect(JSON.parse(String(f.calls[0].init.body))).toEqual({ identifier: "a@example.com", password: "pw", portal: "user" });
    expect(store.current).toEqual({ accessToken: "A1", refreshToken: "R1" });
    await api.signOut();
    expect(store.current).toBeNull();

    await api.signInWithOtp("9876543210", "123456", "associate");
    await api.deleteAccount("pw");
    const del = f.calls[f.calls.length - 1];
    expect(JSON.parse(String(del.init.body))).toEqual({ confirm: "DELETE", password: "pw" });
    expect(auth(del)).toBe("Bearer A1");
    expect(store.current).toBeNull();
  });

  it("does not remove the sign-in when deletion is refused", async () => {
    const store = memoryStore({ accessToken: "A1", refreshToken: "R1" });
    const f = fakeFetch(() => json(409, { error: "You have a paid order that is still in progress." }));
    const api = createApiClient({ baseUrl: "https://x.test", store, fetchImpl: f.impl });
    await expect(api.deleteAccount()).rejects.toMatchObject({ status: 409 });
    expect(store.current).not.toBeNull();
  });
});

describe("validation", () => {
  it("accepts only 10-digit Indian mobile numbers", () => {
    expect(isValidPhone("9876543210")).toBe(true);
    expect(isValidPhone("5876543210")).toBe(false);
    expect(isValidPhone("98765")).toBe(false);
    expect(isValidPhone("98765432101")).toBe(false);
  });
  it("accepts only 6-digit codes", () => {
    expect(isValidOtp("123456")).toBe(true);
    expect(isValidOtp("12345")).toBe(false);
    expect(isValidOtp("12a456")).toBe(false);
  });
  it("formats paise as rupees", () => {
    expect(formatPaise(249900)).toBe("₹2,499");
    expect(formatPaise(265394)).toBe("₹2,653.94");
    expect(formatPaise(99900)).toBe("₹999");
  });
});
