"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, Package } from "lucide-react";
import { api } from "@/components/providers/trpc-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectItem } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";

type ProductForm = {
  name: string;
  price: string;
  costPrice: string;
  stock: string;
  minStock: string;
  type: "product" | "service" | "combo";
  trackStock: boolean;
  showInStore: boolean;
  categoryId: string;
};

const emptyForm: ProductForm = {
  name: "", price: "", costPrice: "", stock: "0", minStock: "5",
  type: "product", trackStock: true, showInStore: true, categoryId: "",
};

export default function ProdutosPage() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const utils = api.useUtils();

  const { data: products = [], isLoading } = api.products.list.useQuery({ search, limit: 100 });
  const { data: categories = [] } = api.products.listCategories.useQuery();

  const createMut = api.products.create.useMutation({
    onSuccess: () => { utils.products.list.invalidate(); toast.success("Produto criado!"); setOpen(false); setForm(emptyForm); },
    onError: (e) => toast.error(e.message),
  });

  const updateMut = api.products.update.useMutation({
    onSuccess: () => { utils.products.list.invalidate(); toast.success("Produto atualizado!"); setOpen(false); setEditId(null); setForm(emptyForm); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMut = api.products.delete.useMutation({
    onSuccess: () => { utils.products.list.invalidate(); toast.success("Produto removido!"); },
    onError: (e) => toast.error(e.message),
  });

  function openNew() { setForm(emptyForm); setEditId(null); setOpen(true); }
  function openEdit(p: typeof products[0]) {
    setForm({
      name: p.name, price: p.price, costPrice: p.costPrice ?? "",
      stock: String(p.stock ?? 0), minStock: String(p.minStock ?? 5),
      type: p.type, trackStock: p.trackStock ?? true,
      showInStore: p.showInStore ?? true, categoryId: p.categoryId ?? "",
    });
    setEditId(p.id);
    setOpen(true);
  }

  function handleSubmit() {
    const data = {
      name: form.name, price: Number(form.price), costPrice: form.costPrice ? Number(form.costPrice) : undefined,
      stock: Number(form.stock), minStock: Number(form.minStock),
      type: form.type, trackStock: form.trackStock, showInStore: form.showInStore,
      categoryId: form.categoryId || undefined,
    };
    if (editId) { updateMut.mutate({ ...data, id: editId }); }
    else { createMut.mutate(data); }
  }

  const typeLabels = { product: "Produto", service: "Serviço", combo: "Combo" };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Produtos</h1>
          <p className="text-sm text-muted-foreground">{products.length} produtos cadastrados</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4" /> Novo Produto</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar produtos..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhum produto encontrado</p>
          <p className="text-sm mt-1">Clique em "Novo Produto" para começar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map(p => (
            <Card key={p.id} className="p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{p.name}</p>
                  <Badge variant="outline" className="mt-1 text-[10px]">{typeLabels[p.type as keyof typeof typeLabels]}</Badge>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => deleteMut.mutate({ id: p.id })} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="mt-auto">
                <p className="text-lg font-bold text-primary">{formatCurrency(Number(p.price))}</p>
                {p.trackStock && (
                  <p className={`text-xs mt-0.5 ${(p.stock ?? 0) <= (p.minStock ?? 5) ? "text-red-500" : "text-muted-foreground"}`}>
                    Estoque: {p.stock ?? 0} un
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? "Editar Produto" : "Novo Produto"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome do produto" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Preço de venda *</Label>
                <Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0,00" />
              </div>
              <div className="space-y-1.5">
                <Label>Custo</Label>
                <Input type="number" value={form.costPrice} onChange={e => setForm(f => ({ ...f, costPrice: e.target.value }))} placeholder="0,00" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Estoque inicial</Label>
                <Input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Estoque mínimo</Label>
                <Input type="number" value={form.minStock} onChange={e => setForm(f => ({ ...f, minStock: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as typeof form.type }))}>
                  <SelectItem value="product">Produto</SelectItem>
                  <SelectItem value="service">Serviço</SelectItem>
                  <SelectItem value="combo">Combo</SelectItem>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Categoria</Label>
                <Select value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
                  <SelectItem value="">Sem categoria</SelectItem>
                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.emoji} {c.name}</SelectItem>)}
                </Select>
              </div>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.trackStock} onChange={e => setForm(f => ({ ...f, trackStock: e.target.checked }))} className="rounded" />
                <span className="text-sm">Controlar estoque</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.showInStore} onChange={e => setForm(f => ({ ...f, showInStore: e.target.checked }))} className="rounded" />
                <span className="text-sm">Mostrar na loja</span>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={!form.name || !form.price || createMut.isPending || updateMut.isPending}>
              {editId ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
