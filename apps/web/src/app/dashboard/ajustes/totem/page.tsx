"use client";
import { Tv, ChevronLeft, Lock } from "lucide-react";
import Link from "next/link";

export default function TotemPage() {
  return (
    <div className="max-w-lg mx-auto pb-28 md:pb-6">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard/ajustes" className="p-2 rounded-xl hover:bg-muted transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-heading text-xl font-bold">Totem Digital</h1>
          <p className="text-xs text-muted-foreground">Autoatendimento</p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
        <div className="relative w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
          <Tv className="w-8 h-8 text-muted-foreground" />
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center">
            <Lock className="w-3 h-3 text-white" />
          </div>
        </div>
        <h2 className="font-heading text-lg font-bold">Totem Digital</h2>
        <p className="text-muted-foreground text-sm max-w-xs">
          Transforme qualquer tablet em um totem de autoatendimento. Clientes fazem pedidos sozinhos com interface otimizada.
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
