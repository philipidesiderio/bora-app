type GtmEvent = Record<string, unknown>;

function push(payload: GtmEvent): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);
}

// ─── Session ID (persiste por aba) ────────────────────────────────────────────
function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sid = sessionStorage.getItem("_lumi_sid");
  if (!sid) {
    sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem("_lumi_sid", sid);
  }
  return sid;
}

// ─── Envio para o backend próprio ────────────────────────────────────────────
export function trackBackend(event: string, extra?: { page?: string; plan?: string }): void {
  if (typeof window === "undefined") return;
  fetch("/api/analytics/track", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, session_id: getSessionId(), ...extra }),
    keepalive: true,
  }).catch(() => {/* silencia erros de rede */});
}

// ─── GTM ─────────────────────────────────────────────────────────────────────
export function trackPageview(url: string): void {
  push({ event: "page_view", page_location: url, page_title: document.title });
  const path = new URL(url, "https://x").pathname;
  trackBackend("pageview", { page: path });
}

export function trackSignUp(): void {
  push({ event: "sign_up", method: "email" });
}

export interface BeginCheckoutPayload {
  planKey: "smart" | "pro" | "premium";
  planLabel: string;
  value: number;
  currency: "BRL";
}

export function trackBeginCheckout(p: BeginCheckoutPayload): void {
  push({ ecommerce: null });
  push({
    event: "begin_checkout",
    currency: p.currency,
    value: p.value,
    items: [{ item_id: p.planKey, item_name: p.planLabel, price: p.value, quantity: 1 }],
  });
  trackBackend("checkout_started", { plan: p.planKey });
}

export interface PurchasePayload {
  transactionId: string;
  planKey: string;
  planLabel: string;
  value: number;
  currency: "BRL";
}

export function trackPurchase(p: PurchasePayload): void {
  push({ ecommerce: null });
  push({
    event: "purchase",
    transaction_id: p.transactionId,
    currency: p.currency,
    value: p.value,
    items: [{ item_id: p.planKey, item_name: p.planLabel, price: p.value, quantity: 1 }],
  });
  trackBackend("checkout_completed", { plan: p.planKey });
}

export function trackClickAssinar(planKey: string): void {
  trackBackend("click_assinar", { plan: planKey });
}

declare global {
  interface Window {
    dataLayer: GtmEvent[];
  }
}
