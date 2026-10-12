function wajib(nama: string, nilai: string | undefined): string {
  if (!nilai) {
    throw new Error(`Environment variable ${nama} belum diisi. Lihat .env.example.`);
  }
  return nilai;
}

// Diakses lewat fungsi agar error baru muncul saat dipakai, bukan saat build.
export const env = {
  supabaseUrl: () => wajib("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: () => wajib("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  serviceRoleKey: () => wajib("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY),
  cronSecret: () => wajib("CRON_SECRET", process.env.CRON_SECRET),
  siteUrl: () => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
};
