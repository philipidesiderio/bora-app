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

export type ReceiptBusiness = {
  name?:        string | null;
  phone?:       string | null;
  cnpj?:        string | null;
  description?: string | null;
  address?:     string | null;
  city?:        string | null;
  state?:       string | null;
  receipt_settings?: {
    showPhone?:       boolean;
    showCnpj?:        boolean;
    showAddress?:     boolean;
    showDescription?: boolean;
    footerNote?:      string;
  } | null;
};

const METHOD_LABELS: Record<string, string> = {
  pix: "PIX", cash: "Dinheiro", credit: "Crédito",
  debit: "Débito", account: "Em aberto", voucher: "Voucher",
};

function money(v: number | string | undefined) {
  const n = Number(v ?? 0);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Aceita string (compat. antiga) ou objeto business.
function normalizeBusiness(b: string | ReceiptBusiness | null | undefined): ReceiptBusiness {
  if (!b) return {};
  if (typeof b === "string") return { name: b };
  return b;
}

function buildAddressLine(b: ReceiptBusiness): string {
  const parts: string[] = [];
  if (b.address) parts.push(b.address);
  const cityUf = [b.city, b.state].filter(Boolean).join("/");
  if (cityUf) parts.push(cityUf);
  return parts.join(" — ");
}

function getSettings(b: ReceiptBusiness) {
  return {
    showPhone:       b.receipt_settings?.showPhone       ?? true,
    showCnpj:        b.receipt_settings?.showCnpj        ?? true,
    showAddress:     b.receipt_settings?.showAddress     ?? true,
    showDescription: b.receipt_settings?.showDescription ?? false,
    footerNote:      b.receipt_settings?.footerNote      ?? "",
  };
}

export function buildReceiptText(o: ReceiptOrder, business: string | ReceiptBusiness = "") {
  const b = normalizeBusiness(business);
  const s = getSettings(b);
  const lines: string[] = [];
  if (b.name) { lines.push(`*${b.name}*`); }
  if (s.showDescription && b.description) lines.push(b.description);
  if (s.showCnpj && b.cnpj)               lines.push(`CNPJ: ${b.cnpj}`);
  if (s.showPhone && b.phone)             lines.push(`Tel.: ${b.phone}`);
  if (s.showAddress) {
    const addr = buildAddressLine(b);
    if (addr) lines.push(addr);
  }
  if (lines.length) lines.push("");

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
  lines.push(s.footerNote || "Obrigado pela preferência!");
  return lines.join("\n");
}

export function buildReceiptHtml(o: ReceiptOrder, business: string | ReceiptBusiness = "") {
  const b = normalizeBusiness(business);
  const s = getSettings(b);
  const esc = (x: any) => String(x ?? "").replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!));
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

  const headerLines: string[] = [];
  if (s.showDescription && b.description) headerLines.push(`<div class="muted">${esc(b.description)}</div>`);
  if (s.showCnpj && b.cnpj)               headerLines.push(`<div class="muted">CNPJ ${esc(b.cnpj)}</div>`);
  if (s.showPhone && b.phone)             headerLines.push(`<div class="muted">Tel. ${esc(b.phone)}</div>`);
  if (s.showAddress) {
    const a = buildAddressLine(b);
    if (a) headerLines.push(`<div class="muted">${esc(a)}</div>`);
  }

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
    ${b.name ? `<h1>${esc(b.name)}</h1>` : ""}
    ${headerLines.join("")}
    <div class="muted" style="margin-top:6px;">Recibo — Pedido #${esc(o.number)}</div>
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
  <p class="center muted" style="margin-top:18px;">${esc(s.footerNote || "Obrigado pela preferência!")}</p>
  <div class="no-print center" style="margin-top:16px;">
    <button onclick="window.print()">Imprimir</button>
  </div>
  <script>setTimeout(() => window.print(), 300);</script>
</body></html>`;
}

export function printReceipt(o: ReceiptOrder, business: string | ReceiptBusiness = "") {
  const html = buildReceiptHtml(o, business);
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

export function sendWhatsappReceipt(o: ReceiptOrder, business: string | ReceiptBusiness = "") {
  const text = buildReceiptText(o, business);
  const url  = whatsappUrl(o.customer?.phone, text);
  window.open(url, "_blank");
}
