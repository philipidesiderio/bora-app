"use client";
import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Package, ArrowDownUp, Plus, Minus, ArrowDown, ArrowUp, RefreshCw, RotateCcw, Search } from "lucide-react";
import { api } from "@/components/providers/trpc-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatCurrency, cn } from "@/lib/utils";

type AdjustForm = {
  productId: string;
  productName: string;
  type: "in" | "out" | "adjustment" | "return";
  quantity: string;
  reason: string;
};

const MOV_META: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  in:         { label: "Entrada",    icon: ArrowDown,   color: "text-emerald-700", bg: "bg-emerald-100" },
  out:        { label: "Saída",      icon: ArrowUp,     color: "text-rose-700",    bg: "bg-rose-100" },
  adjustment: { label: "Ajuste",     icon: RefreshCw,   color: "text-blue-700",    bg: "bg-blue-100" },
  return:     { label: "Devolução",  icon: RotateCcw,   color: "text-amber-700",   bg: "bg-amber-100" },
};

const TYPE_OPTIONS = [
  { value: "in",         label: "Entrada" },
  { value: "out",        label: "Saída" },
  { value: "adjustment", label: "Ajuste (absoluto)" },
  { value: "return",     label: "Devolução" },
];

export default function EstoquePage() {
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<AdjustForm>({
    productId: "", productName: "", type: "in", quantity: "", reason: "",
  });
  const utils = api.useUtils();

  const { data: lowStock = [] }      = api.inventory.getLowStock.useQuery();
  const { data: movements = [], isLoading } = api.inventory.list.useQuery({ limit: 50 });
  const { data: allProducts = [] }   = api.products.list.useQuery({ limit: 200 });

  const adjustMut = api.inventory.adjustStock.useMutation({
    onSuccess: () => {
      utils.inventory.list.invalidate();
      utils.inventory.getLowStock.invalidate();
      utils.products.list.invalidate();
      toast.success("Estoque ajustado!");
      setAdjustOpen(false);
      setForm({ productId: "", productName: "", type: "in", quantity: "", reason: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  function openAdjust(p?: any) {
    setForm({
      productId: p?.id ?? "",
      productName: p?.name ?? "",
      type: "in",
      quantity: "",
      reason: "",
    });
    setAdjustOpen(true);
  }

  const trackedProducts = allProducts.filter((p: any) => p.trackStock);
  const filteredProducts = trackedProducts.filter((p: any) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 pb-28 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6" /> Estoque
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {trackedProducts.length} produto{trackedProducts.length !== 1 ? "s" : ""} com controle de estoque
          </p>
        </div>
        <Button onClick={() => openAdjust()} size="sm">
          <ArrowDownUp className="h-4 w-4 mr-1" /> Ajustar
        </Button>
      </div>

      {/* Alertas de estoque baixo */}
      {lowStock.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
          <p className="text-sm font-semibold text-amber-700 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4" /> {lowStock.length} produto{lowStock.length !== 1 ? "s" : ""} com estoque baixo
          </p>
          <div className="space-y-2">
            {lowStock.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-amber-100">
                <div>
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-amber-600">Atual: {p.stock ?? 0} · Mín: {p.minStock ?? 5}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => openAdjust(p)} className="border-amber-300 text-amber-700 hover:bg-amber-50 text-xs">
                  Repor
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar produto..."
          className="pl-9"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Lista de produtos */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Produtos</h2>
        {filteredProducts.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <Package className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhum produto encontrado</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredProducts.map((p: any) => {
              const stock = p.stock ?? 0;
              const min   = p.minStock ?? 5;
              const low   = stock <= min;
              const pct   = min > 0 ? Math.min(100, (stock / (min * 3)) * 100) : 100;
              return (
                <div
                  key={p.id}
                  className={cn(
                    "bg-card border rounded-xl px-4 py-3 flex items-center gap-3",
                    low ? "border-amber-200 bg-amber-50/30" : "border-border"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all", low ? "bg-amber-400" : "bg-emerald-500")}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className={cn("text-xs font-semibold shrink-0", low ? "text-amber-600" : "text-emerald-600")}>
                        {stock} un
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => openAdjust(p)}
                    className="shrink-0 w-8 h-8 rounded-lg bg-primary/10 hover:bg-primary/20 flex items-center justify-center text-primary transition-colors"
                  >
                    <ArrowDownUp className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Histórico de movimentos */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Histórico de Movimentos</h2>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : movements.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <Package className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhum movimento registrado</p>
          </div>
        ) : (
          <div className="space-y-2">
            {movements.map((m: any) => {
              const meta = MOV_META[m.type] ?? MOV_META.in;
              const Icon = meta.icon;
              return (
                <div key={m.id} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", meta.bg)}>
                    <Icon className={cn("w-4 h-4", meta.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{m.productName}</p>
                    <p className="text-xs text-muted-foreground">
                      {meta.label} · {m.before} → <span className="font-semibold text-foreground">{m.after}</span>
                      {m.reason && ` · ${m.reason}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn("text-sm font-bold", m.type === "out" ? "text-rose-600" : "text-emerald-600")}>
                      {m.type === "out" ? "-" : "+"}{Math.abs(m.quantity)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(m.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de ajuste */}
      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Ajustar Estoque</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {/* Produto */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Produto *</label>
              <select
                value={form.productId}
                onChange={e => {
                  const p = allProducts.find((x: any) => x.id === e.target.value);
                  setForm(f => ({ ...f, productId: e.target.value, productName: (p as any)?.name ?? "" }));
                }}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="">Selecione o produto</option>
                {trackedProducts.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name} (atual: {p.stock ?? 0})</option>
                ))}
              </select>
            </div>

            {/* Tipo */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Tipo *</label>
              <div className="grid grid-cols-2 gap-2">
                {TYPE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setForm(f => ({ ...f, type: opt.value as AdjustForm["type"] }))}
                    className={cn(
                      "py-2 rounded-lg border text-sm font-medium transition-all",
                      form.type === opt.value
                        ? "bg-primary text-white border-primary"
                        : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/60"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantidade */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Quantidade *</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setForm(f => ({ ...f, quantity: String(Math.max(0, Number(f.quantity) - 1)) }))}
                  className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <Input
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                  placeholder="0"
                  className="text-center text-lg font-bold"
                />
                <button
                  onClick={() => setForm(f => ({ ...f, quantity: String(Number(f.quantity) + 1) }))}
                  className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Motivo */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Motivo</label>
              <Input
                value={form.reason}
                onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                placeholder="Ex: Compra do fornecedor..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustOpen(false)}>Cancelar</Button>
            <Button
              disabled={!form.productId || !form.quantity || adjustMut.isPending}
              onClick={() => adjustMut.mutate({
                productId: form.productId,
                type: form.type,
                quantity: Number(form.quantity),
                reason: form.reason || undefined,
              })}
            >
              {adjustMut.isPending ? "Salvando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
