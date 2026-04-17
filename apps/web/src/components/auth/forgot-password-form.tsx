"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";

const schema = z.object({
  email: z.string().email("Email inválido"),
});
type Data = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<Data>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: Data) => {
    setLoading(true);
    try {
      const res = await fetch("/api/forgot-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: data.email }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Falha ao solicitar recuperação");
      }
      setSent(true);
      toast.success("Se o email existir, você receberá instruções");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Tente novamente";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <Card>
        <CardContent className="pt-6 text-center space-y-4">
          <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
          <h2 className="text-lg font-semibold">Solicitação registrada</h2>
          <p className="text-sm text-muted-foreground">
            Se houver uma conta com esse email, nossa equipe entrará em contato
            para ajudar a recuperar o acesso.
          </p>
          <p className="text-xs text-muted-foreground">
            Em caso de urgência, fale com o suporte:{" "}
            <a href="mailto:mkt.desiderio@gmail.com" className="text-primary hover:underline">
              mkt.desiderio@gmail.com
            </a>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Digite o email cadastrado. Enviaremos as instruções para recuperar sua senha.
          </p>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input id="email" type="email" placeholder="seu@email.com"
                className="pl-9" {...register("email")} />
            </div>
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</>
              : "Recuperar senha"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
