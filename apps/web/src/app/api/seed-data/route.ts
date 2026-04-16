import { NextRequest, NextResponse } from "next/server";
import { db, tenants, customers, products, categories, orders, orderItems } from "@bora/db";

function uid() { return crypto.randomUUID().replace(/-/g, "").slice(0, 24); }

const SEED_SECRET = "bora-seed-2024";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== SEED_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // 1. Buscar tenant existente
    const [tenant] = await db.select().from(tenants).limit(1);
    if (!tenant) {
      return NextResponse.json({ error: "Nenhum tenant encontrado. Execute /api/seed-admin primeiro." }, { status: 400 });
    }
    const tenantId = tenant.id;

    // 2. Criar categorias
    const catIds = {
      bebidas:    uid(),
      lanches:    uid(),
      servicos:   uid(),
      eletronicos: uid(),
    };

    await db.insert(categories).values([
      { id: catIds.bebidas,    tenantId, name: "Bebidas",     emoji: "🥤", color: "bg-blue-500",   order: 1 },
      { id: catIds.lanches,    tenantId, name: "Lanches",     emoji: "🍔", color: "bg-orange-500", order: 2 },
      { id: catIds.servicos,   tenantId, name: "Serviços",    emoji: "✂️", color: "bg-green-500",  order: 3 },
      { id: catIds.eletronicos,tenantId, name: "Eletrônicos", emoji: "📱", color: "bg-purple-500", order: 4 },
    ]).onConflictDoNothing();

    // 3. Criar produtos
    const prodIds = {
      suco:       uid(),
      agua:       uid(),
      cafe:       uid(),
      xburguer:   uid(),
      coxinha:    uid(),
      esfiha:     uid(),
      fone:       uid(),
      carregador: uid(),
    };

    await db.insert(products).values([
      // Bebidas
      { id: prodIds.suco,       tenantId, categoryId: catIds.bebidas,    name: "Suco de Laranja 500ml", type: "product", price: "8.50",  costPrice: "3.00",  stock: 50, minStock: 10, trackStock: true,  isActive: true },
      { id: prodIds.agua,       tenantId, categoryId: catIds.bebidas,    name: "Água Mineral 500ml",    type: "product", price: "3.00",  costPrice: "1.00",  stock: 80, minStock: 20, trackStock: true,  isActive: true },
      { id: prodIds.cafe,       tenantId, categoryId: catIds.bebidas,    name: "Café Expresso",         type: "product", price: "5.50",  costPrice: "1.50",  stock: 30, minStock: 5,  trackStock: true,  isActive: true },
      // Lanches
      { id: prodIds.xburguer,   tenantId, categoryId: catIds.lanches,    name: "X-Burguer Especial",    type: "product", price: "22.90", costPrice: "10.00", stock: 20, minStock: 5,  trackStock: true,  isActive: true },
      { id: prodIds.coxinha,    tenantId, categoryId: catIds.lanches,    name: "Coxinha de Frango",     type: "product", price: "6.00",  costPrice: "2.50",  stock: 40, minStock: 10, trackStock: true,  isActive: true },
      { id: prodIds.esfiha,     tenantId, categoryId: catIds.lanches,    name: "Esfirra de Carne",      type: "product", price: "4.50",  costPrice: "2.00",  stock: 35, minStock: 10, trackStock: true,  isActive: true },
      // Eletrônicos
      { id: prodIds.fone,       tenantId, categoryId: catIds.eletronicos,name: "Fone Bluetooth",        type: "product", price: "89.90", costPrice: "45.00", stock: 8,  minStock: 3,  trackStock: true,  isActive: true },
      { id: prodIds.carregador, tenantId, categoryId: catIds.eletronicos,name: "Carregador USB-C 20W",  type: "product", price: "39.90", costPrice: "18.00", stock: 15, minStock: 5,  trackStock: true,  isActive: true },
    ]).onConflictDoNothing();

    // 4. Criar serviços
    await db.insert(products).values([
      { id: uid(), tenantId, categoryId: catIds.servicos, name: "Corte de Cabelo Masculino", type: "service", price: "35.00", costPrice: "5.00",  stock: 0, trackStock: false, isActive: true },
      { id: uid(), tenantId, categoryId: catIds.servicos, name: "Corte de Cabelo Feminino",  type: "service", price: "60.00", costPrice: "10.00", stock: 0, trackStock: false, isActive: true },
      { id: uid(), tenantId, categoryId: catIds.servicos, name: "Manicure e Pedicure",       type: "service", price: "45.00", costPrice: "8.00",  stock: 0, trackStock: false, isActive: true },
    ]).onConflictDoNothing();

    // 5. Criar clientes
    const clientIds = [uid(), uid(), uid(), uid(), uid()];

    await db.insert(customers).values([
      { id: clientIds[0], tenantId, name: "Ana Paula Souza",       phone: "(11) 98765-4321", email: "ana.souza@email.com",    cpf: "123.456.789-00" },
      { id: clientIds[1], tenantId, name: "Carlos Eduardo Lima",   phone: "(11) 97654-3210", email: "carlos.lima@email.com",  cpf: "987.654.321-00" },
      { id: clientIds[2], tenantId, name: "Fernanda Oliveira",     phone: "(21) 96543-2109", email: "fernanda.oli@email.com", cpf: "456.789.123-00" },
      { id: clientIds[3], tenantId, name: "Ricardo Santos",        phone: "(31) 95432-1098", email: "ricardo.san@email.com",  cpf: "321.654.987-00" },
      { id: clientIds[4], tenantId, name: "Juliana Costa Mendes",  phone: "(41) 94321-0987", email: "ju.costa@email.com",     cpf: "654.321.789-00" },
    ]).onConflictDoNothing();

    // 6. Criar um pedido fechado
    const orderId  = uid();
    const orderId2 = uid();

    await db.insert(orders).values([
      {
        id:            orderId,
        tenantId,
        customerId:    clientIds[0],
        number:        1001,
        channel:       "pdv",
        status:        "delivered",
        paymentMethod: "pix",
        paymentStatus: "paid",
        subtotal:      "31.40",
        discount:      "0",
        discountType:  "flat",
        total:         "31.40",
        tendered:      "31.40",
        changeAmount:  "0",
      },
      {
        id:            orderId2,
        tenantId,
        customerId:    clientIds[1],
        number:        1002,
        channel:       "pdv",
        status:        "delivered",
        paymentMethod: "cash",
        paymentStatus: "paid",
        subtotal:      "28.90",
        discount:      "0",
        discountType:  "flat",
        total:         "28.90",
        tendered:      "30.00",
        changeAmount:  "1.10",
      },
    ]).onConflictDoNothing();

    // 7. Itens dos pedidos
    await db.insert(orderItems).values([
      {
        id:        uid(),
        orderId,
        productId: prodIds.suco,
        name:      "Suco de Laranja 500ml",
        quantity:  2,
        unitPrice: "8.50",
        costPrice: "3.00",
        discount:  "0",
        total:     "17.00",
      },
      {
        id:        uid(),
        orderId,
        productId: prodIds.coxinha,
        name:      "Coxinha de Frango",
        quantity:  2,
        unitPrice: "6.00",
        costPrice: "2.50",
        discount:  "0",
        total:     "12.00",
      },
      {
        id:        uid(),
        orderId,
        productId: prodIds.cafe,
        name:      "Café Expresso",
        quantity:  1,
        unitPrice: "5.50",
        costPrice: "1.50",
        discount:  "0",
        total:     "5.50",
      },
      {
        id:        uid(),
        orderId:   orderId2,
        productId: prodIds.xburguer,
        name:      "X-Burguer Especial",
        quantity:  1,
        unitPrice: "22.90",
        costPrice: "10.00",
        discount:  "0",
        total:     "22.90",
      },
      {
        id:        uid(),
        orderId:   orderId2,
        productId: prodIds.agua,
        name:      "Água Mineral 500ml",
        quantity:  2,
        unitPrice: "3.00",
        costPrice: "1.00",
        discount:  "0",
        total:     "6.00",
      },
    ]).onConflictDoNothing();

    return NextResponse.json({
      ok: true,
      tenantId,
      message: "Dados de teste criados com sucesso!",
      criados: {
        categorias: 4,
        produtos:   8,
        servicos:   3,
        clientes:   5,
        pedidos:    2,
      },
    });
  } catch (err: any) {
    console.error("[seed-data]", err);
    return NextResponse.json({ error: err.message ?? "Erro interno" }, { status: 500 });
  }
}
