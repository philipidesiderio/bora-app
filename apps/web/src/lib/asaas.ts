/**
 * Cliente Asaas — gateway de pagamentos brasileiro
 * Docs: https://docs.asaas.com/
 *
 * Variáveis de ambiente necessárias:
 *   ASAAS_API_KEY   → chave da API (sandbox começa com $aact_...)
 *   ASAAS_ENV       → "sandbox" | "production"  (padrão: sandbox)
 */

const BASE_URL =
  process.env.ASAAS_ENV === "production"
    ? "https://api.asaas.com/api/v3"
    : "https://sandbox.asaas.com/api/v3";

async function req<T = any>(
  path: string,
  method = "GET",
  body?: object,
): Promise<T> {
  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) throw new Error("ASAAS_API_KEY não configurada no servidor.");

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "access_token": apiKey,
      "User-Agent": "lumiPOS/1.0",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const text = await res.text();
  if (!res.ok) {
    let detail = text;
    try {
      const json = JSON.parse(text);
      detail = json.errors?.[0]?.description ?? text;
    } catch {}
    throw new Error(`Asaas ${res.status}: ${detail}`);
  }
  return JSON.parse(text) as T;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AsaasCustomer {
  id: string;
  name: string;
  cpfCnpj?: string;
  email?: string;
  phone?: string;
}

export interface AsaasPayment {
  id: string;
  status: "PENDING" | "RECEIVED" | "CONFIRMED" | "OVERDUE" | "REFUNDED" | "RECEIVED_IN_CASH" | string;
  billingType: string;
  value: number;
  dueDate: string;
  externalReference?: string;
  invoiceUrl?: string;
}

export interface AsaasPixQrCode {
  encodedImage: string; // base64 PNG — usar em <img src={`data:image/png;base64,${encodedImage}`} />
  payload: string;      // código copia-e-cola
  expirationDate: string;
}

// ─── API Calls ────────────────────────────────────────────────────────────────

export function createCustomer(data: {
  name: string;
  cpfCnpj?: string;
  email?: string;
  phone?: string;
}): Promise<AsaasCustomer> {
  return req("/customers", "POST", data);
}

export function updateCustomer(customerId: string, data: {
  cpfCnpj?: string;
  name?: string;
  email?: string;
  phone?: string;
}): Promise<AsaasCustomer> {
  return req(`/customers/${customerId}`, "PUT", data);
}

export function createPixPayment(data: {
  customer: string;
  billingType: "PIX";
  value: number;
  dueDate: string;        // YYYY-MM-DD
  description: string;
  externalReference?: string;
}): Promise<AsaasPayment> {
  return req("/payments", "POST", data);
}

export function getPixQrCode(paymentId: string): Promise<AsaasPixQrCode> {
  return req(`/payments/${paymentId}/pixQrCode`);
}

export function getPayment(paymentId: string): Promise<AsaasPayment> {
  return req(`/payments/${paymentId}`);
}

// ─── Assinaturas recorrentes ──────────────────────────────────────────────────

export interface AsaasSubscription {
  id: string;
  status: string;
  customer: string;
  billingType: string;
  value: number;
  cycle: string;
  nextDueDate: string;
  externalReference?: string;
}

/** Cria uma assinatura mensal PIX — Asaas cobra automaticamente todo mês */
export function createSubscription(data: {
  customer:          string;
  billingType:       "PIX";
  value:             number;
  nextDueDate:       string;   // YYYY-MM-DD (primeira cobrança)
  cycle:             "MONTHLY";
  description:       string;
  externalReference: string;   // "tenantId|planKey"
}): Promise<AsaasSubscription> {
  return req("/subscriptions", "POST", data);
}

/** Cancela uma assinatura — para de cobrar nos próximos meses */
export function cancelSubscription(subscriptionId: string): Promise<AsaasSubscription> {
  return req(`/subscriptions/${subscriptionId}`, "DELETE");
}

/** Busca os pagamentos de uma assinatura (para pegar o PIX do primeiro) */
export function getSubscriptionPayments(subscriptionId: string): Promise<{ data: AsaasPayment[] }> {
  return req(`/subscriptions/${subscriptionId}/payments?limit=1&offset=0`);
}
