# PROJECT_CONTEXT.md
> **Memória de Arquitetura — bora-app / lumiPOS**
> Última atualização: 2026-04-17
> ⚠️ Este arquivo é a fonte da verdade. Sempre leia antes de qualquer alteração.

---

## 1. Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 14 (App Router), React, Tailwind CSS |
| API | tRPC (routers em `apps/web/src/server/api/routers/`) |
| Auth | better-auth (email+password, sessão 30 dias) |
| Banco de Dados | PostgreSQL via Supabase |
| ORM | Drizzle ORM (`packages/db/`) |
| Monorepo | Turborepo + pnpm workspaces |
| Deploy | Vercel (automático via GitHub push) |
| Runtime | Node.js ≥ 20, pnpm ≥ 9 |

---

## 2. Estrutura do Monorepo

```
bora-app/
├── apps/
│   └── web/                        # App Next.js principal (lumiPOS)
│       └── src/
│           ├── app/                # Rotas Next.js (App Router)
│           │   └── dashboard/      # Área autenticada
│           ├── components/         # Componentes React
│           ├── lib/                # Utilitários (auth-client, utils)
│           ├── server/
│           │   ├── api/
│           │   │   ├── root.ts     # AppRouter (registro de todos os routers)
│           │   │   ├── trpc.ts     # Contexto tRPC + procedures
│           │   │   └── routers/    # Routers individuais
│           │   ├── auth/index.ts   # Configuração better-auth
│           │   └── supabase-admin.ts # Cliente Supabase com SERVICE_KEY
│           └── middleware.ts       # Proteção de rotas /dashboard
├── packages/
│   ├── db/                         # Schema Drizzle + migrations
│   │   ├── src/schema/             # Definições de tabelas
│   │   └── src/migrations/         # SQL gerado pelo Drizzle
│   ├── auth/                       # Re-export de better-auth
│   ├── ui/                         # Componentes compartilhados
│   └── utils/                      # Utilitários compartilhados
├── vercel.json                     # Config de deploy Vercel
├── turbo.json                      # Pipeline Turborepo
└── .env.example                    # Template de variáveis de ambiente
```

---

## 3. Dicionário de Dados Completo

> **Fonte:** `packages/db/src/schema/` + `packages/db/src/migrations/0000_quick_scorpion.sql`
> **Padrão de IDs:** CUID2 gerado via `@paralleldrive/cuid2`
> **Multi-tenancy:** Todas as tabelas de negócio possuem `tenant_id` (FK → `tenants.id`, ON DELETE CASCADE)

---

### 3.1 `tenants`
Organizações/empresas cadastradas no sistema.

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | text PK | CUID2 |
| `name` | text NOT NULL | Nome da empresa |
| `slug` | text UNIQUE NOT NULL | Identificador de URL |
| `logo_url` | text | URL do logo |
| `description` | text | Descrição |
| `phone` | text | Telefone |
| `cnpj` | text | CNPJ |
| `plan` | enum NOT NULL | `'free'`, `'smart'`, `'pro'`, `'premium'` |
| `plan_expires_at` | timestamp | Expiração do plano |
| `is_active` | boolean NOT NULL | Default: `true` |
| `created_at` | timestamp NOT NULL | |
| `updated_at` | timestamp NOT NULL | |

---

### 3.2 `users`
Usuários do sistema (vinculados a um tenant).

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | text PK | CUID2 |
| `tenant_id` | text FK → tenants.id | ON DELETE CASCADE |
| `name` | text NOT NULL | |
| `email` | text UNIQUE NOT NULL | |
| `email_verified` | boolean NOT NULL | Default: `false` |
| `image` | text | Avatar URL |
| `role` | enum NOT NULL | `'owner'`, `'admin'`, `'seller'`, `'cashier'` |
| `created_at` | timestamp NOT NULL | |
| `updated_at` | timestamp NOT NULL | |

---

