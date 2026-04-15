import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  cookieConfig: {
    name: "lumi-session",
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  },
});

export const { signIn, signUp, signOut, useSession } = authClient;
