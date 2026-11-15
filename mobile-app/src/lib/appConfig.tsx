import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import Constants from "expo-constants";
import { API_URL } from "./config";
import { compareVersions } from "./home";

/** The switches the admin sets in Settings > Android app that the whole app obeys. */
export interface AppConfig {
  maintenanceOn: boolean;
  maintenanceTextEn: string;
  maintenanceTextHi: string;
  minVersion: string;
  updateTextEn: string;
  updateTextHi: string;
  playStoreUrl: string | null;
  allowBooking: boolean;
  bookingUrl: string;
}

const DEFAULT: AppConfig = {
  maintenanceOn: false,
  maintenanceTextEn: "",
  maintenanceTextHi: "",
  minVersion: "",
  updateTextEn: "",
  updateTextHi: "",
  playStoreUrl: null,
  allowBooking: true,
  bookingUrl: "/services",
};

interface Value {
  config: AppConfig;
  version: string;
  /** The app is switched off for maintenance */
  maintenance: boolean;
  /** This installed version is older than the lowest one the admin allows */
  outdated: boolean;
  reload: () => Promise<void>;
}

const AppConfigContext = createContext<Value>({ config: DEFAULT, version: "", maintenance: false, outdated: false, reload: async () => undefined });

export function AppConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AppConfig>(DEFAULT);
  const version = String(Constants.expoConfig?.version ?? "0.0.0");

  const reload = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/mobile/v1/app-config`, { headers: { Accept: "application/json" } });
      if (!res.ok) return;
      const next = (await res.json()) as Partial<AppConfig>;
      setConfig({ ...DEFAULT, ...next });
    } catch {
      // No network or an older server: keep going with the standard settings
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const value = useMemo<Value>(
    () => ({
      config,
      version,
      maintenance: config.maintenanceOn,
      outdated: !!config.minVersion && compareVersions(version, config.minVersion) < 0,
      reload,
    }),
    [config, version, reload],
  );
  return <AppConfigContext.Provider value={value}>{children}</AppConfigContext.Provider>;
}

export function useAppConfig(): Value {
  return useContext(AppConfigContext);
}
