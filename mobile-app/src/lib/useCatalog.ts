import { useCallback, useEffect, useState } from "react";
import { ApiError } from "./api";
import type { Catalog } from "./booking";
import { useSession } from "./session";

/** Loads the services, plans and call times from the server; `reload` fetches them again. */
export function useCatalog() {
  const { api } = useSession();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setError("");
    try {
      setCatalog(await api.request<Catalog>("/api/mobile/v1/catalog", { auth: false }));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    }
  }, [api]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { catalog, error, reload, loading: catalog === null && !error };
}
