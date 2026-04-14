// Script para criar usuário admin usando Better Auth
// Execute com: pnpm exec tsx apps/web/scripts/create-admin.ts
import { authClient } from "../src/lib/auth-client";

async function createAdminUser() {
  console.log("Criando usuário admin@admin.com...");
  
  try {
    // Tentar criar usuário via Better Auth (mesma API do sistema de cadastro)
    const { data, error } = await authClient.signUp.email({
      email: "admin@admin.com",
      password: "admin123",
      name: "Admin",
    }, {
      // Headers necessários para Better Auth funcionar fora do browser
      headers: {
        "Origin": "http://localhost:3000",
      }
    });
    
    if (error) {
      console.error("Erro ao criar usuário:", error.message);
    } else {
      console.log("Usuário criado com sucesso!", data.user?.id);
      console.log("Email de verificação enviado!");
    }
  } catch (err: any) {
    console.error("Erro:", err.message || err);
  }
}

createAdminUser();
