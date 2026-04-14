"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, TrendingUp, TrendingDown, DollarSign, CheckCircle, Lock, Unlock } from "lucide-react";
import { api } from "@/components/providers/trpc-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectItem } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";

type TxForm = { type: "income" | "expense"; category: string; description: string; amount: string; dueDate: string };
const emptyForm: TxForm = { type: "income", category: "other", description: "", amount: "", dueDate: "" };

const STATUS_VARIANTS: Record<string, "success" | "warning" | "destructive" | "outline"> = {
  paid: "success", pending: "warning", overdue: "destructive", cancelled: "outline",
};
const STATUS_LABELS: Record<string, string> = { paid: "Pago", pending: "Pendente", overdue: "Vencido", cancelled: "Cancelado" };
const CAT_LABELS: Record<string, string> = { sales: "Vendas", purchase: "Compras", salary: "Salário", tax: "Impostos", other: "Outros" };

export default function FinanceiroPage() {
  const [tab, setTab] = useState("all");
  const [txOpen, setTxOpen] = useState(false);
  const [caixaFloat, setCaixaFloat] = useState("");
  const [form, setForm] = useState<TxForm>(emptyForm);
  const utils = api.useUtils();

  const now = new Date();
  const { data: summary } = api.financial.getMonthlySummary.useQuery({ year: now.getFullYear(), month: now.getMonth() + 1 });
  const { data: session } = api.financial.getCurrentSession.useQuery();
  const { data: transactions = [], isLoading } = api.financial.listTransactions.useQuery({
    type: tab === "income" ? "income" : tab === "expense" ? "expense" : undefined,
    status: tab === "pending" ? "pending" : undefined,
    limit: 50,
  });

  const createTxMut = api.financial.createTransaction.useMutation({
    onSuccess: () => { utils.financial.listTransactions.invalidate(); utils.financial.getMonthlySummary.invalidate(); toast.success("Transação criada!"); setTxOpen(false); setForm(emptyForm); },
    onError: (e) => toast.error(e.message),
  });

  const markPaidMut = api.financial.markPaid.useMutation({
    onSuccess: () => { utils.financial.listTransactions.invalidate(); utils.financial.getMonthlySummary.invalidate(); toast.success("Marcado como pago!"); },
    onError: (e) => toast.error(e.message),
  });

  const openCaixaMut = api.financial.openCashSession.useMutation({
    onSuccess: () => { utils.financial.getCurrentSession.invalidate(); toast.success("Caixa aberto!"); setCaixaFloat(""); },
    onError: (e) => toast.error(e.message),
  });

  const closeCaixaMut = api.financial.closeCashSession.useMutation({
    onSuccess: () => { utils.financial.getCurrentSession.invalidate(); toast.success("Caixa fechado!"); },
    onError: (e) => toast.error(e.message),
  });

  const income  = summary?.income  ?? 0;
  const expense = summary?.expense ?? 0;
  const balance = summary?.balance ?? 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Financeiro</h1>
          <p className="text-sm text-muted-foreground">Resumo de {now.toLocaleString("pt-BR", { month: "long", year: "numeric" })}</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setTxOpen(true); }}>
          <Plus className="h-4 w-4" /> Nova Transação
        </Button>
      </div>

      {/* Resumo mensal */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" /> Receitas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(income)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" /> Despesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(expense)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" /> Saldo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${balance >= 0 ? "text-primary" : "text-red-600"}`}>{formatCurrency(balance)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Caixa */}
      <Card className={`border-2 ${session ? "border-emerald-200 bg-emerald-50/30" : "border-border"}`}>
        <CardContent className="p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {session ? <Unlock className="h-5 w-5 text-emerald-500" /> : <Lock className="h-5 w-5 text-muted-foreground" />}
            <div>
              <p className="font-semibold text-sm">{session ? "Caixa Aberto" : "Caixa Fechado"}</p>
              {session && (
                <p className="text-xs text-muted-foreground">
                  Aberto às {new Date(session.openedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  {" · "}Troco inicial: {formatCurrency(Number(session.openingBalance))}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!session && (
              <Input
                type="number"
                className="w-32"
                placeholder="Troco R$"
                value={caixaFloat}
                onChange={e => setCaixaFloat(e.target.value)}
              />
            )}
            {session ? (
              <Button variant="outline" size="sm" onClick={() => closeCaixaMut.mutate({ closingBalance: 0 })} disabled={closeCaixaMut.isPending}>
                Fechar Caixa
              </Button>
            ) : (
              <Button size="sm" onClick={() => openCaixaMut.mutate({ openingBalance: Number(caixaFloat) || 0 })} disabled={openCaixaMut.isPending}>
                Abrir Caixa
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transações */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="income">Receitas</TabsTrigger>
          <TabsTrigger value="expense">Despesas</TabsTrigger>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
        </TabsList>
        <TabsContent value={tab}>
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 rounded-xl bg-muted animate-pulse" />)}</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <DollarSign className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhuma transação encontrada</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-border overflow-hidden bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map(tx => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-medium">{tx.description}</TableCell>
                      <TableCell><Badge variant="outline">{CAT_LABELS[tx.category] ?? tx.category}</Badge></TableCell>
                      <TableCell>
                        <span className={`text-sm font-medium ${tx.type === "income" ? "text-emerald-600" : "text-red-600"}`}>
                          {tx.type === "income" ? "Receita" : "Despesa"}
                        </span>
                      </TableCell>
                      <TableCell className={`font-bold ${tx.type === "income" ? "text-emerald-600" : "text-red-600"}`}>
                        {tx.type === "expense" ? "−" : "+"}{formatCurrency(Number(tx.amount))}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {tx.dueDate ? formatDate(tx.dueDate) : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANTS[tx.status] ?? "outline"}>
                          {STATUS_LABELS[tx.status] ?? tx.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {tx.status === "pending" && (
                          <button onClick={() => markPaidMut.mutate({ id: tx.id })} className="p-1.5 rounded-lg hover:bg-emerald-50 text-muted-foreground hover:text-emerald-600 transition-colors" title="Marcar como pago">
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog Nova Transação */}
      <Dialog open={txOpen} onOpenChange={setTxOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Transação</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tipo *</Label>
                <Select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as "income" | "expense" }))}>
                  <SelectItem value="income">Receita</SelectItem>
                  <SelectItem value="expense">Despesa</SelectItem>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Categoria</Label>
                <Select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  <SelectItem value="sales">Vendas</SelectItem>
                  <SelectItem value="purchase">Compras</SelectItem>
                  <SelectItem value="salary">Salário</SelectItem>
                  <SelectItem value="tax">Impostos</SelectItem>
                  <SelectItem value="other">Outros</SelectItem>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Descrição *</Label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descrição da transação" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Valor (R$) *</Label>
                <Input type="number" min="0.01" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0,00" />
              </div>
              <div className="space-y-1.5">
                <Label>Vencimento</Label>
                <Input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTxOpen(false)}>Cancelar</Button>
            <Button
              disabled={!form.description || !form.amount || createTxMut.isPending}
              onClick={() => createTxMut.mutate({ ...form, amount: Number(form.amount), category: form.category as "sales" | "purchase" | "salary" | "tax" | "other", dueDate: form.dueDate || undefined })}
            >
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
