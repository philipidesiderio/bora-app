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
  emailAndPassword: { enabled: true },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24,       // update daily
  },
  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL!],
});

export type Session = typeof auth.$Infer.Session;
