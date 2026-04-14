// Script para criar usuário admin via API fetch
// Execute com: pnpm exec tsx apps/web/scripts/create-admin.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://hyyqcrjfcsdqxoxbmwod.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5eXFjcmpmY3NkcXhveGJtd29kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTg1NjE4MCwiZXhwIjoyMDkxNDMyMTgwfQ.s0oBlKoEnI4QHYIdUmv53RBcmtSQnY8b1WG9ZkTDqe4";

// Usar API REST ao invés de conexão direta
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
