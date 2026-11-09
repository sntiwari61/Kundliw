import { afterEach, describe, expect, it, vi } from "vitest";
import { getStorageProvider } from "@/lib/storage";

describe("storage provider choice in production", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("uses the unconfigured S3 stub when nothing is set (fails loudly)", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "");
    vi.stubEnv("DEMO_MODE", "");
    vi.stubEnv("STORAGE_DRIVER", "");
    expect(() => getStorageProvider()).toThrow(/AWS_S3_BUCKET/);
  });

  it("keeps files on the server disk when STORAGE_DRIVER=local, without demo mode", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "");
    vi.stubEnv("DEMO_MODE", "");
    vi.stubEnv("STORAGE_DRIVER", "local");
    expect(getStorageProvider().name).toBe("LocalDiskStorageProvider");
  });

  it("still prefers Vercel Blob when its token exists", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "x");
    vi.stubEnv("STORAGE_DRIVER", "local");
    expect(getStorageProvider().name).toBe("VercelBlobStorageProvider");
  });
});
