"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Building2, Save, ChevronLeft, Target, MapPin, Receipt } from "lucide-react";
import Link from "next/link";
import { api } from "@/components/providers/trpc-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ReceiptSettings = {
  showPhone:       boolean;
  showCnpj:        boolean;
  showAddress:     boolean;
  showDescription: boolean;
  footerNote:      string;
};

const DEFAULT_RECEIPT: ReceiptSettings = {
  showPhone:       true,
  showCnpj:        true,
  showAddress:     true,
  showDescription: false,
  footerNote:      "",
};

export default function DadosNegocioPage() {
  const utils = api.useUtils();

  const { data, isLoading } = api.dashboard.getBusinessData.useQuery();

  const [form, setForm] = useState({
    name:        "",
    phone:       "",
    cnpj:        "",
    description: "",
    address:     "",
    city:        "",
    state:       "",
    monthlyGoal: "",
  });
  const [receipt, setReceipt] = useState<ReceiptSettings>(DEFAULT_RECEIPT);

  useEffect(() => {
    if (data) {
      const d = data as any;
      setForm({
        name:        d.name        ?? "",
        phone:       d.phone       ?? "",
        cnpj:        d.cnpj        ?? "",
        description: d.description ?? "",
        address:     d.address     ?? "",
        city:        d.city        ?? "",
        state:       d.state       ?? "",
        monthlyGoal: d.monthly_goal ? String(Number(d.monthly_goal)) : "",
      });
      setReceipt({ ...DEFAULT_RECEIPT, ...(d.receipt_settings ?? {}) });
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
      address:     form.address     || undefined,
      city:        form.city        || undefined,
      state:       form.state       || undefined,
      monthlyGoal: form.monthlyGoal ? Number(form.monthlyGoal) : 0,
      receiptSettings: receipt,
    });
  }

  const toggle = (k: keyof ReceiptSettings) =>
    setReceipt(r => ({ ...r, [k]: !r[k] }));

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
          <p className="text-xs text-muted-foreground">Informações, meta mensal e recibo</p>
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
          {/* Bloco: Identificação */}
          <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Nome do negócio *</label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ex: Loja do João"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">CNPJ / CPF</label>
                <Input
                  value={form.cnpj}
                  onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))}
                  placeholder="00.000.000/0001-00"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Telefone</label>
                <Input
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="(11) 99999-9999"
                />
              </div>
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

          {/* Bloco: Endereço */}
          <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <MapPin className="w-4 h-4 text-primary" /> Endereço
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Endereço (rua, nº, bairro)</label>
              <Input
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                placeholder="Rua das Flores, 123 — Centro"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1.5">
                <label className="text-sm font-medium">Cidade</label>
                <Input
                  value={form.city}
                  onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                  placeholder="São Paulo"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">UF</label>
                <Input
                  value={form.state}
                  onChange={e => setForm(f => ({ ...f, state: e.target.value.toUpperCase().slice(0, 2) }))}
                  maxLength={2}
                  placeholder="SP"
                />
              </div>
            </div>
          </div>

          {/* Bloco: Meta mensal */}
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Target className="w-4 h-4 text-primary" /> Meta mensal de vendas
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Valor da meta (R$)</label>
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={form.monthlyGoal}
                onChange={e => setForm(f => ({ ...f, monthlyGoal: e.target.value }))}
                placeholder="Ex: 15000"
              />
              <p className="text-[11px] text-muted-foreground">
                Usada no gráfico de vendas do dashboard. Deixe 0 para ocultar.
              </p>
            </div>
          </div>

          {/* Bloco: Recibo */}
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Receipt className="w-4 h-4 text-primary" /> O que aparece no recibo
            </div>
            <p className="text-[11px] text-muted-foreground -mt-1">
              Marque as informações que devem aparecer no cabeçalho do recibo impresso e no WhatsApp.
            </p>
            {([
              { key: "showPhone",       label: "Telefone" },
              { key: "showCnpj",        label: "CNPJ / CPF" },
              { key: "showAddress",     label: "Endereço completo" },
              { key: "showDescription", label: "Descrição do negócio" },
            ] as { key: keyof ReceiptSettings; label: string }[]).map(opt => (
              <label key={opt.key} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={Boolean(receipt[opt.key])}
                  onChange={() => toggle(opt.key)}
                  className="w-4 h-4 rounded border-border accent-primary"
                />
                <span>{opt.label}</span>
              </label>
            ))}
            <div className="space-y-1.5 pt-2 border-t border-border/50">
              <label className="text-sm font-medium">Rodapé personalizado (opcional)</label>
              <Input
                value={receipt.footerNote}
                onChange={e => setReceipt(r => ({ ...r, footerNote: e.target.value }))}
                placeholder="Ex.: Volte sempre! Trocas em até 7 dias."
              />
            </div>
          </div>

          {data && (
            <div className="bg-muted/40 rounded-xl px-4 py-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Plano atual: </span>
              <span className="capitalize font-semibold text-primary">{(data as any).plan}</span>
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