### 3.3 `accounts` (better-auth)
Contas de autenticação OAuth/credenciais.

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | text PK | |
| `user_id` | text FK → users.id | ON DELETE CASCADE |
| `account_id` | text NOT NULL | |
| `provider_id` | text NOT NULL | |
| `access_token` | text | |
| `refresh_token` | text | |
| `access_token_expires_at` | timestamp | |
| `password` | text | Hash da senha |
| `id_token` | text | |
| `created_at` | timestamp NOT NULL | |
| `updated_at` | timestamp NOT NULL | |

---

### 3.4 `sessions` (better-auth)
Sessões ativas de usuários.

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | text PK | |
| `user_id` | text FK → users.id | ON DELETE CASCADE |
| `token` | text UNIQUE NOT NULL | Cookie: `better-auth.session_token` |
| `expires_at` | timestamp NOT NULL | |
| `ip_address` | text | |
| `user_agent` | text | |
| `created_at` | timestamp NOT NULL | |
| `updated_at` | timestamp NOT NULL | |

---

### 3.5 `verifications` (better-auth)
Tokens de verificação de e-mail.

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | text PK | |
| `identifier` | text NOT NULL | |
| `value` | text NOT NULL | |
| `expires_at` | timestamp NOT NULL | |
| `created_at` | timestamp NOT NULL | |

---

### 3.6 `categories`
Categorias de produtos.

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | text PK | CUID2 |
| `tenant_id` | text FK → tenants.id | ON DELETE CASCADE |
| `name` | text NOT NULL | |
| `emoji` | text | Ícone emoji |
| `color` | text | Classe CSS de cor |
| `order` | integer | Ordem de exibição, default: `0` |
| `created_at` | timestamp NOT NULL | |

---

### 3.7 `products`
Produtos, serviços e combos.

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | text PK | CUID2 |
| `tenant_id` | text FK → tenants.id | ON DELETE CASCADE |
| `category_id` | text FK → categories.id | Nullable |
| `name` | text NOT NULL | |
| `description` | text | |
| `image_url` | text | |
| `barcode` | text | Código de barras |
| `sku` | text | |
| `type` | enum NOT NULL | `'product'`, `'service'`, `'combo'` |
| `price` | numeric(10,2) NOT NULL | Preço de venda |
| `cost_price` | numeric(10,2) | Preço de custo (COGS) |
| `stock` | integer | Default: `0` |
| `min_stock` | integer | Alerta de estoque mínimo, default: `5` |
| `track_stock` | boolean | Controlar estoque? Default: `true` |
| `is_active` | boolean NOT NULL | Soft delete, default: `true` |
| `show_in_store` | boolean | Exibir na loja online, default: `true` |
| `is_favorite` | boolean | Default: `false` |
| `created_at` | timestamp NOT NULL | |
| `updated_at` | timestamp NOT NULL | |

---

### 3.8 `orders`
Pedidos de venda.

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | text PK | CUID2 |
| `tenant_id` | text FK → tenants.id | ON DELETE CASCADE |
| `customer_id` | text | FK → customers.id (nullable) |
| `seller_id` | text FK → users.id | Vendedor |
| `number` | integer NOT NULL | Número sequencial do pedido |
| `channel` | enum NOT NULL | `'pdv'`, `'online'`, `'whatsapp'` |
| `status` | enum NOT NULL | `'pending'`, `'confirmed'`, `'preparing'`, `'ready'`, `'delivered'`, `'cancelled'` |
| `payment_method` | enum | `'pix'`, `'cash'`, `'credit'`, `'debit'`, `'voucher'`, `'mixed'`, `'account'` |
| `payment_status` | enum NOT NULL | `'unpaid'`, `'paid'`, `'partial'`, `'hold'`, `'void'`, `'refunded'`, `'partially_refunded'` |
| `subtotal` | numeric(10,2) NOT NULL | |
| `discount` | numeric(10,2) | Default: `0` |
| `discount_type` | enum NOT NULL | `'flat'`, `'percent'` |
| `total` | numeric(10,2) NOT NULL | |
| `tendered` | numeric(10,2) | Valor entregue (troco) |
| `change_amount` | numeric(10,2) | Troco |
| `register_id` | text | FK → registers.id |
| `void_reason` | text | Motivo de anulação |
| `notes` | text | |
| `metadata` | json | Dados extras |
| `created_at` | timestamp NOT NULL | |
| `updated_at` | timestamp NOT NULL | |

