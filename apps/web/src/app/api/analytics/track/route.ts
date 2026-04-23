import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

// ─── Supabase (service role para contornar RLS) ───────────────────────────────
function getSupa() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

// ─── IP helpers ───────────────────────────────────────────────────────────────
function getIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

function hashIp(ip: string): string {
  return createHash("sha256").update(ip + "lumipos-salt-2026").digest("hex").slice(0, 16);
}

// ─── Geo lookup (ipapi.co — free, sem API key, 1 000 req/dia) ────────────────
const geoCache = new Map<string, { country_code: string; country: string; city: string; state: string } | null>();

async function lookupGeo(ip: string) {
  if (ip === "unknown" || ip.startsWith("127.") || ip.startsWith("::1") || ip.startsWith("192.168.")) {
    return null;
  }
  if (geoCache.has(ip)) return geoCache.get(ip)!;

  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: { "User-Agent": "lumiPOS/1.0" },
      signal: AbortSignal.timeout(2_000),
    });
    if (!res.ok) { geoCache.set(ip, null); return null; }
    const data = await res.json() as any;
    const geo = {
      country_code: (data.country_code as string) ?? "",
      country:      (data.country_name  as string) ?? "",
      city:         (data.city          as string) ?? "",
      state:        (data.region        as string) ?? "",
    };
    geoCache.set(ip, geo);
    return geo;
  } catch {
    geoCache.set(ip, null);
    return null;
  }
}

// ─── UA parsing ───────────────────────────────────────────────────────────────
function parseUA(ua: string) {
  ua = ua.toLowerCase();

  const device =
    /mobile|android.*mobile|iphone|windows phone/.test(ua) ? "mobile" :
    /ipad|android(?!.*mobile)|tablet/.test(ua)             ? "tablet" : "desktop";

  const os =
    /android/.test(ua) ? "android" :
    /iphone|ipad|ipod/.test(ua) ? "ios" :
    /windows/.test(ua) ? "windows" :
    /mac os/.test(ua)  ? "macos"   :
    /linux/.test(ua)   ? "linux"   : "other";

  const browser =
    /edg\//.test(ua)    ? "edge"    :
    /chrome\//.test(ua) ? "chrome"  :
    /safari\//.test(ua) ? "safari"  :
    /firefox\//.test(ua)? "firefox" : "other";

  return { device, os, browser };
}

// ─── POST /api/analytics/track ────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      event: string;
      page?: string;
      plan?: string;
      session_id?: string;
    };

    const ip    = getIp(req);
    const ua    = req.headers.get("user-agent") ?? "";
    const { device, os, browser } = parseUA(ua);
    const geo   = await lookupGeo(ip);

    const supa  = getSupa();
    await supa.from("site_analytics").insert({
      event:        body.event,
      page:         body.page         ?? null,
      plan:         body.plan         ?? null,
      session_id:   body.session_id   ?? null,
      ip_hash:      hashIp(ip),
      device,
      os,
      browser,
      country_code: geo?.country_code ?? null,
      country:      geo?.country      ?? null,
      city:         geo?.city         ?? null,
      state:        geo?.state        ?? null,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    // Nunca deixa o tracker quebrar a experiência do usuário
    console.error("[analytics/track]", e);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
