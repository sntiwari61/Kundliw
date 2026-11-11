import * as SecureStore from "expo-secure-store";

/** The sign-in tokens, kept in the phone's secure storage (Keystore on Android, Keychain on iOS). */
export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

const ACCESS_KEY = "kjk.accessToken";
const REFRESH_KEY = "kjk.refreshToken";

export interface TokenStore {
  load(): Promise<Tokens | null>;
  save(tokens: Tokens): Promise<void>;
  clear(): Promise<void>;
}

export const secureTokenStore: TokenStore = {
  async load() {
    try {
      const [accessToken, refreshToken] = await Promise.all([
        SecureStore.getItemAsync(ACCESS_KEY),
        SecureStore.getItemAsync(REFRESH_KEY),
      ]);
      return accessToken && refreshToken ? { accessToken, refreshToken } : null;
    } catch {
      // Unreadable storage (for example after a device restore): treat as signed out
      return null;
    }
  },
  async save(tokens) {
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_KEY, tokens.accessToken),
      SecureStore.setItemAsync(REFRESH_KEY, tokens.refreshToken),
    ]);
  },
  async clear() {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_KEY).catch(() => undefined),
      SecureStore.deleteItemAsync(REFRESH_KEY).catch(() => undefined),
    ]);
  },
};
