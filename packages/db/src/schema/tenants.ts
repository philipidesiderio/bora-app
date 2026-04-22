import { pgTable, text, timestamp, boolean, pgEnum, numeric, jsonb } from "drizzle-orm/pg-core";
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
  address:       text("address"),
  city:          text("city"),
  state:         text("state"),
  monthlyGoal:   numeric("monthly_goal", { precision: 12, scale: 2 }).default("0").notNull(),
  receiptSettings: jsonb("receipt_settings").default({ showPhone: true, showCnpj: true, showAddress: true, showDescription: false, footerNote: "" }).notNull(),
  plan:             planEnum("plan").default("free").notNull(),
  planExpiresAt:    timestamp("plan_expires_at"),
  isActive:         boolean("is_active").default(true).notNull(),
  asaasCustomerId:      text("asaas_customer_id"),
  asaasSubscriptionId:  text("asaas_subscription_id"),
  createdAt:     timestamp("created_at").defaultNow().notNull(),
  updatedAt:     timestamp("updated_at").defaultNow().notNull(),
});

export type Tenant    = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
