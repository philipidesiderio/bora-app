"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, Scissors, Image, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";

type ServicoForm = { name: string; price: string; description: string; imageUrl: string };

const emptyForm: ServicoForm = { name: "", price: "", description: "", imageUrl: "" };

// Mock data for demo
const mockServicos = [
  { id: "1", name: "Corte Feminino", price: 45, description: "Corte moderno", imageUrl: "" },
  { id: "2", name: "Corte Masculino", price: 30, description: "Corte clássico", imageUrl: "" },
  { id: "3", name: "Pintura", price: 80, description: "Coloração completa", imageUrl: "" },
];

export default function ServicosPage() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ServicoForm>(emptyForm);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [servicos, setServicos] = useState(mockServicos);

  function openNew() { setForm(emptyForm); setEditId(null); setImagePreview(null); setOpen(true); }
  function openEdit(s: typeof servicos[0]) {
    setForm({ name: s.name, price: String(s.price), description: s.description, imageUrl: s.imageUrl });
    setEditId(s.id);
    setImagePreview(s.imageUrl || null);
    setOpen(true);
  }

  function handleSubmit() {
    if (!form.name.trim() || !form.price) { toast.error("Nome e preço são obrigatórios"); return; }
    if (editId) {
      setServicos(prev => prev.map(s => s.id === editId ? { ...s, name: form.name, price: Number(form.price), description: form.description, imageUrl: form.imageUrl } : s));
      toast.success("Serviço atualizado!");
    } else {
      setServicos(prev => [...prev, { id: Date.now().toString(), name: form.name, price: Number(form.price), description: form.description, imageUrl: form.imageUrl }]);
      toast.success("Serviço criado!");
    }
    setOpen(false);
    setForm(emptyForm);
    setImagePreview(null);
  }

  function handleDelete(id: string) {
    setServicos(prev => prev.filter(s => s.id !== id));
    toast.success("Serviço removido!");
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setForm(f => ({ ...f, imageUrl: result }));
      };
      reader.readAsDataURL(file);
    }
  }

  const filteredServicos = servicos.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Serviços</h1>
          <p className="text-sm text-muted-foreground">{servicos.length} serviços cadastrados</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4" /> Novo Serviço</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar serviços..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filteredServicos.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Scissors className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhum serviço encontrado</p>
          <p className="text-sm mt-1">Clique em "Novo Serviço" para começar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredServicos.map(s => (
            <Card key={s.id} className="p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                {s.imageUrl ? (
                  <img src={s.imageUrl} alt={s.name} className="w-16 h-16 rounded-xl object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center">
                    <Scissors className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex-1">
                <p className="font-semibold">{s.name}</p>
                {s.description && <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>}
              </div>
              <p className="text-lg font-bold text-primary">{formatCurrency(s.price)}</p>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Editar Serviço" : "Novo Serviço"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {/* Image Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Foto do serviço</label>
              <div className="flex items-center gap-4">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-24 h-24 rounded-xl object-cover" />
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-muted flex items-center justify-center">
                    <Image className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                    <Upload className="w-4 h-4" /> Upload foto
                  </span>
                </label>
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Nome *</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome do serviço" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Preço *</label>
              <Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0,00" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Descrição</label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descrição do serviço" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit}>{editId ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
