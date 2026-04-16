"use client";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, Scissors, ImagePlus, X } from "lucide-react";
import { api } from "@/components/providers/trpc-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatCurrency, cn } from "@/lib/utils";

type ServicoForm = {
  name: string;
  price: string;
  costPrice: string;
  description: string;
  imageUrl: string;
};

const emptyForm: ServicoForm = {
  name: "", price: "", costPrice: "", description: "", imageUrl: "",
};

export default function ServicosPage() {
  const [search, setSearch]   = useState("");
  const [open, setOpen]       = useState(false);
  const [editId, setEditId]   = useState<string | null>(null);
  const [form, setForm]       = useState<ServicoForm>(emptyForm);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const utils = api.useUtils();

  const { data: servicos = [], isLoading } = api.products.list.useQuery({
    search,
    type: "service",
    limit: 100,
  });

  const createMut = api.products.create.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      toast.success("Serviço criado!");
      setOpen(false);
      setForm(emptyForm);
      setImagePreview(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMut = api.products.update.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      toast.success("Serviço atualizado!");
      setOpen(false);
      setEditId(null);
      setForm(emptyForm);
      setImagePreview(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMut = api.products.delete.useMutation({
    onSuccess: () => { utils.products.list.invalidate(); toast.success("Serviço removido!"); },
    onError: (e) => toast.error(e.message),
  });

  function openNew() {
    setForm(emptyForm);
    setEditId(null);
    setImagePreview(null);
    setOpen(true);
  }

  function openEdit(s: any) {
    setForm({
      name:        s.name,
      price:       String(s.price),
      costPrice:   s.cost_price ?? "",
      description: s.description ?? "",
      imageUrl:    s.image_url ?? "",
    });
    setImagePreview(s.image_url ?? null);
    setEditId(s.id);
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
    if (!form.name.trim() || !form.price) {
      toast.error("Nome e preço são obrigatórios");
      return;
    }
    const data = {
      name:        form.name,
      description: form.description || undefined,
      imageUrl:    form.imageUrl || undefined,
      price:       Number(form.price),
      costPrice:   form.costPrice ? Number(form.costPrice) : undefined,
      stock:       0,
      minStock:    0,
      type:        "service" as const,
      trackStock:  false,
      showInStore: true,
    };
    if (editId) updateMut.mutate({ ...data, id: editId });
    else        createMut.mutate(data);
  }

  return (
    <div className="space-y-5 pb-28 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Serviços</h1>
          <p className="text-sm text-muted-foreground">{servicos.length} serviço{servicos.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={openNew} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Novo
        </Button>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar serviços..."
          className="pl-9"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : servicos.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Scissors className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhum serviço encontrado</p>
          <p className="text-sm mt-1">Clique em "Novo" para começar</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {servicos.map((s: any) => (
            <div key={s.id} className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
              <div className="aspect-square bg-muted relative">
                {s.image_url ? (
                  <img src={s.image_url} alt={s.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Scissors className="w-8 h-8 text-muted-foreground/40" />
                  </div>
                )}
                <div className="absolute top-1.5 right-1.5 flex gap-1">
                  <button
                    onClick={() => openEdit(s)}
                    className="w-7 h-7 rounded-lg bg-white/90 backdrop-blur-sm shadow flex items-center justify-center hover:bg-white"
                  >
                    <Pencil className="h-3 w-3 text-foreground" />
                  </button>
                  <button
                    onClick={() => deleteMut.mutate({ id: s.id })}
                    className="w-7 h-7 rounded-lg bg-white/90 backdrop-blur-sm shadow flex items-center justify-center hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </button>
                </div>
              </div>
              <div className="p-2.5 flex-1 flex flex-col justify-between">
                <p className="text-xs font-semibold leading-tight line-clamp-2">{s.name}</p>
                {s.description && (
                  <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{s.description}</p>
                )}
                <p className="text-sm font-bold text-primary mt-1.5">{formatCurrency(Number(s.price))}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) setImagePreview(null); }}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Editar Serviço" : "Novo Serviço"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Foto */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Foto do serviço</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "relative w-full h-36 rounded-xl border-2 border-dashed cursor-pointer transition-all flex items-center justify-center overflow-hidden",
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
                    <ImagePlus className="w-7 h-7 mx-auto mb-1 opacity-50" />
                    <p className="text-xs">Clique para adicionar foto</p>
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Nome *</label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Nome do serviço"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Preço *</label>
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

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Descrição</label>
              <Input
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Descrição do serviço"
              />
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
