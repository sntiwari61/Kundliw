import Constants from "expo-constants";
import * as Updates from "expo-updates";

/** The version of the app that is installed, for example "1.0.0". */
export function installedVersion(): string {
  return Constants.expoConfig?.version ?? "1.0.0";
}

export type UpdateOutcome = "disabled" | "none" | "downloaded" | "error";

/**
 * Looks for a newer version of the app's screens (sent over the air, without the Play Store) and
 * downloads it when there is one. The new version starts the next time the app is opened, or at once
 * with `applyUpdate`.
 */
export async function checkForAppUpdate(): Promise<UpdateOutcome> {
  if (!Updates.isEnabled) return "disabled";
  try {
    const found = await Updates.checkForUpdateAsync();
    if (!found.isAvailable) return "none";
    await Updates.fetchUpdateAsync();
    return "downloaded";
  } catch {
    return "error";
  }
}

export function applyUpdate(): Promise<void> {
  return Updates.reloadAsync();
}
