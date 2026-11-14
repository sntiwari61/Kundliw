import { createApiClient } from "../api";
import type { TokenStore, Tokens } from "../tokenStore";

function memoryStore(initial: Tokens | null): TokenStore {
  let t = initial;
  return { load: async () => t, save: async (n) => void (t = n), clear: async () => void (t = null) };
}

describe("api client uploads and token access", () => {
  const tokens = { accessToken: "AT", refreshToken: "RT" };

  it("sends a FormData body as it is, without a JSON content type, and with the sign-in", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const fetchImpl = (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(JSON.stringify({ ok: true }), { status: 201, headers: { "Content-Type": "application/json" } });
    }) as unknown as typeof fetch;
    const api = createApiClient({ baseUrl: "https://x.test", store: memoryStore(tokens), fetchImpl });
    const form = new FormData();
    form.append("title", "Kundli");
    await api.request("/api/vault/upload", { method: "POST", body: form, timeoutMs: 90000 });
    const init = calls[0].init;
    expect(init.body).toBe(form);
    const headers = init.headers as Record<string, string>;
    expect(headers["Content-Type"]).toBeUndefined();
    expect(headers.Authorization).toBe("Bearer AT");
  });

  it("still sends JSON as JSON", async () => {
    let seen: RequestInit | undefined;
    const fetchImpl = (async (_u: string, init: RequestInit) => {
      seen = init;
      return new Response("{}", { status: 200 });
    }) as unknown as typeof fetch;
    const api = createApiClient({ baseUrl: "https://x.test", store: memoryStore(tokens), fetchImpl });
    await api.request("/x", { method: "POST", body: { a: 1 } });
    expect(seen?.body).toBe('{"a":1}');
    expect((seen?.headers as Record<string, string>)["Content-Type"]).toBe("application/json");
  });

  it("gives the current access token, or null when signed out", async () => {
    const api = createApiClient({ baseUrl: "https://x.test", store: memoryStore(tokens) });
    expect(await api.accessToken()).toBe("AT");
    const out = createApiClient({ baseUrl: "https://x.test", store: memoryStore(null) });
    expect(await out.accessToken()).toBeNull();
  });
});
