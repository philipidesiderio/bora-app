import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Criar conta" };

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-heading text-4xl font-extrabold tracking-tight">
            lumi<span className="text-primary">POS</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Crie sua conta gratuitamente
          </p>
        </div>
        <RegisterForm />
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Já tem conta?{" "}
          <a href="/auth/login" className="text-primary hover:underline font-medium">
            Entrar
          </a>
        </p>
      </div>
    </main>
  );
}
