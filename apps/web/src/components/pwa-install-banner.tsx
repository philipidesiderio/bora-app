"use client";
/**
 * PWA Install Banner
 *
 * Android Chrome  → 1 clique → abre popup nativo de instalação ✅
 * Android WebView → botão "Abrir no Chrome" → Chrome abre + instala ✅
 * iOS Safari      → 2 toques obrigatórios (Apple não permite automatizar) ℹ️
 * iOS WebView     → botão "Abrir no Safari" ✅
 * Desktop / já instalado → não aparece
 */
import { useEffect, useRef, useState } from "react";
import { Download, X } from "lucide-react";

type Platform = "android-chrome" | "android-webview" | "ios-safari" | "ios-webview";

function detect(): Platform | null {
  if (typeof window === "undefined") return null;
  const ua  = navigator.userAgent;
  const ios = /iphone|ipad|ipod/i.test(ua);
  const and = /android/i.test(ua);
  if (!ios && !and) return null;

  // já instalado como PWA
  if (window.matchMedia("(display-mode: standalone)").matches) return null;
  if ((navigator as any).standalone === true) return null;

  const wv = /wv\b|whatsapp|instagram|fbav|fban|twitter|tiktok|line|telegram/i.test(ua);

  if (ios)  return wv ? "ios-webview"     : "ios-safari";
  if (and)  return wv ? "android-webview" : "android-chrome";
  return null;
}

export function PwaInstallBanner() {
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [visible,  setVisible]  = useState(false);
  const [iosStep,  setIosStep]  = useState(false);
  const promptRef = useRef<any>(null);

  useEffect(() => {
    const p = detect();
    if (!p) return;
    setPlatform(p);
    setVisible(true);

    // Captura o prompt nativo do Chrome (Android)
    const onPrompt = (e: Event) => { e.preventDefault(); promptRef.current = e; };
    window.addEventListener("beforeinstallprompt", onPrompt as any);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt as any);
  }, []);

  if (!visible || !platform) return null;

  // ── handlers ────────────────────────────────────────────────────────────────

  function handleAndroidChrome() {
    if (promptRef.current) {
      promptRef.current.prompt();
      promptRef.current.userChoice.then((r: any) => {
        if (r.outcome === "accepted") setVisible(false);
      });
    } else {
      // fallback: abre menu do Chrome via intent
      window.location.href =
        "intent://" + window.location.host + window.location.pathname +
        "#Intent;scheme=https;package=com.android.chrome;end";
    }
  }

  function handleAndroidWebview() {
    // Abre o link diretamente no Chrome
    window.location.href =
      "intent://" + window.location.host + window.location.pathname +
      "#Intent;scheme=https;package=com.android.chrome;end";
  }

  function handleIosWebview() {
    // Tenta abrir no Safari (funciona na maioria dos WebViews iOS)
    window.open(window.location.href, "_blank");
  }

  // ── render ───────────────────────────────────────────────────────────────────

  return (
    <div className="fixed bottom-4 left-3 right-3 z-[999] rounded-2xl overflow-hidden shadow-2xl">
      <div className="bg-primary px-4 py-3.5 flex items-center gap-3">
        {/* Ícone */}
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 text-white font-heading font-extrabold text-xs leading-none text-center">
          lumi<br/>POS
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm leading-tight">Instalar lumiPOS</p>

          {platform === "android-chrome" && (
            <p className="text-white/75 text-xs">Adicionar na tela inicial, grátis</p>
          )}
          {platform === "android-webview" && (
            <p className="text-white/75 text-xs">Abre no Chrome para instalar</p>
          )}
          {platform === "ios-safari" && !iosStep && (
            <p className="text-white/75 text-xs">Adicionar na tela inicial do iPhone</p>
          )}
          {platform === "ios-safari" && iosStep && (
            <p className="text-white/90 text-xs font-medium">
              Toque em <span className="font-bold">⬆ Compartilhar</span> → <span className="font-bold">Adicionar à Tela de Início</span>
            </p>
          )}
          {platform === "ios-webview" && (
            <p className="text-white/75 text-xs">Abre no Safari para instalar</p>
          )}
        </div>

        {/* Botão de ação */}
        {platform === "android-chrome" && (
          <button
            onClick={handleAndroidChrome}
            className="shrink-0 bg-white text-primary text-xs font-bold px-4 py-2 rounded-xl active:scale-95 transition-transform flex items-center gap-1.5"
          >
            <Download size={13} />
            Instalar
          </button>
        )}
        {platform === "android-webview" && (
          <button
            onClick={handleAndroidWebview}
            className="shrink-0 bg-white text-primary text-xs font-bold px-4 py-2 rounded-xl active:scale-95 transition-transform"
          >
            Abrir Chrome
          </button>
        )}
        {platform === "ios-safari" && !iosStep && (
          <button
            onClick={() => setIosStep(true)}
            className="shrink-0 bg-white text-primary text-xs font-bold px-4 py-2 rounded-xl active:scale-95 transition-transform flex items-center gap-1.5"
          >
            <Download size={13} />
            Instalar
          </button>
        )}
        {platform === "ios-safari" && iosStep && (
          <button onClick={() => setVisible(false)} className="shrink-0 text-white/60 hover:text-white p-1">
            <X size={18} />
          </button>
        )}
        {platform === "ios-webview" && (
          <button
            onClick={handleIosWebview}
            className="shrink-0 bg-white text-primary text-xs font-bold px-4 py-2 rounded-xl active:scale-95 transition-transform"
          >
            Abrir Safari
          </button>
        )}

        {/* Fechar (exceto iOS step que já tem o X) */}
        {!(platform === "ios-safari" && iosStep) && (
          <button
            onClick={() => setVisible(false)}
            className="shrink-0 text-white/50 hover:text-white/80 p-0.5 ml-0"
          >
            <X size={15} />
          </button>
        )}
      </div>
    </div>
  );
}
