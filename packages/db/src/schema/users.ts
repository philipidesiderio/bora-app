import { pgTable, text, timestamp, pgEnum, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { tenants } from "./tenants";

export const roleEnum = pgEnum("role", ["owner", "admin", "seller", "cashier"]);

export const users = pgTable("users", {
  id:             text("id").primaryKey().$defaultFn(() => createId()),
  tenantId:       text("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  name:           text("name").notNull(),
  email:          text("email").notNull().unique(),
  emailVerified:  boolean("email_verified").default(false).notNull(),
  image:          text("image"),
  role:           roleEnum("role").default("owner").notNull(),
  createdAt:      timestamp("created_at").defaultNow().notNull(),
  updatedAt:      timestamp("updated_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id:        text("id").primaryKey(),
  userId:    text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token:     text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const accounts = pgTable("accounts", {
  id:                   text("id").primaryKey(),
  userId:               text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  accountId:            text("account_id").notNull(),
  providerId:           text("provider_id").notNull(),
  accessToken:          text("access_token"),
  refreshToken:         text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  password:             text("password"),
  idToken:              text("id_token"),
  createdAt:            timestamp("created_at").defaultNow().notNull(),
  updatedAt:            timestamp("updated_at").defaultNow().notNull(),
});

export const verifications = pgTable("verifications", {
  id:         text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value:      text("value").notNull(),
  expiresAt:  timestamp("expires_at").notNull(),
  createdAt:  timestamp("created_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ one }) => ({
  tenant: one(tenants, { fields: [users.tenantId], references: [tenants.id] }),
}));

export type User    = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
