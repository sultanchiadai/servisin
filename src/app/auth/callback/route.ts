import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { pathAman } from "@/lib/validasi";

/** Tujuan tautan konfirmasi email dan login Google. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const lanjut = pathAman(searchParams.get("lanjut"), "/app");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${lanjut}`);
  }

  return NextResponse.redirect(`${origin}/login?galat=tautan`);
}
