import { createAuthClient } from "better-auth/react";

// NEXT_PUBLIC_APP_URL deve ser configurada no painel da Vercel como:
// https://lumiposok.vercel.app (produção)
// http://localhost:3000 (desenvolvimento)
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
