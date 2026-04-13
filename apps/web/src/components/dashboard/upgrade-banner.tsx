"use client";
import Link from "next/link";
import { Zap, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function UpgradeBanner() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return (
    <div className="relative flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-primary/15 to-purple-500/8 border border-primary/25">
      <Zap className="text-primary text-2xl flex-shrink-0 h-6 w-6" />
      <div className="flex-1">
        <p className="font-heading font-bold text-sm">Desbloqueie o plano Smart por R$39/mês</p>
        <p className="text-xs text-muted-foreground">Controle de caixa, estoque, relatórios, fiado e muito mais.</p>
      </div>
      <Link href="/dashboard/ajustes/planos">
        <Button size="sm" className="shrink-0 text-xs">Ver planos →</Button>
      </Link>
      <button onClick={() => setVisible(false)}
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
