import type { Metadata } from "next";
import { Syne, DM_Sans, DM_Mono } from "next/font/google";
import Script from "next/script";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { TRPCReactProvider } from "@/components/providers/trpc-provider";
import { AnalyticsProvider } from "@/components/providers/analytics-provider";
import { PwaInstallBanner } from "@/components/pwa-install-banner";
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
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "lumiPOS",
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/icons/icon-192.svg",
  },
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
        {process.env.NEXT_PUBLIC_GTM_ID && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${process.env.NEXT_PUBLIC_GTM_ID}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <TRPCReactProvider>
            <AnalyticsProvider>
              {children}
              <PwaInstallBanner />
              <Toaster richColors position="top-right" />
            </AnalyticsProvider>
          </TRPCReactProvider>
        </ThemeProvider>
        <Script id="register-sw" strategy="afterInteractive">{`
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js');
          }
        `}</Script>
        {process.env.NEXT_PUBLIC_GTM_ID && (
          <Script id="gtm" strategy="afterInteractive">{`
            window.dataLayer=window.dataLayer||[];
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
            var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
            j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
            f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${process.env.NEXT_PUBLIC_GTM_ID}');
          `}</Script>
        )}
      </body>
    </html>
  );
}
