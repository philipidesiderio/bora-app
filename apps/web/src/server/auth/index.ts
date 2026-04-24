import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@bora/db";
import { users, sessions, accounts, verifications } from "@bora/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user:         users,
      session:      sessions,
      account:      accounts,
      verification: verifications,
    },
  }),
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  emailAndPassword: { enabled: true },
  ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? {
    socialProviders: {
      google: {
        clientId:     process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      },
    },
  } : {}),
  session: {
    expiresIn:        60 * 60 * 24 * 30, // 30 dias
    updateAge:        60 * 60 * 24,       // renova o token a cada 24h
    cookieCache: {
      enabled: true,
      maxAge:  60 * 60,                   // revalida a cada 1h (era 5min — causava logout)
    },
  },
  trustedOrigins: [
    "http://localhost:3000",
    "https://lumipos.com.br",
    "https://lumiposok.vercel.app",
    process.env.NEXT_PUBLIC_APP_URL ?? "",
    process.env.BETTER_AUTH_URL   ?? "",
  ].filter(Boolean),
});

export type Session = typeof auth.$Infer.Session;
