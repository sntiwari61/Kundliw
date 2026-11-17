import type { ApiClient } from "./api";
import { cacheFileName, downloadAndShare } from "./download";

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
  /** the order this document was sent for, when there is one */
  orderId?: string | null;
  orderNumber?: string | null;
}

/** The server's limit for one uploaded file. */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

/** "1.2 MB", "340 KB" */
export function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** A file name that is safe to write in the app's cache. */
export const safeFileName = cacheFileName;

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
  await downloadAndShare(api, `/api/vault/${file.id}?download=1`, safeFileName(file.id, file.fileName), file.mimeType, dialogTitle);
}

export type VaultFilter = "ALL" | "KENDRA" | "MINE";

/** The files matching a filter (sent by the Kendra / uploaded by the person) and a search text (title in either language, file name, order number). */
export function filterVault(files: VaultFile[], filter: VaultFilter, query: string): VaultFile[] {
  const q = query.trim().toLowerCase();
  return files.filter((f) => {
    if (filter === "KENDRA" && f.uploadedByRole !== "ADMIN") return false;
    if (filter === "MINE" && f.uploadedByRole === "ADMIN") return false;
    if (!q) return true;
    return [f.titleEn, f.titleHi, f.fileName, f.orderNumber ?? ""].some((v) => (v ?? "").toLowerCase().includes(q));
  });
}
