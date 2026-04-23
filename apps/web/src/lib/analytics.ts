type GtmEvent = Record<string, unknown>;

function push(payload: GtmEvent): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);
}

export function trackPageview(url: string): void {
  push({ event: "page_view", page_location: url, page_title: document.title });
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
}

declare global {
  interface Window {
    dataLayer: GtmEvent[];
  }
}
