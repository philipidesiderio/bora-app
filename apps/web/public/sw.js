// lumiPOS Service Worker — v1
const CACHE = "lumipos-v1";
const STATIC = "lumipos-static-v1";

// Assets estáticos do Next.js — cache-first
const isStatic = (url) =>
  url.includes("/_next/static/") ||
  url.includes("/icons/") ||
  url.endsWith("/manifest.json") ||
  url.endsWith("/favicon.svg");

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(STATIC).then((c) =>
      c.addAll(["/manifest.json", "/icons/icon-192.svg", "/icons/icon-512.svg"])
    )
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE && k !== STATIC)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  // Ignora requisições não-GET e rotas de API/auth
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_next/data/")) return;

  if (isStatic(url.href)) {
    // Cache-first para assets estáticos
    e.respondWith(
      caches.match(e.request).then((cached) =>
        cached ?? fetch(e.request).then((res) => {
          const clone = res.clone();
          caches.open(STATIC).then((c) => c.put(e.request, clone));
          return res;
        })
      )
    );
  } else {
    // Network-first para páginas
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
  }
});
