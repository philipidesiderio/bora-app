"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Building2, Save, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { api } from "@/components/providers/trpc-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function DadosNegocioPage() {
  const utils = api.useUtils();

  const { data, isLoading } = api.dashboard.getBusinessData.useQuery();

  const [form, setForm] = useState({
    name:        "",
    phone:       "",
    cnpj:        "",
    description: "",
  });

  useEffect(() => {
    if (data) {
      setForm({
        name:        data.name        ?? "",
        phone:       data.phone       ?? "",
        cnpj:        data.cnpj        ?? "",
        description: data.description ?? "",
      });
    }
  }, [data]);

  const updateMut = api.dashboard.updateBusinessData.useMutation({
    onSuccess: () => {
      utils.dashboard.getBusinessData.invalidate();
      toast.success("Dados atualizados com sucesso!");
    },
    onError: (e) => toast.error(e.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Nome é obrigatório"); return; }
    updateMut.mutate({
      name:        form.name,
      phone:       form.phone       || undefined,
      cnpj:        form.cnpj        || undefined,
      description: form.description || undefined,
    });
  }

  return (
    <div className="max-w-lg mx-auto pb-28 md:pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/ajustes" className="p-2 rounded-xl hover:bg-muted transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="font-heading text-xl font-bold">Dados do Negócio</h1>
          <p className="text-xs text-muted-foreground">Nome, CNPJ, contato e descrição</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Nome do negócio *</label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ex: Loja do João"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">CNPJ / CPF</label>
              <Input
                value={form.cnpj}
                onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))}
                placeholder="00.000.000/0001-00"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Telefone / WhatsApp</label>
              <Input
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Descrição</label>
              <Input
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Breve descrição do seu negócio"
              />
            </div>
          </div>

          {data && (
            <div className="bg-muted/40 rounded-xl px-4 py-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Plano atual: </span>
              <span className="capitalize font-semibold text-primary">{data.plan}</span>
              {" · "}
              <Link href="/dashboard/ajustes/planos" className="underline hover:text-foreground">
                Ver planos
              </Link>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={updateMut.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            {updateMut.isPending ? "Salvando..." : "Salvar alterações"}
          </Button>
        </form>
      )}
    </div>
  );
}
