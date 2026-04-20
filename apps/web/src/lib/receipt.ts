// Helpers para gerar recibo (impressão + WhatsApp)

type ReceiptItem = {
  name: string;
  quantity: number | string;
  unit_price?: number | string;
  total: number | string;
};

type ReceiptPayment = {
  method: string;
  amount: number | string;
};

export type ReceiptOrder = {
  number: number | string;
  total: number | string;
  subtotal?: number | string;
  discount?: number | string;
  created_at?: string;
  notes?: string | null;
  payment_status?: string;
  status?: string;
  items?: ReceiptItem[] | null;
  payments?: ReceiptPayment[] | null;
  customer?: { name?: string | null; phone?: string | null } | null;
  metadata?: any;
};

const METHOD_LABELS: Record<string, string> = {
  pix: "PIX", cash: "Dinheiro", credit: "Crédito",
  debit: "Débito", account: "Em aberto", voucher: "Voucher",
};

function money(v: number | string | undefined) {
  const n = Number(v ?? 0);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function buildReceiptText(o: ReceiptOrder, businessName = "") {
  const lines: string[] = [];
  if (businessName) { lines.push(`*${businessName}*`); lines.push(""); }
  lines.push(`*Recibo — Pedido #${o.number}*`);
  if (o.created_at) {
    lines.push(new Date(o.created_at).toLocaleString("pt-BR"));
  }
  if (o.customer?.name) lines.push(`Cliente: ${o.customer.name}`);
  lines.push("");
  lines.push("*Itens:*");
  for (const it of o.items ?? []) {
    lines.push(`• ${it.quantity}× ${it.name} — ${money(it.total)}`);
  }
  lines.push("");
  if (o.subtotal !== undefined) lines.push(`Subtotal: ${money(o.subtotal)}`);
  if (Number(o.discount ?? 0) > 0) lines.push(`Desconto: -${money(o.discount)}`);
  const fee = o.metadata?.delivery?.fee;
  if (fee && Number(fee) > 0) lines.push(`Entrega: +${money(fee)}`);
  lines.push(`*Total: ${money(o.total)}*`);
  if ((o.payments ?? []).length > 0) {
    lines.push("");
    lines.push("*Pagamentos:*");
    for (const p of o.payments!) {
      lines.push(`  ${METHOD_LABELS[p.method] ?? p.method}: ${money(p.amount)}`);
    }
  }
  const addr     = o.metadata?.delivery?.address;
  const expected = o.metadata?.delivery?.expectedAt;
  if (expected) {
    lines.push("");
    lines.push(`Previsão de entrega: ${new Date(expected).toLocaleString("pt-BR")}`);
  }
  if (addr) { lines.push(""); lines.push(`Endereço: ${addr}`); }
  if (o.notes) { lines.push(""); lines.push(`Obs.: ${o.notes}`); }
  lines.push("");
  lines.push("Obrigado pela preferência!");
  return lines.join("\n");
}

export function buildReceiptHtml(o: ReceiptOrder, businessName = "") {
  const esc = (s: any) => String(s ?? "").replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!));
  const itemsRows = (o.items ?? [])
    .map(it => `<tr><td>${esc(it.quantity)}× ${esc(it.name)}</td><td style="text-align:right">${money(it.total)}</td></tr>`)
    .join("");
  const paymentsRows = (o.payments ?? [])
    .map(p => `<tr><td>${esc(METHOD_LABELS[p.method] ?? p.method)}</td><td style="text-align:right">${money(p.amount)}</td></tr>`)
    .join("");
  const feeRow = Number(o.metadata?.delivery?.fee ?? 0) > 0
    ? `<tr><td>Entrega</td><td style="text-align:right">+${money(o.metadata.delivery.fee)}</td></tr>` : "";
  const addr     = o.metadata?.delivery?.address;
  const expected = o.metadata?.delivery?.expectedAt;

  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Recibo #${esc(o.number)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; max-width: 380px; margin: 16px auto; padding: 0 12px; font-size: 13px; color: #111; }
  h1 { font-size: 16px; margin: 0 0 4px; }
  h2 { font-size: 13px; margin: 14px 0 6px; border-bottom: 1px dashed #ccc; padding-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 3px 0; vertical-align: top; }
  .muted { color: #666; font-size: 11px; }
  .total { font-weight: bold; font-size: 15px; border-top: 1px solid #000; padding-top: 6px; }
  .center { text-align: center; }
  @media print { body { margin: 0; } .no-print { display: none; } }
</style></head><body>
  <div class="center">
    ${businessName ? `<h1>${esc(businessName)}</h1>` : ""}
    <div class="muted">Recibo — Pedido #${esc(o.number)}</div>
    ${o.created_at ? `<div class="muted">${esc(new Date(o.created_at).toLocaleString("pt-BR"))}</div>` : ""}
  </div>
  ${o.customer?.name ? `<p><strong>Cliente:</strong> ${esc(o.customer.name)}${o.customer.phone ? ` · ${esc(o.customer.phone)}` : ""}</p>` : ""}
  <h2>Itens</h2>
  <table>${itemsRows}</table>
  <h2>Resumo</h2>
  <table>
    ${o.subtotal !== undefined ? `<tr><td>Subtotal</td><td style="text-align:right">${money(o.subtotal)}</td></tr>` : ""}
    ${Number(o.discount ?? 0) > 0 ? `<tr><td>Desconto</td><td style="text-align:right">-${money(o.discount)}</td></tr>` : ""}
    ${feeRow}
    <tr class="total"><td>Total</td><td style="text-align:right">${money(o.total)}</td></tr>
  </table>
  ${paymentsRows ? `<h2>Pagamentos</h2><table>${paymentsRows}</table>` : ""}
  ${expected ? `<h2>Previsão de entrega</h2><p>${esc(new Date(expected).toLocaleString("pt-BR"))}</p>` : ""}
  ${addr ? `<h2>Endereço de entrega</h2><p>${esc(addr)}</p>` : ""}
  ${o.notes ? `<h2>Observações</h2><p>${esc(o.notes)}</p>` : ""}
  <p class="center muted" style="margin-top:18px;">Obrigado pela preferência!</p>
  <div class="no-print center" style="margin-top:16px;">
    <button onclick="window.print()">Imprimir</button>
  </div>
  <script>setTimeout(() => window.print(), 300);</script>
</body></html>`;
}

export function printReceipt(o: ReceiptOrder, businessName = "") {
  const html = buildReceiptHtml(o, businessName);
  const w = window.open("", "_blank", "width=420,height=640");
  if (!w) return false;
  w.document.open();
  w.document.write(html);
  w.document.close();
  return true;
}

// Remove tudo que não for dígito e garante prefixo 55 (Brasil)
function normalizePhone(phone: string) {
  const digits = phone.replace(/\D+/g, "");
  if (!digits) return "";
  return digits.startsWith("55") ? digits : `55${digits}`;
}

export function whatsappUrl(phone: string | null | undefined, text: string) {
  const p = normalizePhone(phone ?? "");
  const encoded = encodeURIComponent(text);
  return p ? `https://wa.me/${p}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
}

export function sendWhatsappReceipt(o: ReceiptOrder, businessName = "") {
  const text = buildReceiptText(o, businessName);
  const url  = whatsappUrl(o.customer?.phone, text);
  window.open(url, "_blank");
}
