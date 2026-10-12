"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BERANDA_PERAN } from "@/lib/auth";
import { env } from "@/lib/env";
import { galatField, nilaiForm, pathAman, skemaDaftar, skemaMasuk } from "@/lib/validasi";
import type { HasilAksi, Peran } from "@/lib/types";

async function asalSitus() {
  const h = await headers();
  return h.get("origin") ?? env.siteUrl();
}

export async function masuk(_prev: HasilAksi | null, formData: FormData): Promise<HasilAksi> {
  const nilai = nilaiForm(formData);
  const hasil = skemaMasuk.safeParse(Object.fromEntries(formData));
  if (!hasil.success) return { ok: false, pesan: "Periksa lagi isianmu.", galat: galatField(hasil.error), nilai };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(hasil.data);
  if (error || !data.user) {
    if (error?.code === "email_not_confirmed") {
      return { ok: false, pesan: "Email belum dikonfirmasi. Cek kotak masuk emailmu.", nilai };
    }
    // Pesan sama untuk email salah & sandi salah agar keberadaan akun tidak bisa ditebak.
    return { ok: false, pesan: "Email atau kata sandi salah.", nilai };
  }

  const { data: profil } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
  const tujuanPeran = BERANDA_PERAN[(profil?.role as Peran) ?? "pelanggan"];
  redirect(pathAman(formData.get("lanjut"), tujuanPeran));
}

export async function daftar(_prev: HasilAksi | null, formData: FormData): Promise<HasilAksi> {
  const nilai = nilaiForm(formData);
  const hasil = skemaDaftar.safeParse(Object.fromEntries(formData));
  if (!hasil.success) return { ok: false, pesan: "Periksa lagi isianmu.", galat: galatField(hasil.error), nilai };

  const { nama, no_hp, email, password } = hasil.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nama, no_hp },
      emailRedirectTo: `${await asalSitus()}/auth/callback?lanjut=/app`,
    },
  });

  if (error) {
    if (error.code === "user_already_exists") {
      return { ok: false, pesan: "Email ini sudah terdaftar. Silakan masuk.", nilai };
    }
    if (error.code === "weak_password") {
      return { ok: false, pesan: "Kata sandi terlalu lemah. Pakai kombinasi huruf dan angka.", nilai };
    }
    return { ok: false, pesan: "Pendaftaran gagal. Coba lagi beberapa saat lagi.", nilai };
  }

  // Jika konfirmasi email aktif di Supabase, sesi belum ada sampai tautan di email diklik.
  if (!data.session) {
    return { ok: true, pesan: `Akun dibuat. Cek email ${email} lalu klik tautan konfirmasi untuk masuk.` };
  }
  redirect("/app");
}

export async function masukGoogle(formData: FormData) {
  const supabase = await createClient();
  const lanjut = pathAman(formData.get("lanjut"), "/app");
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${await asalSitus()}/auth/callback?lanjut=${encodeURIComponent(lanjut)}` },
  });
  if (error || !data.url) redirect("/login?galat=google");
  redirect(data.url);
}

export async function keluar() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
