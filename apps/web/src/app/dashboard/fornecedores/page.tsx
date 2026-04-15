"use client";
import { useState } from "react";
import { api } from "@/components/providers/trpc-provider";
import { toast } from "sonner";
import { formatCurrency, cn } from "@/lib/utils";
import { Truck, Plus, X, CheckCircle, Package, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold", color)}>{children}</span>;
}

export default function FornecedoresPage() {
  const utils = api.useUtils();

  const { data: providers = []    } = api.providers.list.useQuery({});
  const { data: procurements = [] } = api.procurements.list.useQuery({});

  // Novo fornecedor
  const [showNewProv, setShowNewProv] = useState(false);
  const [provName, setProvName]       = useState("");
  const [provPhone, setProvPhone]     = useState("");
  const [provEmail, setProvEmail]     = useState("");

  // Nova compra
  const [showNewProc, setShowNewProc]     = useState(false);
  const [selectedProv, setSelectedProv]   = useState("");
  const [procName, setProcName]           = useState("");
  const [procItems, setProcItems]         = useState<{ productId: string; qty: number; price: number; name: string }[]>([]);
  const [openProc, setOpenProc]           = useState<string | null>(null);

  const { data: products = [] } = api.products.list.useQuery({ limit: 200 });

  const invalidate = () => { utils.providers.list.invalidate(); utils.procurements.list.invalidate(); };

  const createProv = api.providers.create.useMutation({
    onSuccess: () => { toast.success("Fornecedor criado!"); setProvName(""); setProvPhone(""); setProvEmail(""); setShowNewProv(false); invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const createProc = api.procurements.create.useMutation({
    onSuccess: () => { toast.success("Compra criada!"); setShowNewProc(false); setProcItems([]); setProcName(""); setSelectedProv(""); invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const deliver    = api.procurements.deliver.useMutation({
    onSuccess: () => { toast.success("Entrega confirmada! Estoque atualizado."); invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const markPaid   = api.procurements.markPaid.useMutation({
    onSuccess: () => { toast.success("Compra marcada como paga!"); invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const addProcItem = (productId: string) => {
    const p = (products as any[]).find(x => x.id === productId);
    if (!p) return;
    setProcItems(prev => {
      if (prev.find(i => i.productId === productId)) return prev;
      return [...prev, { productId, qty: 1, price: Number(p.cost_price ?? 0), name: p.name }];
    });
  };

  return (
    <div className="space-y-5 pb-28 md:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl">Fornecedores</h1>
          <p className="text-sm text-muted-foreground">Compras e entrada de estoque</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowNewProv(v => !v)}><Plus className="h-4 w-4 mr-1" />Fornecedor</Button>
          <Button size="sm" onClick={() => setShowNewProc(v => !v)}><Plus className="h-4 w-4 mr-1" />Nova compra</Button>
        </div>
      </div>

      {/* Novo fornecedor */}
      {showNewProv && (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <h3 className="font-semibold text-sm">Novo fornecedor</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Input placeholder="Nome *" value={provName} onChange={e => setProvName(e.target.value)} />
            <Input placeholder="Telefone" value={provPhone} onChange={e => setProvPhone(e.target.value)} />
            <Input placeholder="E-mail" type="email" value={provEmail} onChange={e => setProvEmail(e.target.value)} />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setShowNewProv(false)}>Cancelar</Button>
            <Button size="sm" onClick={() => createProv.mutate({ name: provName, phone: provPhone, email: provEmail })} disabled={!provName || createProv.isPending}>Salvar</Button>
          </div>
        </div>
      )}

      {/* Nova compra */}
      {showNewProc && (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
          <h3 className="font-semibold text-sm">Nova compra</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Fornecedor</label>
              <select value={selectedProv} onChange={e => setSelectedProv(e.target.value)} className="w-full h-9 px-3 text-sm bg-background border border-input rounded-lg focus:outline-none">
                <option value="">Sem fornecedor</option>
                {(providers as any[]).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Nome/referência</label>
              <Input placeholder="Ex: Compra semanal" value={procName} onChange={e => setProcName(e.target.value)} />
            </div>
          </div>

          {/* Adicionar produto à compra */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Adicionar produto</label>
            <select onChange={e => { addProcItem(e.target.value); e.target.value = ""; }} className="w-full h-9 px-3 text-sm bg-background border border-input rounded-lg focus:outline-none">
              <option value="">Selecionar produto...</option>
              {(products as any[]).map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {procItems.length > 0 && (
            <div className="space-y-2">
              {procItems.map((item, idx) => (
                <div key={item.productId} className="flex items-center gap-2 p-3 bg-muted/40 rounded-xl">
                  <span className="flex-1 text-sm font-semibold truncate">{item.name}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">Qtd</span>
                    <Input type="number" min="1" className="w-16 h-8 text-sm" value={item.qty}
                      onChange={e => setProcItems(prev => prev.map((i, j) => j === idx ? { ...i, qty: Number(e.target.value) } : i))} />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">R$</span>
                    <Input type="number" min="0" step="0.01" className="w-24 h-8 text-sm" value={item.price}
                      onChange={e => setProcItems(prev => prev.map((i, j) => j === idx ? { ...i, price: Number(e.target.value) } : i))} />
                  </div>
                  <button onClick={() => setProcItems(prev => prev.filter((_, j) => j !== idx))} className="text-muted-foreground"><X className="h-4 w-4" /></button>
                </div>
              ))}
              <div className="flex justify-between text-sm font-bold pt-1">
                <span>Total</span>
                <span className="font-mono text-primary">{formatCurrency(procItems.reduce((s, i) => s + i.qty * i.price, 0))}</span>
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => { setShowNewProc(false); setProcItems([]); }}>Cancelar</Button>
            <Button size="sm" disabled={procItems.length === 0 || createProc.isPending}
              onClick={() => createProc.mutate({ providerId: selectedProv || undefined, name: procName || undefined, items: procItems.map(i => ({ productId: i.productId, quantity: i.qty, purchasePrice: i.price })) })}>
              Criar compra
            </Button>
          </div>
        </div>
      )}

      {/* Lista de compras */}
      <div className="space-y-3">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Compras</h2>
        {(procurements as any[]).length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <Truck className="h-10 w-10 mx-auto mb-2 opacity-20" />
            <p className="text-sm">Nenhuma compra ainda</p>
          </div>
        ) : (procurements as any[]).map((proc: any) => (
          <div key={proc.id} className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => setOpenProc(openProc === proc.id ? null : proc.id)}>
              <Package className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{proc.name ?? `Compra #${proc.id.slice(0, 8)}`}</p>
                {proc.provider && <p className="text-xs text-muted-foreground">{proc.provider.name}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Badge color={proc.delivery_status === "delivered" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>
                  {proc.delivery_status === "delivered" ? "Entregue" : "Pendente"}
                </Badge>
                <Badge color={proc.payment_status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}>
                  {proc.payment_status === "paid" ? "Pago" : "A pagar"}
                </Badge>
                <p className="font-mono font-bold text-sm text-primary">{formatCurrency(Number(proc.total_value))}</p>
                {openProc === proc.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </div>
            </div>

            {openProc === proc.id && (
              <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
                {/* Items */}
                {(proc.items ?? []).map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.product?.name ?? item.product_id}</span>
                    <span className="font-mono">{item.quantity} × {formatCurrency(Number(item.purchase_price))} = {formatCurrency(Number(item.total_price))}</span>
                  </div>
                ))}
                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  {proc.delivery_status !== "delivered" && (
                    <button onClick={() => deliver.mutate({ procurementId: proc.id })} disabled={deliver.isPending}
                      className="flex-1 h-9 rounded-xl bg-emerald-100 text-emerald-700 font-semibold text-sm border border-emerald-200 flex items-center justify-center gap-1.5 disabled:opacity-50">
                      <CheckCircle className="h-4 w-4" />Confirmar entrega
                    </button>
                  )}
                  {proc.payment_status !== "paid" && (
                    <button onClick={() => markPaid.mutate({ procurementId: proc.id })} disabled={markPaid.isPending}
                      className="flex-1 h-9 rounded-xl bg-primary/10 text-primary font-semibold text-sm border border-primary/20 flex items-center justify-center gap-1.5 disabled:opacity-50">
                      Marcar como pago
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lista de fornecedores */}
      {(providers as any[]).length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Fornecedores</h2>
          <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
            {(providers as any[]).map((p: any) => (
              <div key={p.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-semibold text-sm">{p.name}</p>
                  {p.phone && <p className="text-xs text-muted-foreground">{p.phone}</p>}
                </div>
                {p.email && <p className="text-xs text-muted-foreground">{p.email}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
