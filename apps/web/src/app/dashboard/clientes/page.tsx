"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Search, Users, Phone } from "lucide-react";
import { api } from "@/components/providers/trpc-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { formatCurrency, getInitials } from "@/lib/utils";

type ClienteForm = { name: string; phone: string; email: string; cpf: string; creditLimit: string; notes: string };
const emptyForm: ClienteForm = { name: "", phone: "", email: "", cpf: "", creditLimit: "0", notes: "" };

export default function ClientesPage() {
  const [search, setSearch] = useState("");
  const [openNew, setOpenNew] = useState(false);
  const [creditOpen, setCreditOpen] = useState<{ id: string; name: string; mode: "add" | "pay" } | null>(null);
  const [creditAmount, setCreditAmount] = useState("");
  const [form, setForm] = useState<ClienteForm>(emptyForm);
  const utils = api.useUtils();

  const { data: clientes = [], isLoading } = api.customers.list.useQuery({ search, limit: 50 });

  const createMut = api.customers.create.useMutation({
    onSuccess: () => { utils.customers.list.invalidate(); toast.success("Cliente criado!"); setOpenNew(false); setForm(emptyForm); },
    onError: (e) => toast.error(e.message),
  });

  const addCreditMut = api.customers.addCredit.useMutation({
    onSuccess: () => { utils.customers.list.invalidate(); toast.success("Fiado registrado!"); setCreditOpen(null); setCreditAmount(""); },
    onError: (e) => toast.error(e.message),
  });

  const payCreditMut = api.customers.payCredit.useMutation({
    onSuccess: () => { utils.customers.list.invalidate(); toast.success("Pagamento registrado!"); setCreditOpen(null); setCreditAmount(""); },
    onError: (e) => toast.error(e.message),
  });

  function handleCreditSubmit() {
    if (!creditOpen || !creditAmount) return;
    const amount = Number(creditAmount);
    if (creditOpen.mode === "add") addCreditMut.mutate({ customerId: creditOpen.id, amount });
    else payCreditMut.mutate({ customerId: creditOpen.id, amount });
  }

  return (
    <div className="space-y-5 pb-28 md:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Clientes</h1>
          <p className="text-sm text-muted-foreground">{clientes.length} clientes cadastrados</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setOpenNew(true); }}>
          <Plus className="h-4 w-4" /> Novo Cliente
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome ou telefone..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-36 rounded-2xl bg-muted animate-pulse" />)}
        </div>
      ) : clientes.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhum cliente encontrado</p>
          <p className="text-sm mt-1">Clique em "Novo Cliente" para começar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clientes.map(c => {
            const balance = Number(c.creditBalance);
            const hasDebt = balance > 0;
            return (
              <Card key={c.id} className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                    {getInitials(c.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{c.name}</p>
                    {c.phone && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Phone className="h-3 w-3" /> {c.phone}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-border/50">
                  <div>
                    <p className="text-xs text-muted-foreground">Fiado</p>
                    <Badge variant={hasDebt ? "destructive" : "success"} className="mt-0.5">
                      {hasDebt ? `Deve ${formatCurrency(balance)}` : "Em dia"}
                    </Badge>
                  </div>
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => { setCreditOpen({ id: c.id, name: c.name, mode: "add" }); setCreditAmount(""); }}>
                      + Fiado
                    </Button>
                    {hasDebt && (
                      <Button size="sm" onClick={() => { setCreditOpen({ id: c.id, name: c.name, mode: "pay" }); setCreditAmount(""); }}>
                        Receber
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog Novo Cliente */}
      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Cliente</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome completo" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Telefone</Label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(11) 99999-9999" />
              </div>
              <div className="space-y-1.5">
                <Label>CPF</Label>
                <Input value={form.cpf} onChange={e => setForm(f => ({ ...f, cpf: e.target.value }))} placeholder="000.000.000-00" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemplo.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Limite de crédito (fiado)</Label>
              <Input type="number" value={form.creditLimit} onChange={e => setForm(f => ({ ...f, creditLimit: e.target.value }))} placeholder="0,00" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNew(false)}>Cancelar</Button>
            <Button disabled={!form.name || createMut.isPending} onClick={() => createMut.mutate({ ...form, creditLimit: Number(form.creditLimit) })}>
              Criar Cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Fiado / Receber */}
      <Dialog open={!!creditOpen} onOpenChange={v => !v && setCreditOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{creditOpen?.mode === "add" ? "Registrar Fiado" : "Receber Pagamento"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Cliente: <span className="font-medium text-foreground">{creditOpen?.name}</span></p>
            <div className="space-y-1.5">
              <Label>Valor (R$) *</Label>
              <Input type="number" min="0.01" step="0.01" value={creditAmount} onChange={e => setCreditAmount(e.target.value)} placeholder="0,00" autoFocus />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreditOpen(null)}>Cancelar</Button>
            <Button
              disabled={!creditAmount || addCreditMut.isPending || payCreditMut.isPending}
              onClick={handleCreditSubmit}
              variant={creditOpen?.mode === "add" ? "destructive" : "default"}
            >
              {creditOpen?.mode === "add" ? "Registrar Fiado" : "Confirmar Pagamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
