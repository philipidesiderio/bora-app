"use client";
import { FileText, Shield, Receipt } from "lucide-react";

export default function FiscalPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Fiscal</h1>
        <p className="text-sm text-muted-foreground">Configurações fiscais e notas</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="p-6 rounded-2xl border border-border bg-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Receipt className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">NF-e</p>
              <p className="text-xs text-muted-foreground">Nota Fiscal Eletrônica</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Em breve</p>
          <button className="w-full py-2 rounded-xl border border-dashed border-border text-sm text-muted-foreground" disabled>
            Em breve
          </button>
        </div>

        <div className="p-6 rounded-2xl border border-border bg-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center">
              <Receipt className="h-5 w-5 text-secondary-foreground" />
            </div>
            <div>
              <p className="font-semibold">NFC-e</p>
              <p className="text-xs text-muted-foreground">Nota do Consumidor</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Em breve</p>
          <button className="w-full py-2 rounded-xl border border-dashed border-border text-sm text-muted-foreground" disabled>
            Em breve
          </button>
        </div>

        <div className="p-6 rounded-2xl border border-border bg-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <Shield className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="font-semibold">SAT</p>
              <p className="text-xs text-muted-foreground">Cupom Fiscal</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Em breve</p>
          <button className="w-full py-2 rounded-xl border border-dashed border-border text-sm text-muted-foreground" disabled>
            Em breve
          </button>
        </div>
      </div>

      <div className="p-6 rounded-2xl border border-border bg-muted/30">
        <div className="flex items-center gap-3 mb-3">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <p className="font-semibold">ECF / Bematech / Daruma</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Integração com impressoras fiscais. Em breve.
        </p>
      </div>
    </div>
  );
}