---

### 3.9 `order_items`
Itens de um pedido.

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | text PK | CUID2 |
| `order_id` | text FK → orders.id | ON DELETE CASCADE |
| `product_id` | text FK → products.id | Nullable (produto deletado) |
| `name` | text NOT NULL | Nome snapshot |
| `quantity` | integer NOT NULL | |
| `unit_price` | numeric(10,2) NOT NULL | |
| `cost_price` | numeric(10,2) | Default: `0` (COGS) |
| `discount` | numeric(10,2) | Default: `0` |
| `total` | numeric(10,2) NOT NULL | |
| `notes` | text | |

---

### 3.10 `order_payments`
Registros de pagamento de pedidos (suporta multi-pagamento).

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | text PK | CUID2 |
| `tenant_id` | text FK → tenants.id | ON DELETE CASCADE |
| `order_id` | text FK → orders.id | ON DELETE CASCADE |
| `method` | enum NOT NULL | `'pix'`, `'cash'`, `'credit'`, `'debit'`, `'voucher'`, `'mixed'`, `'account'` |
| `amount` | numeric(10,2) NOT NULL | |
| `note` | text | Ex: `"3x"` para parcelamento |
| `author_id` | text FK → users.id | |
| `created_at` | timestamp NOT NULL | |

---

### 3.11 `order_instalments`
Parcelas de pedidos (fiado/parcelamento).

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | text PK | CUID2 |
| `tenant_id` | text FK → tenants.id | ON DELETE CASCADE |
| `order_id` | text FK → orders.id | ON DELETE CASCADE |
| `amount` | numeric(10,2) NOT NULL | |
| `due_date` | timestamp | Data de vencimento (nullable = fiado sem data) |
| `paid` | boolean NOT NULL | Default: `false` |
| `paid_at` | timestamp | |
| `payment_id` | text FK → order_payments.id | |
| `created_at` | timestamp NOT NULL | |

---

### 3.12 `order_refunds`
Cabeçalho de reembolsos.

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | text PK | CUID2 |
| `tenant_id` | text FK → tenants.id | ON DELETE CASCADE |
| `order_id` | text FK → orders.id | ON DELETE CASCADE |
| `reason` | text | |
| `total_amount` | numeric(10,2) NOT NULL | Default: `0` |
| `author_id` | text FK → users.id | |
| `created_at` | timestamp NOT NULL | |

---

### 3.13 `order_refund_items`
Itens de um reembolso.

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | text PK | CUID2 |
| `refund_id` | text FK → order_refunds.id | ON DELETE CASCADE |
| `order_item_id` | text FK → order_items.id | |
| `product_id` | text FK → products.id | |
| `quantity` | numeric(10,2) NOT NULL | |
| `unit_price` | numeric(10,2) NOT NULL | |
| `condition` | text | `'good'` ou `'damaged'` |
| `notes` | text | |
| `created_at` | timestamp NOT NULL | |

---

### 3.14 `customers`
Clientes cadastrados.

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | text PK | CUID2 |
| `tenant_id` | text FK → tenants.id | ON DELETE CASCADE |
| `name` | text NOT NULL | |
| `phone` | text | |
| `email` | text | |
| `cpf` | text | |
| `address` | text | |
| `credit_limit` | numeric(10,2) | Limite de crédito, default: `0` |
| `credit_balance` | numeric(10,2) | Saldo devedor atual, default: `0` |
| `total_orders` | integer | Contador de pedidos, default: `0` |
| `total_spent` | numeric(10,2) | Total gasto, default: `0` |
| `notes` | text | |
| `created_at` | timestamp NOT NULL | |
| `updated_at` | timestamp NOT NULL | |

---

### 3.15 `customer_account_history`
Histórico de movimentações de crédito/débito de clientes (fiado).

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | text PK | CUID2 |
| `tenant_id` | text FK → tenants.id | ON DELETE CASCADE |
| `customer_id` | text FK → customers.id | ON DELETE CASCADE |
| `order_id` | text FK → orders.id | Nullable |
| `operation` | enum NOT NULL | `'add'` (débito), `'sub'` (pagamento) |
| `amount` | numeric(10,2) NOT NULL | |
| `balance_before` | numeric(10,2) NOT NULL | Default: `0` |
| `balance_after` | numeric(10,2) NOT NULL | Default: `0` |
| `description` | text | |
| `created_at` | timestamp NOT NULL | |

