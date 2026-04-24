"use client";
import { useEffect, useState } from "react";
import { X, Smartphone } from "lucide-react";

export function PwaInstallBanner() {
  const [visible,  setVisible]  = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | null>(null);
  const [prompt,   setPrompt]   = useState<any>(null);

  useEffect(() => {
    // Já instalado como PWA (modo standalone) — não mostrar
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if ((navigator as any).standalone === true) return;

    // Só mobile
    const ua = navigator.userAgent.toLowerCase();
    const isIos     = /iphone|ipad|ipod/.test(ua);
    const isAndroid = /android/.test(ua);
    if (!isIos && !isAndroid) return;

    setPlatform(isIos ? "ios" : "android");
    setVisible(true);

    // Chrome Android: captura evento nativo de instalação
    const handler = (e: Event) => { e.preventDefault(); setPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler as any);
    return () => window.removeEventListener("beforeinstallprompt", handler as any);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[999] rounded-2xl shadow-2xl border border-primary/20 overflow-hidden">
      <div className="bg-primary p-4">
        <button
          onClick={() => setVisible(false)}
          className="absolute top-3 right-3 text-white/70 hover:text-white"
        >
          <X size={16} />
        </button>

        <div className="flex items-start gap-3 pr-6">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Smartphone size={22} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight">
              Instale o lumiPOS como app
            </p>
            <p className="text-white/80 text-xs mt-0.5">
              Acesso rápido, sem abrir o navegador
            </p>

            {platform === "ios" ? (
              <p className="text-white/90 text-xs mt-2 leading-relaxed">
                Toque em <span className="font-bold">Compartilhar</span> ⬆{" "}
                depois em <span className="font-bold">"Adicionar à Tela de Início"</span>
              </p>
            ) : prompt ? (
              <button
                onClick={async () => {
                  prompt.prompt();
                  const { outcome } = await prompt.userChoice;
                  if (outcome === "accepted") setVisible(false);
                }}
                className="mt-2 bg-white text-primary text-xs font-bold px-4 py-1.5 rounded-full"
              >
                Instalar agora
              </button>
            ) : (
              <p className="text-white/90 text-xs mt-2 leading-relaxed">
                No Chrome: toque em <span className="font-bold">⋮</span> e escolha{" "}
                <span className="font-bold">"Adicionar à tela inicial"</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
