import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import type { ApiClient } from "./api";
import { API_URL } from "./config";

/** A Vault file as the app receives it from /api/mobile/v1/vault. */
export interface VaultFile {
  id: string;
  titleEn: string;
  titleHi: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  /** ADMIN = sent by the Kendra; USER or ASSOCIATE = uploaded by the person */
  uploadedByRole: string;
  uploadedAt: string;
}

/** The server's limit for one uploaded file. */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

/** "1.2 MB", "340 KB" */
export function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** A file name that is safe to write in the app's cache. */
export function safeFileName(id: string, name: string): string {
  return `${id}-${name.replace(/[^\w.\- ]+/g, "_")}`.slice(0, 120);
}

export type VaultIcon = "document-text" | "image" | "videocam" | "musical-notes" | "document";

export function iconFor(mime: string): VaultIcon {
  if (mime === "application/pdf") return "document-text";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "videocam";
  if (mime.startsWith("audio/")) return "musical-notes";
  return "document";
}

/**
 * Downloads one of the person's own files (with their sign-in) into the app's cache and hands it to the
 * phone's own viewer or share sheet. The file is not kept in the Vault of anyone else.
 */
export async function openVaultFile(api: ApiClient, file: VaultFile, dialogTitle: string): Promise<void> {
  await api.me(); // refreshes the sign-in first if it has expired
  const token = await api.accessToken();
  if (!token) throw new Error("Please sign in again.");
  const destination = new File(Paths.cache, safeFileName(file.id, file.fileName));
  const saved = await File.downloadFileAsync(`${API_URL}/api/vault/${file.id}?download=1`, destination, {
    headers: { Authorization: `Bearer ${token}` },
    idempotent: true,
  });
  if (!(await Sharing.isAvailableAsync())) throw new Error("This phone cannot open the file.");
  await Sharing.shareAsync(saved.uri, { mimeType: file.mimeType, dialogTitle });
}