---

### 3.16 `transactions`
Transações financeiras (contas a pagar/receber).

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | text PK | CUID2 |
| `tenant_id` | text FK → tenants.id | ON DELETE CASCADE |
| `type` | enum NOT NULL | `'income'`, `'expense'` |
| `status` | enum NOT NULL | `'pending'`, `'paid'`, `'overdue'`, `'cancelled'` |
| `category` | enum NOT NULL | `'sales'`, `'purchase'`, `'salary'`, `'tax'`, `'other'` |
| `description` | text NOT NULL | |
| `amount` | numeric(10,2) NOT NULL | |
| `due_date` | timestamp | |
| `paid_at` | timestamp | |
| `reference` | text | |
| `notes` | text | |
| `created_at` | timestamp NOT NULL | |
| `updated_at` | timestamp NOT NULL | |

---

### 3.17 `cash_sessions`
Sessões de abertura/fechamento de caixa.

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | text PK | CUID2 |
| `tenant_id` | text FK → tenants.id | ON DELETE CASCADE |
| `opened_by` | text NOT NULL | user_id |
| `status` | enum NOT NULL | `'open'`, `'closed'` |
| `opening_balance` | numeric(10,2) | Default: `0` |
| `closing_balance` | numeric(10,2) | |
| `notes` | text | |
| `opened_at` | timestamp NOT NULL | |
| `closed_at` | timestamp | |

---

### 3.18 `inventory_movements`
Movimentações de estoque.

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | text PK | CUID2 |
| `tenant_id` | text FK → tenants.id | ON DELETE CASCADE |
| `product_id` | text FK → products.id | ON DELETE CASCADE |
| `type` | enum NOT NULL | `'in'`, `'out'`, `'adjustment'`, `'return'`, `'sale'`, `'void-return'`, `'defective'`, `'procurement'` |
| `quantity` | integer NOT NULL | |
| `before` | integer NOT NULL | Estoque antes |
| `after` | integer NOT NULL | Estoque depois |
| `reason` | text | |
| `reference` | text | Ex: `"Pedido #42"` |
| `created_at` | timestamp NOT NULL | |

---

### 3.19 `coupons`
Cupons de desconto.

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | text PK | CUID2 |
| `tenant_id` | text FK → tenants.id | ON DELETE CASCADE |
| `code` | text NOT NULL | Código (sempre UPPERCASE na validação) |
| `name` | text | |
| `type` | enum NOT NULL | `'flat'`, `'percent'` |
| `value` | numeric(10,2) NOT NULL | |
| `min_cart_value` | numeric(10,2) | Default: `0` |
| `max_uses` | integer | Nullable = ilimitado |
| `uses_count` | integer NOT NULL | Default: `0` |
| `valid_until` | timestamp | |
| `active` | boolean NOT NULL | Default: `true` |
| `created_at` | timestamp NOT NULL | |

---

### 3.20 `providers`
Fornecedores.

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | text PK | CUID2 |
| `tenant_id` | text FK → tenants.id | ON DELETE CASCADE |
| `name` | text NOT NULL | |
| `phone` | text | |
| `email` | text | |
| `address` | text | |
| `notes` | text | |
| `created_at` | timestamp NOT NULL | |
| `updated_at` | timestamp NOT NULL | |

---

### 3.21 `procurements`
Ordens de compra/suprimentos.

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | text PK | CUID2 |
| `tenant_id` | text FK → tenants.id | ON DELETE CASCADE |
| `provider_id` | text FK → providers.id | Nullable |
| `name` | text | |
| `invoice_ref` | text | Número da nota fiscal |
| `delivery_date` | timestamp | |
| `notes` | text | |
| `total_value` | numeric(10,2) NOT NULL | Default: `0` |
| `payment_status` | enum NOT NULL | `'unpaid'`, `'paid'` |
| `delivery_status` | enum NOT NULL | `'pending'`, `'delivered'` |
| `author_id` | text FK → users.id | |
| `created_at` | timestamp NOT NULL | |
| `updated_at` | timestamp NOT NULL | |

