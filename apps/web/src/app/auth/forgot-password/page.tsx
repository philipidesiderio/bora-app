import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = { title: "Recuperar senha" };

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-heading text-4xl font-extrabold tracking-tight">
            lumi<span className="text-primary">POS</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Recupere o acesso à sua conta
          </p>
        </div>
        <ForgotPasswordForm />
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Lembrou a senha?{" "}
          <a href="/auth/login" className="text-primary hover:underline font-medium">
            Voltar ao login
          </a>
        </p>
      </div>
    </main>
  );
}
