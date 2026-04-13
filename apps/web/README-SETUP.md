# Bora.app — Web App Setup

## 1. Instalar componentes shadcn/ui
```bash
cd apps/web
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input label card badge progress separator
npx shadcn-ui@latest add dialog dropdown-menu table tabs sheet avatar
```

## 2. Variáveis de ambiente
```bash
cp ../../.env.example .env.local
# Preencher DATABASE_URL, BETTER_AUTH_SECRET, etc
```

## 3. Rodar migrations
```bash
pnpm db:push
```

## 4. Rodar em dev
```bash
pnpm dev
```
