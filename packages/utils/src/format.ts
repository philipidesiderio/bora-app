export const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export const formatDate = (d: Date | string) =>
  new Intl.DateTimeFormat("pt-BR", { day:"2-digit", month:"2-digit", year:"numeric" }).format(new Date(d));

export const formatDatetime = (d: Date | string) =>
  new Intl.DateTimeFormat("pt-BR", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" }).format(new Date(d));

export const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9\s-]/g,"").replace(/\s+/g,"-").trim();

export const getInitials = (name: string) =>
  name.split(" ").slice(0,2).map(n => n[0]).join("").toUpperCase();
