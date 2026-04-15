// Script para criar usuário admin via API fetch
// Execute com: pnpm exec tsx apps/web/scripts/create-admin.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

// Usar API REST ao invés de conexão direta
if (!supabaseUrl) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_URL");
if (!supabaseKey) throw new Error("Missing env: SUPABASE_SERVICE_KEY");
const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdminUser() {
  console.log("Criando usuário admin@admin.com via API REST...");
  
  try {
    // Usar a API REST do Supabase para criar usuário
    const { data, error } = await supabase.auth.admin.createUser({
      email: "admin@admin.com",
      password: "admin123",
      email_confirm: true,
      user_metadata: { name: "Admin", role: "admin" }
    });
    
    if (error) {
      console.error("Erro ao criar usuário:", error.message);
    } else {
      console.log("Usuário criado com sucesso!", data.user?.id);
    }
  } catch (err: any) {
    console.error("Erro:", err.message || err);
  }
}

createAdminUser();
