# 🛍️ Bora.app

**Sistema completo de gestão e vendas para micro e pequenos empresários brasileiros.**

PDV • Mini Loja Online • Estoque • Financeiro • NF-e • Multi-tenant SaaS

---

## 🗂️ Estrutura do Monorepo

```
bora-app/
├── apps/
│   ├── web/          → Next.js 15 — dashboard + PDV + mini loja
│   ├── mobile/       → React Native (Expo) — app iOS/Android
│   ├── pdv/          → Electron — PDV Desktop Windows/Mac
│   └── store/        → Storefront público (futuro standalone)
├── packages/
│   ├── db/           → Drizzle ORM + schemas PostgreSQL
│   ├── ui/           → Componentes shadcn/ui compartilhados
│   ├── auth/         → Better-Auth
│   ├── fiscal/       → Módulo NF-e/NFC-e (baseado no FinOpenPOS)
│   └── utils/        → Helpers, formatação, constantes
└── tooling/          → ESLint, Prettier, TypeScript configs
```

---

## 🚀 Começando

### Pré-requisitos
- Node.js >= 20
- pnpm >= 9
- PostgreSQL (ou conta Supabase gratuita)

### 1. Clonar e instalar
```bash
git clone https://github.com/seu-usuario/bora-app
cd bora-app
pnpm install
```

### 2. Variáveis de ambiente
```bash
cp .env.example apps/web/.env.local
# Editar com suas credenciais
```

### 3. Banco de dados
```bash
# Supabase (recomendado para começar — gratuito)
# 1. Criar projeto em supabase.com
# 2. Copiar DATABASE_URL para .env.local
pnpm db:push
```

### 4. Componentes UI
```bash
cd apps/web
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input label card badge progress separator dialog dropdown-menu table tabs sheet avatar
```

### 5. Rodar em dev
```bash
pnpm dev
# → http://localhost:3000
```

---

## 🏗️ Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 15 + React 19 |
| Estilo | Tailwind CSS + shadcn/ui |
| API | tRPC + Zod |
| ORM | Drizzle ORM |
| Banco | PostgreSQL (Supabase) |
| Auth | Better-Auth |
| Pagamentos | Pagar.me + PIX |
| Mobile | React Native (Expo) |
| Desktop | Electron |
| Fiscal BR | FinOpenPOS (open source) |
| Deploy | Vercel + Railway + Cloudflare |

---

## 📦 Planos

| Plano | Preço | Destaques |
|-------|-------|-----------|
| Grátis | R$0 | PDV básico, cadastros |
| Smart | R$39/mês | Estoque, fiado, loja online |
| Pro | R$69/mês | PDV Desktop, relatórios, vendedores |
| Premium | R$99/mês | NF-e, NFC-e, SAT, eventos |

---

## 🗺️ Roadmap

- [x] Fase 1 — Monorepo + auth + DB schema + dashboard
- [x] Fase 1 — PDV web + mini loja storefront
- [ ] Fase 2 — Gestão completa (estoque, financeiro, fiado)
- [ ] Fase 3 — App mobile React Native
- [ ] Fase 4 — PDV Desktop (Electron)
- [ ] Fase 5 — Módulo fiscal NF-e/NFC-e
- [ ] Fase 6 — Landing page + lançamento

---

## 📄 Licença
MIT — use, modifique e distribua livremente.
