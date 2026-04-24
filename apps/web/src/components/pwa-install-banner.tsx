"use client";
import { useEffect, useState } from "react";
import { X, Download, Smartphone } from "lucide-react";

// Detecta se o app já está instalado (rodando em modo standalone)
function isInstalled() {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true;
}

// Detecta Android/iOS
function getMobilePlatform() {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent.toLowerCase();
  if (/android/.test(ua)) return "android";
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  return null;
}

// Detecta se está dentro de WhatsApp ou outro WebView
function isWebView() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /wv|whatsapp|instagram|facebook|twitter|line|telegram/i.test(ua);
}

export function PwaInstallBanner() {
  const [show, setShow]           = useState(false);
  const [deferredPrompt, setDeferred] = useState<any>(null);
  const [platform, setPlatform]   = useState<"android" | "ios" | null>(null);
  const [webview, setWebview]     = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;
    if (isInstalled()) return;

    const p  = getMobilePlatform();
    const wv = isWebView();
    setPlatform(p as any);
    setWebview(wv);

    if (p !== null) setShow(true);

    // Chrome Android install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e);
    };
    window.addEventListener("beforeinstallprompt", handler as any);
    return () => window.removeEventListener("beforeinstallprompt", handler as any);
  }, [dismissed]);

  if (!show) return null;

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setShow(false);
    }
    // Para iOS ou WebView, o banner já mostra as instruções
  };

  const dismiss = () => {
    setDismissed(true);
    setShow(false);
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 bg-card border border-border rounded-2xl shadow-2xl p-4 animate-in slide-in-from-bottom-4">
      <button
        onClick={dismiss}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
      >
        <X size={16} />
      </button>

      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
          <Smartphone size={22} className="text-primary" />
        </div>
        <div className="flex-1 pr-4">
          <p className="font-heading font-bold text-sm">
            Instale o lumiPOS como app
          </p>

          {webview ? (
            /* Abrindo dentro de WhatsApp/Instagram — precisa abrir no Chrome/Safari */
            <div className="mt-1 text-xs text-muted-foreground space-y-1">
              {platform === "android" ? (
                <p>
                  Abra este link no <span className="font-semibold text-foreground">Chrome</span>:
                  clique nos <span className="font-semibold">⋮</span> e escolha{" "}
                  <span className="font-semibold">"Abrir no Chrome"</span>.
                </p>
              ) : (
                <p>
                  Toque em <span className="font-semibold">⋯</span> e escolha{" "}
                  <span className="font-semibold">"Abrir no Safari"</span>.
                </p>
              )}
            </div>
          ) : platform === "ios" ? (
            /* Safari iOS */
            <p className="mt-1 text-xs text-muted-foreground">
              Toque em <span className="font-semibold">Compartilhar</span>{" "}
              <span className="text-base">⬆</span>{" "}e depois em{" "}
              <span className="font-semibold">"Adicionar à Tela de Início"</span>.
            </p>
          ) : (
            /* Chrome Android — pode instalar diretamente */
            <p className="mt-1 text-xs text-muted-foreground">
              Acesso rápido direto da tela inicial. Funciona como app, sem precisar da Play Store.
            </p>
          )}

          {!webview && platform === "android" && deferredPrompt && (
            <button
              onClick={handleInstall}
              className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              <Download size={13} />
              Instalar agora
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
