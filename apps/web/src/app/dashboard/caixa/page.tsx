"use client";
import { useState } from "react";
import { api } from "@/components/providers/trpc-provider";
import { toast } from "sonner";
import { formatCurrency, cn } from "@/lib/utils";
import { Wallet, ArrowDownLeft, ArrowUpRight, XCircle, CheckCircle2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold", color)}>{children}</span>;
}

const ACTION_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  "opening":       { label: "Abertura",      icon: "🔓", color: "text-emerald-600" },
  "closing":       { label: "Fechamento",     icon: "🔒", color: "text-rose-600"    },
  "cash-in":       { label: "Entrada",        icon: "⬇️", color: "text-emerald-600" },
  "cash-out":      { label: "Saída",          icon: "⬆️", color: "text-rose-600"    },
  "order-payment": { label: "Venda",          icon: "🛒", color: "text-primary"     },
  "refund":        { label: "Reembolso",      icon: "↩️", color: "text-amber-600"   },
};

export default function CaixaPage() {
  const utils = api.useUtils();

  const { data: registers = [], isLoading } = api.registers.list.useQuery();

  const [selected, setSelected]         = useState<string | null>(null);
  const [openAmount, setOpenAmount]     = useState("");
  const [closeAmount, setCloseAmount]   = useState("");
  const [cashValue, setCashValue]       = useState("");
  const [cashDesc, setCashDesc]         = useState("");
  const [newRegName, setNewRegName]     = useState("");
  const [showNewReg, setShowNewReg]     = useState(false);

  const selectedReg = registers.find((r: any) => r.id === selected) ?? registers[0] ?? null;

  const { data: history = [] } = api.registers.getHistory.useQuery(
    { registerId: selectedReg?.id ?? "", limit: 30 },
    { enabled: !!selectedReg }
  );

  const { data: zReport } = api.registers.getZReport.useQuery(
    { registerId: selectedReg?.id ?? "" },
    { enabled: !!selectedReg }
  );

  const invalidate = () => { utils.registers.list.invalidate(); utils.registers.getHistory.invalidate(); utils.registers.getZReport.invalidate(); };

  const createReg = api.registers.create.useMutation({
    onSuccess: () => { toast.success("Caixa criado!"); setNewRegName(""); setShowNewReg(false); invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const openReg  = api.registers.open.useMutation({
    onSuccess: () => { toast.success("Caixa aberto!"); setOpenAmount(""); invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const closeReg = api.registers.close.useMutation({
    onSuccess: (data) => { toast.success(`Caixa fechado! Variação: ${formatCurrency(data.variance ?? 0)}`); setCloseAmount(""); invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const cashIn  = api.registers.cashIn.useMutation({
    onSuccess: () => { toast.success("Entrada registrada!"); setCashValue(""); setCashDesc(""); invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const cashOut = api.registers.cashOut.useMutation({
    onSuccess: () => { toast.success("Saída registrada!"); setCashValue(""); setCashDesc(""); invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <div className="flex items-center justify-center h-48 text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl">Caixa</h1>
          <p className="text-sm text-muted-foreground">Abertura, fechamento e movimentações</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowNewReg(v => !v)}>
          <Plus className="h-4 w-4 mr-1" />Novo caixa
        </Button>
      </div>

      {/* Criar novo caixa */}
      {showNewReg && (
        <div className="flex gap-2 p-4 bg-card border border-border rounded-2xl">
          <Input placeholder="Nome do caixa..." value={newRegName} onChange={e => setNewRegName(e.target.value)} className="flex-1" />
          <Button onClick={() => createReg.mutate({ name: newRegName })} disabled={!newRegName || createReg.isPending}>Criar</Button>
        </div>
      )}

      {registers.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Wallet className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">Nenhum caixa cadastrado</p>
          <p className="text-sm mt-1">Crie um caixa para começar</p>
        </div>
      )}

      {/* Seletor de caixa */}
      {registers.length > 1 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {registers.map((r: any) => (
            <button key={r.id} onClick={() => setSelected(r.id)}
              className={cn(
                "flex-shrink-0 px-4 py-2 rounded-xl border text-sm font-semibold transition-all",
                (selected ?? registers[0]?.id) === r.id ? "bg-primary text-white border-primary" : "bg-card border-border text-muted-foreground"
              )}>
              {r.name}
            </button>
          ))}
        </div>
      )}

      {selectedReg && (
        <>
          {/* Status card */}
          <div className={cn(
            "rounded-2xl p-5 border",
            selectedReg.status === "opened" ? "bg-emerald-50 border-emerald-200" : "bg-card border-border"
          )}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="font-heading font-bold text-lg">{selectedReg.name}</h2>
                  <Badge color={selectedReg.status === "opened" ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}>
                    {selectedReg.status === "opened" ? "Aberto" : "Fechado"}
                  </Badge>
                </div>
                {selectedReg.status === "opened" && (
                  <p className="text-3xl font-bold font-mono text-emerald-700">{formatCurrency(Number(selectedReg.balance))}</p>
                )}
              </div>
              {selectedReg.status === "opened"
                ? <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                : <XCircle className="h-8 w-8 text-muted-foreground" />}
            </div>

            {/* Actions */}
            {selectedReg.status === "closed" ? (
              <div className="mt-4 flex items-end gap-3">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">Valor de abertura</label>
                  <Input type="number" step="0.01" min="0" placeholder="0,00" value={openAmount} onChange={e => setOpenAmount(e.target.value)} className="h-10" />
                </div>
                <Button className="h-10 px-6" onClick={() => openReg.mutate({ registerId: selectedReg.id, openingAmount: Number(openAmount) })} disabled={openReg.isPending}>
                  Abrir caixa
                </Button>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {/* Entrada / Saída */}
                <div className="flex gap-2">
                  <Input type="number" step="0.01" min="0" placeholder="Valor..." value={cashValue} onChange={e => setCashValue(e.target.value)} className="flex-1 h-9" />
                  <Input placeholder="Descrição..." value={cashDesc} onChange={e => setCashDesc(e.target.value)} className="flex-1 h-9" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => cashIn.mutate({ registerId: selectedReg.id, amount: Number(cashValue), description: cashDesc })}
                    disabled={!cashValue || cashIn.isPending}
                    className="flex-1 h-10 rounded-xl bg-emerald-100 text-emerald-700 font-semibold text-sm border border-emerald-200 flex items-center justify-center gap-1.5 disabled:opacity-50">
                    <ArrowDownLeft className="h-4 w-4" />Entrada
                  </button>
                  <button onClick={() => cashOut.mutate({ registerId: selectedReg.id, amount: Number(cashValue), description: cashDesc })}
                    disabled={!cashValue || cashOut.isPending}
                    className="flex-1 h-10 rounded-xl bg-rose-100 text-rose-700 font-semibold text-sm border border-rose-200 flex items-center justify-center gap-1.5 disabled:opacity-50">
                    <ArrowUpRight className="h-4 w-4" />Saída
                  </button>
                </div>
                {/* Fechar caixa */}
                <div className="flex items-end gap-3 pt-1 border-t border-border">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1 block">Valor contado (para fechamento)</label>
                    <Input type="number" step="0.01" min="0" placeholder="0,00" value={closeAmount} onChange={e => setCloseAmount(e.target.value)} className="h-9" />
                  </div>
                  <Button variant="outline" className="h-9 border-rose-300 text-rose-600 hover:bg-rose-50"
                    onClick={() => closeReg.mutate({ registerId: selectedReg.id, countedAmount: Number(closeAmount) })}
                    disabled={!closeAmount || closeReg.isPending}>
                    Fechar caixa
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Z-Report summary */}
          {zReport && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Abertura",   value: zReport.openingAmount,   color: "text-foreground" },
                { label: "Vendas",     value: zReport.salesTotal,      color: "text-emerald-600" },
                { label: "Saídas",     value: zReport.cashOuts,        color: "text-rose-600" },
                { label: "Esperado",   value: zReport.expectedBalance, color: "text-primary" },
              ].map(card => (
                <div key={card.label} className="bg-card border border-border rounded-2xl p-4">
                  <p className="text-xs text-muted-foreground mb-1">{card.label}</p>
                  <p className={cn("text-lg font-bold font-mono", card.color)}>{formatCurrency(card.value)}</p>
                </div>
              ))}
            </div>
          )}

          {/* History */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border font-semibold text-sm">Movimentações</div>
            {history.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground text-sm">Nenhuma movimentação ainda</div>
            ) : (
              <div className="divide-y divide-border">
                {history.map((h: any) => {
                  const meta = ACTION_LABELS[h.action] ?? { label: h.action, icon: "•", color: "text-foreground" };
                  return (
                    <div key={h.id} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{meta.icon}</span>
                        <div>
                          <p className="text-sm font-semibold">{meta.label}</p>
                          {h.description && <p className="text-xs text-muted-foreground">{h.description}</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn("font-mono font-bold text-sm", meta.color)}>{formatCurrency(Number(h.value))}</p>
                        <p className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
