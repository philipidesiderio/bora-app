"use client";
import { Smartphone, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function DispositivosPage() {
  return (
    <div className="max-w-lg mx-auto pb-28 md:pb-6">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard/ajustes" className="p-2 rounded-xl hover:bg-muted transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-heading text-xl font-bold">Dispositivos</h1>
          <p className="text-xs text-muted-foreground">Terminais e PDVs cadastrados</p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
          <Smartphone className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="font-heading text-lg font-bold">Dispositivos</h2>
        <p className="text-muted-foreground text-sm max-w-xs">
          Gerencie os terminais autorizados a operar o sistema: celulares, tablets e computadores.
        </p>
        <span className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full font-medium">
          Em breve
        </span>
      </div>
    </div>
  );
}
