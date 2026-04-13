import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Usa URL direta com fallback para pooler
const DATABASE_URL = process.env.DATABASE_URL!;

const client = postgres(DATABASE_URL, {
  ssl: "require",
  max: 1,
  prepare: false,
  connect_timeout: 10,
  idle_timeout: 20,
});

export const db = drizzle(client, { schema });

export * from "./schema";
export type { InferSelectModel, InferInsertModel } from "drizzle-orm";
