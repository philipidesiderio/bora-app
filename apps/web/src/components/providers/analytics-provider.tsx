"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPageview, trackBackend } from "@/lib/analytics";

function NavigationTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirst = useRef(true);

  useEffect(() => {
    const qs = searchParams.toString();
    const url = pathname + (qs ? `?${qs}` : "");

    if (isFirst.current) {
      isFirst.current = false;
      // Rastreia o carregamento inicial da página também
      trackBackend("pageview", { page: pathname });
      return;
    }
    trackPageview(`https://lumipos.com.br${url}`);
  }, [pathname, searchParams]);

  return null;
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <NavigationTracker />
      </Suspense>
      {children}
    </>
  );
}
