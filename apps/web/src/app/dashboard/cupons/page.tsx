"use client";
import { useState } from "react";
import { api } from "@/components/providers/trpc-provider";
import { toast } from "sonner";
import { formatCurrency, cn } from "@/lib/utils";
import { Tag, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function CuponsPage() {
  const utils = api.useUtils();
  const { data: coupons = [] } = api.coupons.list.useQuery();

  const [showNew, setShowNew] = useState(false);
  const [form, setForm]       = useState({
    code: "", name: "", type: "flat" as "flat" | "percent",
    value: "", minCartValue: "", maxUses: "", validUntil: "",
  });

  const invalidate = () => utils.coupons.list.invalidate();

  const createCoupon = api.coupons.create.useMutation({
    onSuccess: () => { toast.success("Cupom criado!"); setShowNew(false); setForm({ code: "", name: "", type: "flat", value: "", minCartValue: "", maxUses: "", validUntil: "" }); invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const toggleActive = api.coupons.update.useMutation({
    onSuccess: () => { toast.success("Atualizado!"); invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteCoupon = api.coupons.delete.useMutation({
    onSuccess: () => { toast.success("Cupom removido!"); invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl">Cupons</h1>
          <p className="text-sm text-muted-foreground">Descontos e promoções</p>
        </div>
        <Button size="sm" onClick={() => setShowNew(v => !v)}><Plus className="h-4 w-4 mr-1" />Novo cupom</Button>
      </div>

      {showNew && (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
          <h3 className="font-semibold text-sm">Novo cupom</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 md:col-span-1">
              <label className="text-xs text-muted-foreground mb-1 block">Código *</label>
              <Input placeholder="DESCONTO10" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} className="font-mono uppercase" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Nome</label>
              <Input placeholder="Desconto 10%" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Tipo</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))} className="w-full h-9 px-3 text-sm bg-background border border-input rounded-lg focus:outline-none">
                <option value="flat">Valor fixo (R$)</option>
                <option value="percent">Porcentagem (%)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Valor *</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-muted-foreground">{form.type === "flat" ? "R$" : "%"}</span>
                <Input type="number" min="0" step="0.01" placeholder="10" className="pl-8" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Valor mínimo do carrinho</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-muted-foreground">R$</span>
                <Input type="number" min="0" step="0.01" placeholder="0" className="pl-8" value={form.minCartValue} onChange={e => setForm(f => ({ ...f, minCartValue: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Máx. usos</label>
              <Input type="number" min="1" placeholder="Ilimitado" value={form.maxUses} onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Válido até</label>
              <Input type="date" value={form.validUntil} onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setShowNew(false)}>Cancelar</Button>
            <Button size="sm" disabled={!form.code || !form.value || createCoupon.isPending}
              onClick={() => createCoupon.mutate({
                code: form.code, name: form.name || undefined, type: form.type,
                value: Number(form.value), minCartValue: Number(form.minCartValue || 0),
                maxUses: form.maxUses ? Number(form.maxUses) : undefined,
                validUntil: form.validUntil ? new Date(form.validUntil).toISOString() : undefined,
              })}>
              Criar cupom
            </Button>
          </div>
        </div>
      )}

      {(coupons as any[]).length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Tag className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">Nenhum cupom ainda</p>
          <p className="text-sm mt-1">Crie cupons para atrair mais vendas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(coupons as any[]).map((c: any) => (
            <div key={c.id} className={cn("bg-card border rounded-2xl p-4 flex items-start gap-4", c.active ? "border-border" : "border-border opacity-50")}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-bold text-primary text-sm px-2 py-0.5 bg-primary/10 rounded-lg">{c.code}</span>
                  {c.name && <span className="text-sm text-muted-foreground">{c.name}</span>}
                  {!c.active && <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Inativo</span>}
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>Desconto: <strong className="text-foreground">{c.type === "percent" ? `${c.value}%` : formatCurrency(Number(c.value))}</strong></span>
                  {Number(c.min_cart_value) > 0 && <span>Mín: {formatCurrency(Number(c.min_cart_value))}</span>}
                  {c.max_uses && <span>Usos: {c.uses_count}/{c.max_uses}</span>}
                  {c.valid_until && <span>Até: {new Date(c.valid_until).toLocaleDateString("pt-BR")}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => toggleActive.mutate({ id: c.id, active: !c.active })}
                  className={cn("w-10 h-5 rounded-full transition-all relative", c.active ? "bg-primary" : "bg-muted")}>
                  <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all", c.active ? "left-5" : "left-0.5")} />
                </button>
                <button onClick={() => deleteCoupon.mutate({ id: c.id })} className="text-muted-foreground hover:text-destructive transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
