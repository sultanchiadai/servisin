interface GalatSupabase {
  code?: string;
  message: string;
}

/**
 * Pesan error yang aman ditampilkan ke pengguna.
 * Pesan dari RAISE EXCEPTION di fungsi database (kode P0001) sudah ramah pengguna;
 * error lain dicatat di server dan diganti pesan umum agar detail sistem tidak bocor.
 */
export function pesanGalat(error: GalatSupabase | null | undefined): string {
  if (!error) return "Terjadi kesalahan. Coba lagi.";
  switch (error.code) {
    case "P0001":
      return error.message;
    case "23505":
      return "Data ini sudah terdaftar.";
    case "23514":
      return "Ada isian yang tidak sesuai aturan. Periksa lagi formulirnya.";
    case "42501":
      return "Kamu tidak punya akses untuk tindakan ini.";
    default:
      console.error("[supabase]", error);
      return "Terjadi kesalahan. Coba lagi.";
  }
}
