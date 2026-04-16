"use client";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, Package, ImagePlus, X } from "lucide-react";
import { api } from "@/components/providers/trpc-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatCurrency, cn } from "@/lib/utils";

type ProductForm = {
  name: string;
  price: string;
  costPrice: string;
  stock: string;
  type: "product" | "service" | "combo";
  trackStock: boolean;
  showInStore: boolean;
  categoryId: string;
  imageUrl: string;
};

const emptyForm: ProductForm = {
  name: "", price: "", costPrice: "", stock: "0",
  type: "product", trackStock: true, showInStore: true, categoryId: "", imageUrl: "",
};

const TYPE_OPTIONS = [
  { value: "product", label: "Produto" },
  { value: "service", label: "Serviço" },
  { value: "combo",   label: "Combo" },
];

export default function ProdutosPage() {
  const [search, setSearch]   = useState("");
  const [open, setOpen]       = useState(false);
  const [editId, setEditId]   = useState<string | null>(null);
  const [form, setForm]       = useState<ProductForm>(emptyForm);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const utils = api.useUtils();

  const { data: products = [], isLoading } = api.products.list.useQuery({ search, limit: 100 });
  const { data: categories = [] }          = api.products.listCategories.useQuery();

  const createMut = api.products.create.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      toast.success("Produto criado!");
      setOpen(false);
      setForm(emptyForm);
      setImagePreview(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMut = api.products.update.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      toast.success("Produto atualizado!");
      setOpen(false);
      setEditId(null);
      setForm(emptyForm);
      setImagePreview(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMut = api.products.delete.useMutation({
    onSuccess: () => { utils.products.list.invalidate(); toast.success("Produto removido!"); },
    onError: (e) => toast.error(e.message),
  });

  function openNew() {
    setForm(emptyForm);
    setEditId(null);
    setImagePreview(null);
    setOpen(true);
  }

  function openEdit(p: any) {
    setForm({
      name:        p.name,
      price:       p.price,
      costPrice:   p.cost_price ?? "",
      stock:       String(p.stock ?? 0),
      type:        p.type,
      trackStock:  p.track_stock ?? true,
      showInStore: p.show_in_store ?? true,
      categoryId:  p.category_id ?? "",
      imageUrl:    p.image_url ?? "",
    });
    setImagePreview(p.image_url ?? null);
    setEditId(p.id);
    setOpen(true);
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      setImagePreview(url);
      setForm(f => ({ ...f, imageUrl: url }));
    };
    reader.readAsDataURL(file);
  }

  function handleSubmit() {
    const data = {
      name: form.name,
      price: Number(form.price),
      costPrice: form.costPrice ? Number(form.costPrice) : undefined,
      stock: Number(form.stock),
      minStock: 0,
      type: form.type,
      trackStock: form.trackStock,
      showInStore: form.showInStore,
      categoryId: form.categoryId || undefined,
      imageUrl: form.imageUrl || undefined,
    };
    if (editId) updateMut.mutate({ ...data, id: editId });
    else createMut.mutate(data);
  }

  const typeLabels: Record<string, string> = { product: "Produto", service: "Serviço", combo: "Combo" };

  return (
    <div className="space-y-5 pb-28 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Produtos</h1>
          <p className="text-sm text-muted-foreground">{products.length} produto{products.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={openNew} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Novo
        </Button>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar produtos..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Grid de produtos */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhum produto encontrado</p>
          <p className="text-sm mt-1">Clique em "Novo" para começar</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {products.map((p: any) => (
            <div key={p.id} className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
              {/* Imagem */}
              <div className="aspect-square bg-muted relative">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-8 h-8 text-muted-foreground/40" />
                  </div>
                )}
                {/* Ações */}
                <div className="absolute top-1.5 right-1.5 flex gap-1">
                  <button
                    onClick={() => openEdit(p)}
                    className="w-7 h-7 rounded-lg bg-white/90 backdrop-blur-sm shadow flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <Pencil className="h-3 w-3 text-foreground" />
                  </button>
                  <button
                    onClick={() => deleteMut.mutate({ id: p.id })}
                    className="w-7 h-7 rounded-lg bg-white/90 backdrop-blur-sm shadow flex items-center justify-center hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </button>
                </div>
                {/* Badge tipo */}
                <div className="absolute bottom-1.5 left-1.5">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-black/50 text-white backdrop-blur-sm">
                    {typeLabels[p.type] ?? p.type}
                  </span>
                </div>
              </div>
              {/* Info */}
              <div className="p-2.5 flex-1 flex flex-col justify-between">
                <p className="text-xs font-semibold leading-tight line-clamp-2">{p.name}</p>
                <div className="mt-1.5 flex items-center justify-between">
                  <p className="text-sm font-bold text-primary">{formatCurrency(Number(p.price))}</p>
                  {p.track_stock && (
                    <span className={cn(
                      "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                      (p.stock ?? 0) <= (p.min_stock ?? 5)
                        ? "bg-rose-100 text-rose-700"
                        : "bg-emerald-100 text-emerald-700"
                    )}>
                      {p.stock ?? 0} un
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog Novo/Editar */}
      <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) { setImagePreview(null); } }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Editar Produto" : "Novo Produto"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Upload de foto */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Foto do produto</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "relative w-full h-40 rounded-xl border-2 border-dashed cursor-pointer transition-all flex items-center justify-center overflow-hidden",
                  imagePreview ? "border-primary/30" : "border-border hover:border-primary/50 hover:bg-muted/30"
                )}
              >
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      onClick={e => { e.stopPropagation(); setImagePreview(null); setForm(f => ({ ...f, imageUrl: "" })); }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <ImagePlus className="w-8 h-8 mx-auto mb-1 opacity-50" />
                    <p className="text-xs">Clique para adicionar foto</p>
                    <p className="text-[10px] opacity-60">JPG, PNG ou WebP · máx 5MB</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>

            {/* Nome */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Nome *</label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Nome do produto"
              />
            </div>

            {/* Preços */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Preço de venda *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <Input
                    type="number"
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    placeholder="0,00"
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Custo</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <Input
                    type="number"
                    value={form.costPrice}
                    onChange={e => setForm(f => ({ ...f, costPrice: e.target.value }))}
                    placeholder="0,00"
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            {/* Tipo */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Tipo</label>
              <div className="grid grid-cols-3 gap-2">
                {TYPE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, type: opt.value as ProductForm["type"] }))}
                    className={cn(
                      "py-2 rounded-lg border text-sm font-medium transition-all",
                      form.type === opt.value
                        ? "bg-primary text-white border-primary"
                        : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/60"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Categoria */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Categoria</label>
              <select
                value={form.categoryId}
                onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="">Sem categoria</option>
                {categories.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                ))}
              </select>
            </div>

            {/* Estoque */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Estoque inicial</label>
              <Input
                type="number"
                value={form.stock}
                onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                placeholder="0"
              />
            </div>

            {/* Toggles */}
            <div className="flex gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => setForm(f => ({ ...f, trackStock: !f.trackStock }))}
                  className={cn(
                    "w-10 h-6 rounded-full transition-colors relative",
                    form.trackStock ? "bg-primary" : "bg-muted"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all",
                    form.trackStock ? "left-5" : "left-1"
                  )} />
                </div>
                <span className="text-sm">Controlar estoque</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => setForm(f => ({ ...f, showInStore: !f.showInStore }))}
                  className={cn(
                    "w-10 h-6 rounded-full transition-colors relative",
                    form.showInStore ? "bg-primary" : "bg-muted"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all",
                    form.showInStore ? "left-5" : "left-1"
                  )} />
                </div>
                <span className="text-sm">Mostrar na loja</span>
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.name || !form.price || createMut.isPending || updateMut.isPending}
            >
              {createMut.isPending || updateMut.isPending ? "Salvando..." : editId ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
