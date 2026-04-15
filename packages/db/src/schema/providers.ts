import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { tenants } from "./tenants";

export const providers = pgTable("providers", {
  id:        text("id").primaryKey().$defaultFn(() => createId()),
  tenantId:  text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name:      text("name").notNull(),
  phone:     text("phone"),
  email:     text("email"),
  address:   text("address"),
  notes:     text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Provider = typeof providers.$inferSelect;

