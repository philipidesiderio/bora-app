"use client";
import { Smartphone, ChevronLeft, Lock } from "lucide-react";
import Link from "next/link";

export default function SmartPOSPage() {
  return (
    <div className="max-w-lg mx-auto pb-28 md:pb-6">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard/ajustes" className="p-2 rounded-xl hover:bg-muted transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-heading text-xl font-bold">SmartPOS API</h1>
          <p className="text-xs text-muted-foreground">API para SmartPOS</p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
        <div className="relative w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
          <Smartphone className="w-8 h-8 text-muted-foreground" />
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center">
            <Lock className="w-3 h-3 text-white" />
          </div>
        </div>
        <h2 className="font-heading text-lg font-bold">SmartPOS API</h2>
        <p className="text-muted-foreground text-sm max-w-xs">
          Integre o sistema com dispositivos SmartPOS via API. Ideal para redes de loja com múltiplos terminais.
        </p>
        <span className="text-xs bg-yellow-500 text-white px-3 py-1.5 rounded-full font-bold">
          PREMIUM
        </span>
        <Link
          href="/dashboard/ajustes/planos"
          className="text-sm text-primary hover:underline font-medium"
        >
          Fazer upgrade →
        </Link>
      </div>
    </div>
  );
}
