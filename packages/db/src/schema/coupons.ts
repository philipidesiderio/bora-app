import { pgTable, text, timestamp, numeric, boolean, integer, pgEnum } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { tenants } from "./tenants";

export const couponTypeEnum = pgEnum("coupon_type", ["flat", "percent"]);

export const coupons = pgTable("coupons", {
  id:          text("id").primaryKey().$defaultFn(() => createId()),
  tenantId:    text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  code:        text("code").notNull(),
  name:        text("name"),
  type:        couponTypeEnum("type").default("flat").notNull(),
  value:       numeric("value", { precision: 10, scale: 2 }).notNull(),
  minCartValue: numeric("min_cart_value", { precision: 10, scale: 2 }).default("0"),
  maxUses:     integer("max_uses"),
  usesCount:   integer("uses_count").default(0).notNull(),
  validUntil:  timestamp("valid_until"),
  active:      boolean("active").default(true).notNull(),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
});

export type Coupon = typeof coupons.$inferSelect;

