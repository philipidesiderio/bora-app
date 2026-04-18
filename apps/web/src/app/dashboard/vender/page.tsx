import type { Metadata } from "next";
import { PDVScreen } from "@/components/pdv/pdv-screen";

export const metadata: Metadata = { title: "PDV — Vender" };

export default function VenderPage() {
  // The PDV fills the full remaining viewport height.
  // We use negative margins to cancel the layout padding so the PDV
  // can use the full width/height without horizontal overflow.
  return (
    <div
      className="-mx-4 md:-mx-6 -mt-4 md:-mt-6 overflow-hidden h-[calc(100dvh-7.5rem)] md:h-[calc(100dvh-4rem)]"
    >
      <PDVScreen />
    </div>
  );
}
