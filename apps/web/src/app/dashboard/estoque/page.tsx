"use client";
import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Package, ArrowDownUp } from "lucide-react";
import { api } from "@/components/providers/trpc-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectItem } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

type AdjustForm = { productId: string; productName: string; type: "in" | "out" | "adjustment" | "return"; quantity: string; reason: string };

const MOV_LABELS: Record<string, string> = { in: "Entrada", out: "Saída", adjustment: "Ajuste", return: "Devolução" };
const MOV_VARIANTS: Record<string, "success" | "destructive" | "info" | "warning"> = {
  in: "success", out: "destructive", adjustment: "info", return: "warning",
};

export default function EstoquePage() {
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [form, setForm] = useState<AdjustForm>({ productId: "", productName: "", type: "in", quantity: "", reason: "" });
  const utils = api.useUtils();

  const { data: lowStock = [] } = api.inventory.getLowStock.useQuery();
  const { data: movements = [], isLoading } = api.inventory.list.useQuery({ limit: 50 });
  const { data: allProducts = [] } = api.products.list.useQuery({ limit: 200 });

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

  function openAdjust(p?: typeof allProducts[0]) {
    setForm({ productId: p?.id ?? "", productName: p?.name ?? "", type: "in", quantity: "", reason: "" });
    setAdjustOpen(true);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Estoque</h1>
          <p className="text-sm text-muted-foreground">Gerencie entradas, saídas e ajustes</p>
        </div>
        <Button onClick={() => openAdjust()}><ArrowDownUp className="h-4 w-4" /> Ajustar Estoque</Button>
      </div>

      {lowStock.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-amber-600 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4" /> {lowStock.length} produto(s) com estoque baixo
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStock.map(p => (
              <Card key={p.id} className="p-4 border-amber-200 bg-amber-50/50">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-sm truncate">{p.name}</p>
                  <Badge variant="warning">{p.stock ?? 0} un</Badge>
                </div>
                <Progress value={p.stock ?? 0} max={p.minStock ?? 5} className="h-1.5" />
                <p className="text-xs text-muted-foreground mt-1">Mínimo: {p.minStock ?? 5} un</p>
                <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => openAdjust(p)}>
                  Repor estoque
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="font-heading font-bold text-lg">Todos os Produtos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {allProducts.map(p => {
            if (!p.trackStock) return null;
            const stock = p.stock ?? 0;
            const min = p.minStock ?? 5;
            const pct = min > 0 ? Math.min(100, (stock / (min * 3)) * 100) : 100;
            const low = stock <= min;
            return (
              <Card key={p.id} className="p-3 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{p.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={low ? "destructive" : "success"}>{stock} un</Badge>
                    <span className="text-xs text-muted-foreground">Mín: {min}</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => openAdjust(p)}>Ajustar</Button>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-heading font-bold text-lg">Histórico de Movimentos</h2>
        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 rounded-xl bg-muted animate-pulse" />)}</div>
        ) : movements.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <Package className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhum movimento registrado</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border overflow-hidden bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Qtd</TableHead>
                  <TableHead>Antes</TableHead>
                  <TableHead>Depois</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map(m => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.productName}</TableCell>
                    <TableCell>
                      <Badge variant={MOV_VARIANTS[m.type] ?? "outline"}>{MOV_LABELS[m.type] ?? m.type}</Badge>
                    </TableCell>
                    <TableCell className="font-mono">{m.quantity}</TableCell>
                    <TableCell className="text-muted-foreground">{m.before}</TableCell>
                    <TableCell className="font-semibold">{m.after}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{m.reason ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(m.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ajustar Estoque</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Produto *</Label>
              <Select
                value={form.productId}
                onChange={e => {
                  const p = allProducts.find(x => x.id === e.target.value);
                  setForm(f => ({ ...f, productId: e.target.value, productName: p?.name ?? "" }));
                }}
                placeholder="Selecione o produto"
              >
                {allProducts.filter(p => p.trackStock).map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name} (atual: {p.stock ?? 0})</SelectItem>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tipo *</Label>
                <Select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as typeof form.type }))}>
                  <SelectItem value="in">Entrada</SelectItem>
                  <SelectItem value="out">Saída</SelectItem>
                  <SelectItem value="adjustment">Ajuste (absoluto)</SelectItem>
                  <SelectItem value="return">Devolução</SelectItem>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Quantidade *</Label>
                <Input type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} placeholder="0" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Motivo</Label>
              <Input value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="Ex: Compra do fornecedor..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustOpen(false)}>Cancelar</Button>
            <Button
              disabled={!form.productId || !form.quantity || adjustMut.isPending}
              onClick={() => adjustMut.mutate({ productId: form.productId, type: form.type, quantity: Number(form.quantity), reason: form.reason || undefined })}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
