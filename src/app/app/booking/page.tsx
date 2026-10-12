import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { JudulHalaman, Kosong } from "@/components/ui";
import { getProfil } from "@/lib/auth";
import { hariIniWIB } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Bengkel, JenisServis, Motor } from "@/lib/types";
import { FormBooking } from "./FormBooking";

export const metadata: Metadata = { title: "Booking servis" };

export default async function HalamanBooking() {
  const profil = await getProfil();
  const supabase = await createClient();

  // MVP: satu bengkel. Skema sudah siap banyak bengkel (lihat bengkel_id).
  const [{ data: bengkel }, { data: motor }] = await Promise.all([
    supabase
      .from("bengkel")
      .select("id, nama, alamat, no_wa, jam_buka, jam_tutup, durasi_slot_menit, kapasitas_per_slot")
      .order("created_at")
      .limit(1)
      .maybeSingle(),
    supabase
      .from("motor")
      .select("id, plat_nomor, merk, tipe, km_terakhir")
      .eq("pemilik_id", profil!.id)
      .order("created_at"),
  ]);

  if (!motor || motor.length === 0) redirect("/app/motor/baru?lanjut=booking");

  if (!bengkel) {
    return (
      <Kosong
        judul="Bengkel belum disiapkan"
        keterangan="Admin perlu menjalankan seed data bengkel di Supabase terlebih dahulu."
      />
    );
  }

  const { data: jenis } = await supabase
    .from("jenis_servis")
    .select("id, nama, deskripsi, harga_jasa, durasi_menit")
    .eq("bengkel_id", bengkel.id)
    .eq("aktif", true)
    .order("nama");

  return (
    <div className="grid gap-6">
      <JudulHalaman judul="Booking servis" keterangan={`${bengkel.nama}${bengkel.alamat ? `, ${bengkel.alamat}` : ""}`} />
      <FormBooking
        bengkel={bengkel as Bengkel}
        motor={motor as Pick<Motor, "id" | "plat_nomor" | "merk" | "tipe" | "km_terakhir">[]}
        jenisServis={(jenis ?? []) as Pick<JenisServis, "id" | "nama" | "deskripsi" | "harga_jasa" | "durasi_menit">[]}
        hariIni={hariIniWIB()}
      />
    </div>
  );
}
