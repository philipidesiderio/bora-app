import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-heading text-4xl font-extrabold tracking-tight">
            Bora<span className="text-primary">.</span>app
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Entre na sua conta para continuar
          </p>
        </div>
        <LoginForm />
        <a
          href="/dashboard"
          className="mt-4 flex w-full items-center justify-center rounded-lg bg-primary py-3 text-sm font-semibold text-white hover:opacity-90"
        >
          Entrar direto →
        </a>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Não tem conta?{" "}
          <a href="/auth/register" className="text-primary hover:underline font-medium">
            Criar conta grátis
          </a>
        </p>
      </div>
    </main>
  );
}
