export const PLAN_LABELS: Record<string,string> = {
  free:"Grátis", smart:"Smart", pro:"Pro", premium:"Premium",
};
export const PLAN_PRICES: Record<string,number> = {
  free:0, smart:39, pro:69, premium:99,
};
export const PLAN_FEATURES: Record<string,string[]> = {
  free:    ["PDV básico","Cadastros","1 dispositivo"],
  smart:   ["Caixa e estoque","Fiado","Loja online","5 dispositivos"],
  pro:     ["PDV Desktop","Relatórios","Vendedores","7 dispositivos"],
  premium: ["NF-e e NFC-e","SAT","Modo eventos","10 dispositivos"],
};