---

### 3.22 `procurement_items`
Itens de uma ordem de compra.

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | text PK | CUID2 |
| `procurement_id` | text FK → procurements.id | ON DELETE CASCADE |
| `product_id` | text FK → products.id | ON DELETE CASCADE |
| `quantity` | integer NOT NULL | |
| `purchase_price` | numeric(10,2) NOT NULL | |
| `total_price` | numeric(10,2) NOT NULL | |
| `created_at` | timestamp NOT NULL | |

---

### 3.23 `registers`
Caixas PDV.

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | text PK | CUID2 |
| `tenant_id` | text FK → tenants.id | ON DELETE CASCADE |
| `name` | text NOT NULL | Nome do caixa |
| `status` | enum NOT NULL | `'opened'`, `'closed'` |
| `balance` | numeric(10,2) NOT NULL | Default: `0` |
| `used_by` | text FK → users.id | Operador atual |
| `created_at` | timestamp NOT NULL | |
| `updated_at` | timestamp NOT NULL | |

---

### 3.24 `register_history`
Histórico de movimentações do caixa PDV.

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | text PK | CUID2 |
| `tenant_id` | text FK → tenants.id | ON DELETE CASCADE |
| `register_id` | text FK → registers.id | ON DELETE CASCADE |
| `action` | enum NOT NULL | `'opening'`, `'closing'`, `'cash-in'`, `'cash-out'`, `'order-payment'`, `'refund'` |
| `value` | numeric(10,2) NOT NULL | Default: `0` |
| `balance_before` | numeric(10,2) NOT NULL | Default: `0` |
| `balance_after` | numeric(10,2) NOT NULL | Default: `0` |
| `transaction_type` | enum NOT NULL | `'positive'`, `'negative'`, `'unchanged'` |
| `description` | text | |
| `author_id` | text FK → users.id | |
| `created_at` | timestamp NOT NULL | |

---

## 4. Rotas de API (tRPC)

Todas as rotas usam `tenantProcedure` (requer sessão + tenant válido).
Endpoint HTTP: `POST /api/trpc/[router].[procedure]`

| Router | Procedures |
|---|---|
| `dashboard` | `getStats` |
| `products` | `list`, `create`, `update`, `delete`, `listCategories`, `createCategory`, `updateCategory`, `deleteCategory` |
| `orders` | `create`, `createWithPayments`, `list`, `get`, `void`, `refund`, `payInstalment`, `markDelivered`, `cancel`, `update`, `addNote`, `pay`, `applyCoupon` |
| `inventory` | (ver `routers/inventory.ts`) |
| `customers` | (ver `routers/customers.ts`) |
| `financial` | `listTransactions`, `createTransaction`, `markPaid`, `getMonthlySummary`, `getCurrentSession`, `openCashSession`, `closeCashSession` |
| `registers` | (ver `routers/registers.ts`) |
| `providers` | (ver `routers/providers.ts`) |
| `procurements` | (ver `routers/procurements.ts`) |
| `coupons` | (ver `routers/coupons.ts`) |
| `reports` | (ver `routers/reports.ts`) |

---

## 5. Fluxo de Autenticação

```
Browser → Cookie: better-auth.session_token
       → middleware.ts verifica cookie
       → Se ausente em /dashboard/* → redirect /auth/login
       → tRPC context (trpc.ts) → auth.api.getSession()
       → Busca users.tenant_id → Carrega tenant
       → tenantProcedure garante session + tenant
```

- **Sessão:** 30 dias, renovada diariamente
- **Cookie:** `better-auth.session_token` (ou `__Secure-` em produção)
- **Auth client cookie name:** `lumi-session`
- **Trusted origins:** `localhost:3000`, `lumiposok.vercel.app`

---

## 6. Variáveis de Ambiente

> ⚠️ Sempre que criar uma funcionalidade que precise de nova chave secreta, lembre o usuário de adicioná-la no **painel da Vercel** (Settings → Environment Variables).

### Obrigatórias (runtime)

