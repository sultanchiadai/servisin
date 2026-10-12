"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { pesanGalat } from "@/lib/galat";
import { rupiah } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { galatField, nilaiForm, skemaSelesaiKerja, skemaWalkIn } from "@/lib/validasi";
import type { HasilAksi, MetodeBayar } from "@/lib/types";

// Semua aksi di sini hanya meneruskan ke fungsi database. Hak akses (peran,
// bengkel, urutan status) diperiksa di database, bukan dipercaya dari klien.

const idBooking = z.string().uuid();
const statusManual = z.enum(["dikonfirmasi", "dikerjakan", "batal"]);
const metode = z.enum(["tunai", "qris", "transfer"]);

function segarkan() {
  revalidatePath("/admin");
  revalidatePath("/mekanik");
  revalidatePath("/pemilik");
}

const PESAN_STATUS: Record<z.infer<typeof statusManual>, string> = {
  dikonfirmasi: "Booking dikonfirmasi.",
  dikerjakan: "Mulai dikerjakan.",
  batal: "Booking dibatalkan.",
};

export async function ubahStatus(bookingId: string, status: "dikonfirmasi" | "dikerjakan" | "batal"): Promise<HasilAksi> {
  const id = idBooking.safeParse(bookingId);
  const st = statusManual.safeParse(status);
  if (!id.success || !st.success) return { ok: false, pesan: "Permintaan tidak valid." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("ubah_status_booking", { p_booking_id: id.data, p_status: st.data });
  if (error) return { ok: false, pesan: pesanGalat(error) };
  segarkan();
  return { ok: true, pesan: PESAN_STATUS[st.data] };
}

export async function selesaiKerja(_prev: HasilAksi | null, formData: FormData): Promise<HasilAksi> {
  const nilai = nilaiForm(formData);
  const hasil = skemaSelesaiKerja.safeParse(Object.fromEntries(formData));
  if (!hasil.success) return { ok: false, pesan: "Periksa isian km.", galat: galatField(hasil.error), nilai };

  const supabase = await createClient();
  const { error } = await supabase.rpc("selesai_dikerjakan", {
    p_booking_id: hasil.data.booking_id,
    p_km: hasil.data.km,
    p_catatan: hasil.data.catatan ?? null,
  });
  if (error) return { ok: false, pesan: pesanGalat(error), nilai };
  segarkan();
  return { ok: true, pesan: "Selesai dikerjakan. Motor siap dibayar di kasir." };
}

export async function selesaikanNota(bookingId: string, metodeBayar: MetodeBayar): Promise<HasilAksi> {
  const id = idBooking.safeParse(bookingId);
  const mt = metode.safeParse(metodeBayar);
  if (!id.success || !mt.success) return { ok: false, pesan: "Pilih metode pembayaran." };

  const supabase = await createClient();
  const { data: total, error } = await supabase.rpc("selesaikan_servis", {
    p_booking_id: id.data,
    p_metode: mt.data,
  });
  if (error) return { ok: false, pesan: pesanGalat(error) };
  segarkan();
  return { ok: true, pesan: `Nota selesai, total ${rupiah(Number(total ?? 0))}. Stok dan jadwal pengingat diperbarui.` };
}

export async function tambahWalkIn(_prev: HasilAksi | null, formData: FormData): Promise<HasilAksi> {
  const nilai = nilaiForm(formData);
  const hasil = skemaWalkIn.safeParse(Object.fromEntries(formData));
  if (!hasil.success) return { ok: false, pesan: "Periksa lagi isiannya.", galat: galatField(hasil.error), nilai };

  const d = hasil.data;
  const supabase = await createClient();
  const { data: kode, error } = await supabase.rpc("buat_walk_in", {
    p_plat: d.plat_nomor,
    p_merk: d.merk,
    p_tipe: d.tipe,
    p_nama: d.nama ?? null,
    p_no_hp: d.no_hp ?? null,
    p_jenis_servis_id: d.jenis_servis_id,
    p_keluhan: d.keluhan ?? null,
  });
  if (error) return { ok: false, pesan: pesanGalat(error), nilai };
  segarkan();
  return { ok: true, pesan: `${d.plat_nomor} masuk antrean. Kode cek antrean: ${kode}` };
}
