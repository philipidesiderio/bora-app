import { pgTable, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const planEnum = pgEnum("plan", ["free", "smart", "pro", "premium"]);

export const tenants = pgTable("tenants", {
  id:            text("id").primaryKey().$defaultFn(() => createId()),
  name:          text("name").notNull(),
  slug:          text("slug").notNull().unique(),
  logoUrl:       text("logo_url"),
  description:   text("description"),
  phone:         text("phone"),
  cnpj:          text("cnpj"),
  plan:          planEnum("plan").default("free").notNull(),
  planExpiresAt: timestamp("plan_expires_at"),
  isActive:      boolean("is_active").default(true).notNull(),
  createdAt:     timestamp("created_at").defaultNow().notNull(),
  updatedAt:     timestamp("updated_at").defaultNow().notNull(),
});

export type Tenant    = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
