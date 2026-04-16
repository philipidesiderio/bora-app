"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Key, ChevronLeft, Eye, EyeOff, Lock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function SenhaVendaPage() {
  const [pin, setPin]         = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow]       = useState(false);
  const [saved, setSaved]     = useState(false);

  function handleDigit(d: string) {
    if (pin.length < 6) setPin(p => p + d);
  }
  function handleConfirmDigit(d: string) {
    if (confirm.length < 6) setConfirm(c => c + d);
  }

  function handleSave() {
    if (pin.length < 4) { toast.error("PIN precisa ter pelo menos 4 dígitos"); return; }
    if (pin !== confirm) { toast.error("PINs não conferem"); return; }
    // Persisted locally (feature completa requer backend)
    localStorage.setItem("pdv_pin", pin);
    toast.success("PIN definido com sucesso!");
    setSaved(true);
    setPin("");
    setConfirm("");
  }

  return (
    <div className="max-w-sm mx-auto pb-28 md:pb-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/ajustes" className="p-2 rounded-xl hover:bg-muted transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Key className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="font-heading text-xl font-bold">Senha na Venda</h1>
          <p className="text-xs text-muted-foreground">PIN de segurança no PDV</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-5">
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
          <Lock className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-xs text-amber-700">
            O PIN protege o PDV de acessos não autorizados. Exigido ao iniciar uma venda.
          </p>
        </div>

        {/* PIN input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Novo PIN (4–6 dígitos)</label>
          <div className="flex gap-2 items-center">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-10 h-12 rounded-xl border-2 flex items-center justify-center text-lg font-bold transition-all",
                  i < pin.length
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-muted/30 text-muted-foreground"
                )}
              >
                {i < pin.length ? (show ? pin[i] : "•") : ""}
              </div>
            ))}
            <button onClick={() => setShow(s => !s)} className="ml-1 p-2 rounded-lg hover:bg-muted">
              {show ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
            </button>
          </div>
        </div>

        {/* Confirm PIN */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Confirmar PIN</label>
          <div className="flex gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-10 h-12 rounded-xl border-2 flex items-center justify-center text-lg font-bold transition-all",
                  i < confirm.length
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-muted/30 text-muted-foreground"
                )}
              >
                {i < confirm.length ? "•" : ""}
              </div>
            ))}
          </div>
        </div>

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-2">
          {["1","2","3","4","5","6","7","8","9","","0","⌫"].map(d => (
            <button
              key={d}
              onClick={() => {
                if (d === "⌫") {
                  if (confirm.length > 0) setConfirm(c => c.slice(0,-1));
                  else if (pin.length > 0) setPin(p => p.slice(0,-1));
                } else if (d !== "") {
                  if (pin.length < 6) handleDigit(d);
                  else handleConfirmDigit(d);
                }
              }}
              disabled={d === ""}
              className={cn(
                "h-12 rounded-xl text-base font-semibold transition-all active:scale-95",
                d === "⌫"
                  ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                  : d === ""
                  ? "invisible"
                  : "bg-muted hover:bg-muted/70"
              )}
            >
              {d}
            </button>
          ))}
        </div>

        <Button onClick={handleSave} className="w-full" disabled={pin.length < 4 || confirm.length < 4}>
          Definir PIN
        </Button>

        {saved && (
          <p className="text-center text-xs text-emerald-600 font-medium">✓ PIN salvo com sucesso</p>
        )}
      </div>
    </div>
  );
}
