FROM node:20-alpine AS builder

RUN npm install -g pnpm@9
RUN apk add --no-cache libc6-compat librsvg

WORKDIR /app

# Copia tudo de uma vez
COPY . .

# Instala com hoist para garantir resolução de módulos no Docker
RUN pnpm install --shamefully-hoist

# Gera ícones PNG a partir dos SVGs (Play Store não aceita SVG)
RUN rsvg-convert -w 192 -h 192 apps/web/public/icons/icon-192.svg \
      -o apps/web/public/icons/icon-192.png && \
    rsvg-convert -w 512 -h 512 apps/web/public/icons/icon-512.svg \
      -o apps/web/public/icons/icon-512.png && \
    rsvg-convert -w 512 -h 512 apps/web/public/icons/icon-maskable.svg \
      -o apps/web/public/icons/icon-maskable-512.png

ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_APP_NAME
# Placeholder para evitar erro de "Missing env" durante o build — sem conexão real
ARG DATABASE_URL=postgresql://build_placeholder:placeholder@localhost:5432/placeholder
ARG DB_PROXY_URL=https://placeholder.supabase.co/functions/v1/db-proxy

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV DATABASE_URL=$DATABASE_URL
ENV DB_PROXY_URL=$DB_PROXY_URL
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm --filter web build

# ── Runner ────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

RUN mkdir -p ./apps/web/public ./apps/web/.next/static
COPY --from=builder /app/apps/web/public/                               ./apps/web/public/
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static/    ./apps/web/.next/static/

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]
