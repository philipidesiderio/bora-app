"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, User, Mail, Lock, Store } from "lucide-react";
import { slugify } from "@/lib/utils";

const registerSchema = z.object({
  name:            z.string().min(2, "Nome muito curto"),
  storeName:       z.string().min(2, "Nome da loja muito curto"),
  email:           z.string().email("Email inválido"),
  password:        z.string().min(6, "Mínimo 6 caracteres"),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type RegisterData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router  = useRouter();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterData) => {
    setLoading(true);
    try {
      // 1. Criar conta no better-auth
      const { error } = await authClient.signUp.email({
        email:    data.email,
        password: data.password,
        name:     data.name,
      });

      if (error) {
        toast.error(error.message ?? "Erro ao criar conta");
        setLoading(false);
        return;
      }

      // 2. Criar tenant via API route
      const slug = slugify(data.storeName);
      await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeName: data.storeName, slug }),
      });

      toast.success("Conta criada! Bem-vindo ao lumiPOS 🎉");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      toast.error("Erro ao criar conta. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {[
            { id: "name",            label: "Seu nome",        placeholder: "João Silva",   icon: User,  type: "text"     },
            { id: "storeName",       label: "Nome da loja",    placeholder: "Loja do João", icon: Store, type: "text"     },
            { id: "email",           label: "Email",           placeholder: "seu@email.com",icon: Mail,  type: "email"    },
            { id: "password",        label: "Senha",           placeholder: "••••••••",     icon: Lock,  type: "password" },
            { id: "confirmPassword", label: "Confirmar senha", placeholder: "••••••••",     icon: Lock,  type: "password" },
          ].map(({ id, label, placeholder, icon: Icon, type }) => (
            <div key={id} className="space-y-2">
              <Label htmlFor={id}>{label}</Label>
              <div className="relative">
                <Icon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id={id} type={type} placeholder={placeholder}
                  className="pl-9" {...register(id as keyof RegisterData)} />
              </div>
              {errors[id as keyof RegisterData] && (
                <p className="text-xs text-destructive">{errors[id as keyof RegisterData]?.message}</p>
              )}
            </div>
          ))}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Criando conta...</>
              : "Criar conta grátis"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Ao criar uma conta você concorda com nossos{" "}
            <a href="/termos" className="text-primary hover:underline">Termos de Uso</a>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