| Variável | Onde usar | Descrição |
|---|---|---|
| `DATABASE_URL` | Server-only | String de conexão PostgreSQL Supabase |
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Server | Chave pública anon |
| `SUPABASE_SERVICE_KEY` | Server-only | Chave service_role (admin) |
| `BETTER_AUTH_SECRET` | Server-only | Segredo para assinar tokens |
| `BETTER_AUTH_URL` | Server-only | URL base para better-auth |
| `NEXT_PUBLIC_APP_URL` | Client + Server | URL pública do app |
| `NEXT_PUBLIC_APP_NAME` | Client | Nome do app (ex: `lumiPOS`) |
| `NODE_ENV` | Runtime | `production` em produção |

### Opcionais / Futuras

| Variável | Descrição |
|---|---|
| `DB_PROXY_URL` | URL do proxy de banco (se usado) |
| `DB_PROXY_SECRET` | Segredo do proxy de banco |

### Valores em Produção (vercel.json)

```json
{
  "BETTER_AUTH_URL": "https://lumiposok.vercel.app",
  "NEXT_PUBLIC_APP_URL": "https://lumiposok.vercel.app",
  "NEXT_PUBLIC_APP_NAME": "lumiPOS",
  "NODE_ENV": "production"
}
```

---

## 7. Estratégia de Deploy

```
git push → GitHub (branch main)
         → Vercel detecta push automaticamente
         → Executa: turbo run build
         → Output: .next/
         → Deploy automático em https://lumiposok.vercel.app
```

### Regras Obrigatórias de Deploy

1. **NUNCA** sugira `vercel deploy`, `vercel --prod` ou qualquer comando manual de deploy.
2. **SEMPRE** valide com `pnpm build` (ou `turbo run build`) localmente antes de concluir qualquer tarefa.
3. **NUNCA** altere `vercel.json` ou `turbo.json` sem avaliar o impacto no pipeline de CI/CD.
4. **SEMPRE** que adicionar nova variável de ambiente, lembrar o usuário de adicioná-la no painel da Vercel.

---

## 8. Regras de Nomenclatura

| Contexto | Padrão | Exemplo |
|---|---|---|
| Arquivos de schema DB | kebab-case | `order-payments.ts` |
| Nomes de tabelas SQL | snake_case | `order_payments` |
| Colunas SQL | snake_case | `tenant_id`, `created_at` |
| Propriedades Drizzle (TS) | camelCase | `tenantId`, `createdAt` |
| Arquivos de router tRPC | kebab-case | `order-payments.ts` |
| Componentes React | PascalCase | `DashboardCalendar.tsx` |
| Rotas Next.js | kebab-case | `/dashboard/pedidos/page.tsx` |
| Variáveis de ambiente públicas | `NEXT_PUBLIC_` prefix | `NEXT_PUBLIC_SUPABASE_URL` |
| Variáveis de ambiente privadas | SCREAMING_SNAKE_CASE | `BETTER_AUTH_SECRET` |

---

## 9. Prevenção de Erros

1. **Nunca editar arquivos SQL de migration manualmente.** Use `pnpm db:push` ou gere via `drizzle-kit generate`.
2. **Soft delete em `products`:** Use `is_active: false`, nunca DELETE físico.
3. **Multi-tenancy:** Toda query deve filtrar por `tenant_id`. Nunca omitir este filtro.
4. **Estoque:** Sempre verificar `track_stock` antes de decrementar/incrementar.
5. **Cupons:** Código sempre em UPPERCASE na validação (`.toUpperCase()`).
6. **Rodar antes de concluir qualquer tarefa:**
   ```bash
   pnpm build
   # ou
   turbo run build
   ```

---

## 10. Regra de Atualização deste Arquivo

> **Ao finalizar qualquer tarefa que altere:**
> - Estrutura do banco de dados (novas tabelas, colunas, enums)
> - Rotas de API (novos routers, procedures)
> - Configurações de deploy (vercel.json, turbo.json)
> - Variáveis de ambiente
>
> **→ Você DEVE obrigatoriamente atualizar este arquivo PROJECT_CONTEXT.md antes de encerrar o chat.**
