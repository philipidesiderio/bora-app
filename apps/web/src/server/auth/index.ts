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
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24,       // update daily
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  trustedOrigins: [
    "http://localhost:3000",
    "https://lumiposok.vercel.app",
    "https://lumiposok-git-main-mktdesiderio-9864s-projects.vercel.app",
    process.env.NEXT_PUBLIC_APP_URL ?? "",
    process.env.BETTER_AUTH_URL   ?? "",
  ].filter(Boolean),
});

export type Session = typeof auth.$Infer.Session;
