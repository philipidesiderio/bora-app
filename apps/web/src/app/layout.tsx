import type { Metadata } from "next";
import { Bricolage_Grotesque, Nunito, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { TRPCReactProvider } from "@/components/providers/trpc-provider";
import { Toaster } from "@/components/ui/sonner";
import "@/styles/globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Bora.app", template: "%s | Bora.app" },
  description: "Gestão completa do seu negócio na palma da mão.",
  keywords: ["pdv", "ponto de venda", "gestão", "vendas", "estoque", "nota fiscal"],
  authors: [{ name: "Bora.app" }],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://bora.app",
    siteName: "Bora.app",
    title: "Bora.app — Gestão do seu negócio",
    description: "PDV, mini loja online, estoque, financeiro e muito mais.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${bricolage.variable} ${nunito.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <TRPCReactProvider>
            {children}
            <Toaster richColors position="top-right" />
          </TRPCReactProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
