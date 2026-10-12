"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getProfil } from "@/lib/auth";
import { pesanGalat } from "@/lib/galat";
import { createClient } from "@/lib/supabase/server";
import { galatField, nilaiForm, skemaBooking, skemaMotor } from "@/lib/validasi";
import type { HasilAksi } from "@/lib/types";

export async function tambahMotor(_prev: HasilAksi | null, formData: FormData): Promise<HasilAksi> {
  const nilai = nilaiForm(formData);
  const profil = await getProfil();
  if (!profil) redirect("/login");

  const hasil = skemaMotor.safeParse(Object.fromEntries(formData));
  if (!hasil.success) return { ok: false, pesan: "Periksa lagi data motornya.", galat: galatField(hasil.error), nilai };

  const supabase = await createClient();
  const { error } = await supabase.from("motor").insert({ ...hasil.data, pemilik_id: profil.id });
  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        pesan: "Plat nomor ini sudah terdaftar. Jika ini motormu, hubungi bengkel untuk memindahkannya ke akunmu.",
        galat: { plat_nomor: "Plat sudah terdaftar" },
        nilai,
      };
    }
    return { ok: false, pesan: pesanGalat(error), nilai };
  }

  revalidatePath("/app");
  const lanjut = formData.get("lanjut");
  redirect(lanjut === "booking" ? "/app/booking" : "/app?motor=baru");
}

export async function buatBooking(_prev: HasilAksi | null, formData: FormData): Promise<HasilAksi> {
  const nilai = nilaiForm(formData);
  const hasil = skemaBooking.safeParse(Object.fromEntries(formData));
  if (!hasil.success) return { ok: false, pesan: "Lengkapi pilihan booking.", galat: galatField(hasil.error), nilai };

  const { motor_id, jenis_servis_id, tanggal, jam_slot, keluhan } = hasil.data;
  const supabase = await createClient();
  const { data: kode, error } = await supabase.rpc("buat_booking", {
    p_motor_id: motor_id,
    p_jenis_servis_id: jenis_servis_id,
    p_tanggal: tanggal,
    p_jam_slot: jam_slot,
    p_keluhan: keluhan ?? null,
  });
  if (error || !kode) return { ok: false, pesan: pesanGalat(error), nilai };

  revalidatePath("/app");
  redirect(`/antrean/${kode}?baru=1`);
}

export async function batalkanBooking(bookingId: string): Promise<HasilAksi> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("batalkan_booking_saya", { p_booking_id: bookingId });
  if (error) return { ok: false, pesan: pesanGalat(error) };
  revalidatePath("/app");
  return { ok: true, pesan: "Booking dibatalkan." };
}
