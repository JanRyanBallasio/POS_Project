// ...existing code...
import { useState } from "react";
import type { Category } from "@/hooks/categories/useCategoryApi";

type Payload = { name: string };
type Options = { onSuccess?: (created: Category | any) => void };

export const useAddCategory = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const addCategory = async (payload: Payload, options?: Options) => {
    setLoading(true);
    setError(null);

    // Accept either NEXT_PUBLIC_API_URL or NEXT_PUBLIC_backend_api_url
    // and normalize the value:
    // - remove trailing slashes
    // - remove any trailing '/api'
    // - ensure protocol (defaults to http:// if missing host only)
    const raw =
      process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_backend_api_url ?? "";
    let envBase = String(raw).trim();

    console.log("useAddCategory: raw env value:", raw); // <-- added

    // remove surrounding quotes if any
    envBase = envBase.replace(/^["']|["']$/g, "");
    // remove trailing slashes
    envBase = envBase.replace(/\/+$/g, "");
    // remove trailing '/api' if present
    envBase = envBase.replace(/\/api$/i, "");
    // if empty, fall back to relative API path
    if (!envBase) {
      envBase = "";
    } else if (!/^https?:\/\//i.test(envBase)) {
      // If user provided "localhost:5000" or ":5000", normalize to http://localhost:5000
      if (envBase.startsWith(":")) {
        envBase = `http://localhost${envBase}`;
      } else {
        envBase = `http://${envBase}`;
      }
    }

    const url = envBase ? `${envBase}/api/categories` : "/api/categories";
    console.log("useAddCategory: POST url:", url, "payload:", payload); // <-- added

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let bodyText = "";
        try {
          // try parse json; fall back to text
          const cloned = res.clone();
          bodyText = await cloned.text();
        } catch (parseErr) {
          bodyText = "<could not read response body>";
        }
        console.error("useAddCategory: non-ok response", { url, status: res.status, body: bodyText }); // <-- added
        let msg = `Request failed with status ${res.status}`;
        try {
          const json = await res.json();
          msg = json?.message ?? json?.error ?? json?.data?.message ?? msg;
        } catch {
          //
        }
        throw new Error(msg);
      }

      const json = await res.json();
      console.log("useAddCategory: success response json:", json); // <-- added
      const created = json?.data ?? json;

      options?.onSuccess?.(created);
      setLoading(false);
      return created;
    } catch (err: any) {
      console.error("useAddCategory: caught error", err); // <-- added
      const message = err instanceof Error ? err.message : "Failed to create category";
      setError(message);
      setLoading(false);
      throw err;
    }
  };

  return { addCategory, loading, error };
};

export default useAddCategory;
// ...existing code...