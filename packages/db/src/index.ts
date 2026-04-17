import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import { drizzle as drizzleProxy }   from "drizzle-orm/pg-proxy";
import postgres from "postgres";
import * as schema from "./schema";

export * from "./schema";
export type { InferSelectModel, InferInsertModel } from "drizzle-orm";

// ─── Conexão direta (produção / Vercel) ──────────────────────────────────────
// Em produção, usa postgres.js direto via DATABASE_URL (sem bloqueio de porta).
// Localmente, usa o proxy da Edge Function do Supabase.

const DATABASE_URL    = process.env.DATABASE_URL;
const DB_PROXY_URL    = process.env.DB_PROXY_URL;
const DB_PROXY_SECRET = process.env.DB_PROXY_SECRET ?? "bora-proxy-2024";

function createDb() {
  if (DATABASE_URL) {
    // Conexão direta via postgres.js (funciona na Vercel e em qualquer ambiente com acesso à porta)
    const client = postgres(DATABASE_URL, { prepare: false });
    return drizzlePostgres(client, { schema });
  }

  if (DB_PROXY_URL) {
    // Fallback: proxy via Supabase Edge Function (para ambientes sem acesso direto ao banco)
    const proxyUrl = DB_PROXY_URL;
    return drizzleProxy(
      async (sql, params, method) => {
        const res = await fetch(proxyUrl, {
          method: "POST",
          headers: {
            "Content-Type":   "application/json",
            "x-proxy-secret": DB_PROXY_SECRET,
          },
          body: JSON.stringify({ query: sql, params, method }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
          throw new Error((err as { error?: string }).error ?? `DB proxy error: ${res.status}`);
        }

        const data = await res.json() as { rows: unknown[] };
        return { rows: data.rows ?? [] };
      },
      { schema }
    );
  }

  throw new Error("Missing env: DATABASE_URL or DB_PROXY_URL must be set");
}

export const db = createDb();
