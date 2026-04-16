import { drizzle } from "drizzle-orm/pg-proxy";
import * as schema from "./schema";

const DB_PROXY_URL    = process.env.DB_PROXY_URL!;
const DB_PROXY_SECRET = process.env.DB_PROXY_SECRET ?? "bora-proxy-2024";

/**
 * Drizzle via Supabase Edge Function proxy.
 * A Edge Function conecta ao banco internamente (rede AWS do Supabase),
 * contornando o bloqueio de porta 5432/6543 na rede local.
 */
export const db = drizzle(
  async (sql, params, method) => {
    const res = await fetch(DB_PROXY_URL, {
      method: "POST",
      headers: {
        "Content-Type":   "application/json",
        "x-proxy-secret": DB_PROXY_SECRET,
      },
      body: JSON.stringify({ query: sql, params, method }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(err.error ?? `DB proxy error: ${res.status}`);
    }

    const data = await res.json();
    return { rows: data.rows ?? [] };
  },
  { schema }
);

export * from "./schema";
export type { InferSelectModel, InferInsertModel } from "drizzle-orm";
