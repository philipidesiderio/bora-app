import type { Metadata } from "next";
import { PDVScreen } from "@/components/pdv/pdv-screen";

export const metadata: Metadata = { title: "PDV — Vender" };

export default function VenderPage() {
  return <PDVScreen />;
}
