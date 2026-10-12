import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function tokenCocok(diterima: string | null, rahasia: string) {
  const a = Buffer.from(diterima ?? "");
  const b = Buffer.from(`Bearer ${rahasia}`);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Dipanggil Vercel Cron setiap hari (lihat vercel.json).
 * Vercel mengirim header Authorization: Bearer <CRON_SECRET>.
 */
export async function GET(request: NextRequest) {
  if (!tokenCocok(request.headers.get("authorization"), env.cronSecret())) {
    return NextResponse.json({ galat: "Tidak diizinkan" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("tandai_pengingat_jatuh_tempo");
  if (error) {
    console.error("[cron pengingat]", error);
    return NextResponse.json({ galat: "Gagal memproses pengingat" }, { status: 500 });
  }
  return NextResponse.json({ ditandai: data ?? 0 });
}
