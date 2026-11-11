import * as fs from "fs";
import * as path from "path";
import { put, get as getBlob, del as delBlob } from "@vercel/blob";
import { assertPlaceholderAllowed, isDemoMode } from "@/lib/config/demo";

export interface StoredFileResult {
  storageKey: string;
  publicUrl?: string;
  fileSize: number;
  mimeType: string;
}

export interface StorageProvider {
  name: string;
  saveFile(
    fileBuffer: Buffer,
    originalFilename: string,
    mimeType: string,
    subfolder?: string
  ): Promise<StoredFileResult>;
  getFile(storageKey: string): Promise<{ buffer: Buffer; mimeType: string }>;
  /** Removes a stored file (used when an account is deleted). A missing file is not an error. */
  deleteFile?(storageKey: string): Promise<void>;
}

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB strict limit

export const ALLOWED_STORAGE_SUBFOLDERS = ["uploads", "media", "payment-proofs", "vault"] as const;

function assertAllowedSubfolder(subfolder: string): void {
  if (!(ALLOWED_STORAGE_SUBFOLDERS as readonly string[]).includes(subfolder)) {
    throw new Error(
      `Invalid storage subfolder "${subfolder}". Allowed: ${ALLOWED_STORAGE_SUBFOLDERS.join(", ")}.`
    );
  }
}

/**
 * Resolves a path relative to the storage base and asserts the result stays
 * inside it. Rejects absolute paths, `..` segments and Windows/Unix variants.
 */
function resolveWithinBase(baseDir: string, relativePath: string): string {
  const base = path.resolve(baseDir);
  const target = path.resolve(base, relativePath);
  const relative = path.relative(base, target);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Invalid storage path: traversal outside the storage directory is forbidden.");
  }

  return target;
}

/**
 * Validates file magic bytes against accepted types (PDF, PNG, JPEG, WEBP).
 */
export function validateFileMagicBytes(buffer: Buffer): { isValid: boolean; detectedMime: string | null } {
  if (buffer.length < 4) {
    return { isValid: false, detectedMime: null };
  }

  // PDF: %PDF- (0x25 0x50 0x44 0x46 0x2D)
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return { isValid: true, detectedMime: "application/pdf" };
  }

  // PNG: 0x89 0x50 0x4E 0x47
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { isValid: true, detectedMime: "image/png" };
  }

  // JPEG: 0xFF 0xD8 0xFF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { isValid: true, detectedMime: "image/jpeg" };
  }

  // WEBP: RIFF....WEBP
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return { isValid: true, detectedMime: "image/webp" };
  }

  return { isValid: false, detectedMime: null };
}

/**
 * True when files may be kept on the server disk in production: set STORAGE_DRIVER=local (and STORAGE_PATH to a folder that
 * survives redeploys) on a normal server such as Hostinger. Does not switch on any demo behaviour.
 */
export function isLocalDiskStorageAllowed(): boolean {
  return process.env.STORAGE_DRIVER === "local";
}

/**
 * Local Disk implementation for development, client demo and servers with a real disk (STORAGE_DRIVER=local).
 */
export class LocalDiskStorageProvider implements StorageProvider {
  name = "LocalDiskStorageProvider";
  private baseDir: string;

  constructor(baseDir?: string) {
    if (!isLocalDiskStorageAllowed()) assertPlaceholderAllowed("LocalDiskStorageProvider");
    this.baseDir =
      baseDir || process.env.STORAGE_PATH || path.join(process.cwd(), "storage");
  }

