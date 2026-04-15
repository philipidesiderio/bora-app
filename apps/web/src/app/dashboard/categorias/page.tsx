"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, FolderOpen } from "lucide-react";
import { api } from "@/components/providers/trpc-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const EMOJI_OPTIONS = ["🍔", "🍕", "🍜", "🍰", "☕", "🍺", "🎁", "💄", "👕", "👟", "🏠", "✂️", "💇", "🚗", "📱", "🎮", "📚", "🏋️", "🌿", "🎨"];

const COLOR_OPTIONS = [
  "bg-red-500", "bg-orange-500", "bg-amber-500", "bg-yellow-500", "bg-lime-500", 
  "bg-green-500", "bg-emerald-500", "bg-teal-500", "bg-cyan-500", "bg-sky-500",
  "bg-blue-500", "bg-indigo-500", "bg-violet-500", "bg-purple-500", "bg-fuchsia-500",
  "bg-pink-500", "bg-rose-500"
];

type CategoryForm = { name: string; emoji: string; color: string };

const emptyForm: CategoryForm = { name: "", emoji: "📦", color: "bg-primary" };

export default function CategoriasPage() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const utils = api.useUtils();

  const { data: categories = [], isLoading } = api.products.listCategories.useQuery();

  const createMut = api.products.createCategory.useMutation({
    onSuccess: () => { utils.products.listCategories.invalidate(); toast.success("Categoria criada!"); setOpen(false); setForm(emptyForm); },
    onError: (e) => toast.error(e.message),
  });

  const updateMut = api.products.updateCategory.useMutation({
    onSuccess: () => { utils.products.listCategories.invalidate(); toast.success("Categoria atualizada!"); setOpen(false); setEditId(null); setForm(emptyForm); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMut = api.products.deleteCategory.useMutation({
    onSuccess: () => { utils.products.listCategories.invalidate(); toast.success("Categoria removida!"); },
    onError: (e) => toast.error(e.message),
  });

  function openNew() { setForm(emptyForm); setEditId(null); setOpen(true); }
  function openEdit(c: typeof categories[0]) {
    setForm({ name: c.name, emoji: c.emoji ?? "📦", color: c.color ?? "bg-primary" });
    setEditId(c.id);
    setOpen(true);
  }

  function handleSubmit() {
    if (!form.name.trim()) { toast.error("Nome é obrigatório"); return; }
    if (editId) updateMut.mutate({ id: editId, ...form });
    else createMut.mutate(form);
  }

  const filteredCategories = categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5 pb-28 md:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Categorias</h1>
          <p className="text-sm text-muted-foreground">{categories.length} categorias cadastradas</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4" /> Nova Categoria</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar categorias..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhuma categoria encontrada</p>
          <p className="text-sm mt-1">Clique em "Nova Categoria" para começar</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredCategories.map(c => (
            <Card key={c.id} className="p-4 flex flex-col items-center text-center gap-3 hover:shadow-md transition-shadow">
              <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center text-3xl", c.color ?? "bg-primary")}>
                {c.emoji}
              </div>
              <p className="font-semibold">{c.name}</p>
              <div className="flex gap-1 mt-auto">
                <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => deleteMut.mutate({ id: c.id })} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Editar Categoria" : "Nova Categoria"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Nome *</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome da categoria" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Emoji</label>
              <div className="flex flex-wrap gap-2">
                {EMOJI_OPTIONS.map(emoji => (
                  <button key={emoji} onClick={() => setForm(f => ({ ...f, emoji }))} className={cn("w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all", form.emoji === emoji ? "bg-primary/20 ring-2 ring-primary" : "bg-muted hover:bg-muted/80")}>
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Cor</label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map(color => (
                  <button key={color} onClick={() => setForm(f => ({ ...f, color }))} className={cn("w-8 h-8 rounded-full transition-all", color, form.color === color ? "ring-2 ring-offset-2 ring-primary" : "")} />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={!form.name || createMut.isPending || updateMut.isPending}>
              {editId ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
