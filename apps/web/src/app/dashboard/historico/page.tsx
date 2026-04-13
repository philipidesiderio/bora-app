"use client";
import { useState } from "react";
import { History } from "lucide-react";
import { api } from "@/components/providers/trpc-provider";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDatetime } from "@/lib/utils";

const STATUS_VARIANTS: Record<string, "warning" | "info" | "success" | "destructive" | "outline"> = {
  pending: "warning", confirmed: "info", preparing: "warning",
  ready: "success", delivered: "success", cancelled: "destructive",
};
const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente", confirmed: "Confirmado", preparing: "Preparando",
  ready: "Pronto", delivered: "Entregue", cancelled: "Cancelado",
};
const CHANNEL_LABELS: Record<string, string> = { pdv: "PDV", online: "Online", whatsapp: "WhatsApp" };

export default function HistoricoPage() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: orders = [], isLoading } = api.orders.list.useQuery({
    limit: 100,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Histórico de Vendas</h1>
        <p className="text-sm text-muted-foreground">{orders.length} registros encontrados</p>
      </div>

      <div className="flex items-end gap-3 flex-wrap">
        <div className="space-y-1.5">
          <Label>De</Label>
          <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-40" />
        </div>
        <div className="space-y-1.5">
          <Label>Até</Label>
          <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-40" />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-12 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <History className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhuma venda no período</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border overflow-hidden bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Subtotal</TableHead>
                <TableHead>Desconto</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map(o => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono font-semibold">#{o.number}</TableCell>
                  <TableCell><Badge variant="outline">{CHANNEL_LABELS[o.channel] ?? o.channel}</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-sm">{o.items.length}</TableCell>
                  <TableCell className="text-muted-foreground">{formatCurrency(Number(o.subtotal))}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {Number(o.discount) > 0 ? `−${formatCurrency(Number(o.discount))}` : "—"}
                  </TableCell>
                  <TableCell className="font-bold">{formatCurrency(Number(o.total))}</TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground capitalize">
                      {o.paymentMethod === "pix" ? "PIX" : o.paymentMethod === "cash" ? "Dinheiro" :
                       o.paymentMethod === "credit" ? "Crédito" : o.paymentMethod === "debit" ? "Débito" : o.paymentMethod}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANTS[o.status] ?? "outline"}>
                      {STATUS_LABELS[o.status] ?? o.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatDatetime(o.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