  async saveFile(
    fileBuffer: Buffer,
    originalFilename: string,
    mimeType: string,
    subfolder = "uploads"
  ): Promise<StoredFileResult> {
    if (fileBuffer.length > MAX_FILE_SIZE_BYTES) {
      throw new Error(`File size (${fileBuffer.length} bytes) exceeds 10MB limit.`);
    }

    // The vault accepts more file kinds; its routes check the content with detectDocumentType first.
    const magic = validateFileMagicBytes(fileBuffer);
    const isValid = magic.isValid || subfolder === "vault";
    const detectedMime = magic.isValid ? magic.detectedMime : mimeType;
    if (!isValid) {
      throw new Error("Invalid file content: signature does not match allowed types (PDF, PNG, JPEG, WEBP).");
    }

    const safeName = path.basename(originalFilename).replace(/[^a-zA-Z0-9._-]/g, "_");
    const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${safeName}`;
    assertAllowedSubfolder(subfolder);
    const targetDir = resolveWithinBase(this.baseDir, subfolder);

    if (!fs.existsSync(/*turbopackIgnore: true*/ targetDir)) {
      fs.mkdirSync(/*turbopackIgnore: true*/ targetDir, { recursive: true });
    }

    const filePath = path.join(targetDir, uniqueName);
    fs.writeFileSync(/*turbopackIgnore: true*/ filePath, fileBuffer);

    const relativeKey = path.join(subfolder, uniqueName).replace(/\\/g, "/");
    return {
      storageKey: relativeKey,
      publicUrl: `/api/storage/${relativeKey}`,
      fileSize: fileBuffer.length,
      mimeType: detectedMime || mimeType,
    };
  }

  async getFile(storageKey: string): Promise<{ buffer: Buffer; mimeType: string }> {
    const fullPath = resolveWithinBase(this.baseDir, storageKey);

    if (!fs.existsSync(/*turbopackIgnore: true*/ fullPath)) {
      throw new Error(`File not found: ${storageKey}`);
    }

    const buffer = fs.readFileSync(/*turbopackIgnore: true*/ fullPath);
    const { detectedMime } = validateFileMagicBytes(buffer);

    return {
      buffer,
      mimeType: detectedMime || "application/octet-stream",
    };
  }

  async deleteFile(storageKey: string): Promise<void> {
    const fullPath = resolveWithinBase(this.baseDir, storageKey);
    if (fs.existsSync(/*turbopackIgnore: true*/ fullPath)) {
      fs.unlinkSync(/*turbopackIgnore: true*/ fullPath);
    }
  }
}

/**
 * Production AWS S3 Storage Provider stub.
 * Fails loudly when production S3 bucket is not configured.
 */
export class S3StorageProvider implements StorageProvider {
  name = "S3StorageProvider";
  private bucket: string;
  private region: string;

  constructor() {
    this.bucket = process.env.AWS_S3_BUCKET || "";
    this.region = process.env.AWS_REGION || "ap-south-1";

    if (!this.bucket) {
      throw new Error(
        "CRITICAL STORAGE CONFIGURATION ERROR: AWS_S3_BUCKET is not set in environment variables."
      );
    }
  }

  async saveFile(): Promise<StoredFileResult> {
    throw new Error("S3StorageProvider requires AWS SDK installation and S3 credentials.");
  }

  async getFile(): Promise<{ buffer: Buffer; mimeType: string }> {
    throw new Error("S3StorageProvider requires AWS SDK installation and S3 credentials.");
  }
}

/**
 * Vercel Blob implementation (private store) for serverless hosting, where the
 * filesystem is read-only. Files are never exposed by a public URL: every read goes
 * through /api/storage, which performs the ownership/role checks first.
 * Enabled automatically when BLOB_READ_WRITE_TOKEN is set.
 */
export class VercelBlobStorageProvider implements StorageProvider {
  name = "VercelBlobStorageProvider";

  async saveFile(
    fileBuffer: Buffer,
    originalFilename: string,
    mimeType: string,
    subfolder = "uploads"
  ): Promise<StoredFileResult> {
    if (fileBuffer.length > MAX_FILE_SIZE_BYTES) {
      throw new Error(`File size (${fileBuffer.length} bytes) exceeds 10MB limit.`);
    }

    // The vault accepts more file kinds; its routes check the content with detectDocumentType first.
    const magic = validateFileMagicBytes(fileBuffer);
    const isValid = magic.isValid || subfolder === "vault";
    const detectedMime = magic.isValid ? magic.detectedMime : mimeType;
    if (!isValid) {
      throw new Error("Invalid file content: signature does not match allowed types (PDF, PNG, JPEG, WEBP).");
    }

    assertAllowedSubfolder(subfolder);
    const safeName = path.basename(originalFilename).replace(/[^a-zA-Z0-9._-]/g, "_");
    const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${safeName}`;
    const storageKey = `${subfolder}/${uniqueName}`;

    await put(storageKey, fileBuffer, {
      access: "private",
      addRandomSuffix: false,
      contentType: detectedMime || mimeType,
    });

    return {
      storageKey,
      publicUrl: `/api/storage/${storageKey}`,
      fileSize: fileBuffer.length,
      mimeType: detectedMime || mimeType,
    };
  }

  async getFile(storageKey: string): Promise<{ buffer: Buffer; mimeType: string }> {
    const [subfolder, ...rest] = storageKey.split("/");
    assertAllowedSubfolder(subfolder);
    if (rest.length === 0 || rest.some((seg) => seg === ".." || seg === "." || seg === "")) {
      throw new Error("Invalid storage path.");
    }

    const result = await getBlob(storageKey, { access: "private" });
    if (!result || result.statusCode !== 200) {
      throw new Error(`File not found: ${storageKey}`);
    }

    const buffer = Buffer.from(await new Response(result.stream).arrayBuffer());
    const { detectedMime } = validateFileMagicBytes(buffer);
    return {
      buffer,
      mimeType: detectedMime || result.blob.contentType || "application/octet-stream",
    };
  }

  async deleteFile(storageKey: string): Promise<void> {
    const [subfolder, ...rest] = storageKey.split("/");
    assertAllowedSubfolder(subfolder);
    if (rest.length === 0 || rest.some((seg) => seg === ".." || seg === "." || seg === "")) {
      throw new Error("Invalid storage path.");
    }
    await delBlob(storageKey);
  }
}

/**
 * Factory for storage provider.
 */
export function getStorageProvider(): StorageProvider {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    return new VercelBlobStorageProvider();
  }
  if (process.env.NODE_ENV === "production" && !isDemoMode() && !isLocalDiskStorageAllowed()) {
    return new S3StorageProvider();
  }
  return new LocalDiskStorageProvider();
}
