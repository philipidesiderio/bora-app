import type { Metadata } from "next";
import { Syne, DM_Sans, DM_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { TRPCReactProvider } from "@/components/providers/trpc-provider";
import { Toaster } from "@/components/ui/sonner";
import "@/styles/globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "lumiPOS", template: "%s | lumiPOS" },
  description: "Gestão completa do seu negócio na palma da mão.",
  keywords: ["pdv", "ponto de venda", "gestão", "vendas", "estoque", "nota fiscal"],
  authors: [{ name: "lumiPOS" }],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://lumipos.com",
    siteName: "lumiPOS",
    title: "lumiPOS — Gestão do seu negócio",
    description: "PDV, mini loja online, estoque, financeiro e muito mais.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${syne.variable} ${dmSans.variable} ${dmMono.variable}`}
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
