import { createBrowserClient } from "@supabase/ssr";

/** Klien Supabase untuk komponen client (realtime, rpc publik). */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
