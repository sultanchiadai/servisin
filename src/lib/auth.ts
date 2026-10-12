import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Peran, Profil } from "@/lib/types";

export const BERANDA_PERAN: Record<Peran, string> = {
  pelanggan: "/app",
  admin: "/admin",
  mekanik: "/mekanik",
  pemilik: "/pemilik",
};

/** Profil pengguna yang sedang login, atau null. Di-cache per request. */
export const getProfil = cache(async (): Promise<Profil | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, nama, no_hp, role, bengkel_id")
    .eq("id", user.id)
    .single();

  return data ? { ...(data as Profil), email: user.email } : null;
});

/**
 * Wajib login dengan salah satu peran. Peran lain diarahkan ke berandanya.
 * Ini lapisan tampilan; keamanan data tetap dijaga RLS di database.
 */
export async function wajibPeran(peran: Peran[]): Promise<Profil> {
  const profil = await getProfil();
  if (!profil) redirect("/login");
  if (!peran.includes(profil.role)) redirect(BERANDA_PERAN[profil.role]);
  return profil;
}
