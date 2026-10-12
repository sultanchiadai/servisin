import { satu } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { StatusBooking } from "@/lib/types";

/** Bentuk data satu kartu di papan antrean (admin & mekanik). */
export interface KartuAntreanData {
  id: string;
  kode: string;
  tanggal: string;
  jam_slot: string;
  nomor_antrean: number;
  status: StatusBooking;
  sumber: "online" | "walk_in";
  keluhan: string | null;
  plat: string;
  motor: string;
  kmTerakhir: number;
  pelanggan: string | null;
  noHp: string | null;
  jenis: string;
  durasiMenit: number;
  servis: {
    mekanikId: string | null;
    mekanikNama: string | null;
    km: number | null;
    catatan: string | null;
    mulai: string | null;
    estimasiTotal: number;
  } | null;
}

const KOLOM = `
  id, kode, tanggal, jam_slot, nomor_antrean, status, sumber, keluhan,
  motor:motor_id ( plat_nomor, merk, tipe, km_terakhir, nama_pemilik, no_hp,
                   pemilik:pemilik_id ( nama, no_hp ) ),
  jenis_servis:jenis_servis_id ( nama, durasi_menit ),
  servis ( mekanik_id, km_saat_servis, catatan, mulai,
           mekanik:mekanik_id ( nama ),
           servis_item ( qty, harga ) )
`;

/* eslint-disable @typescript-eslint/no-explicit-any -- hasil relasi Supabase tanpa tipe hasil generate */
function ubah(b: any): KartuAntreanData {
  const motor = satu<any>(b.motor);
  const pemilik = satu<any>(motor?.pemilik);
  const jenis = satu<any>(b.jenis_servis);
  const servis = satu<any>(b.servis);
  const item: { qty: number; harga: number }[] = servis?.servis_item ?? [];

  return {
    id: b.id,
    kode: b.kode,
    tanggal: b.tanggal,
    jam_slot: b.jam_slot,
    nomor_antrean: b.nomor_antrean,
    status: b.status,
    sumber: b.sumber,
    keluhan: b.keluhan,
    plat: motor?.plat_nomor ?? "-",
    motor: [motor?.merk, motor?.tipe].filter(Boolean).join(" "),
    kmTerakhir: motor?.km_terakhir ?? 0,
    pelanggan: pemilik?.nama ?? motor?.nama_pemilik ?? null,
    noHp: pemilik?.no_hp ?? motor?.no_hp ?? null,
    jenis: jenis?.nama ?? "-",
    durasiMenit: jenis?.durasi_menit ?? 0,
    servis: servis
      ? {
          mekanikId: servis.mekanik_id,
          mekanikNama: satu<any>(servis.mekanik)?.nama ?? null,
          km: servis.km_saat_servis,
          catatan: servis.catatan,
          mulai: servis.mulai,
          estimasiTotal: item.reduce((t, i) => t + i.qty * i.harga, 0),
        }
      : null,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Antrean satu bengkel pada satu tanggal, urut jam lalu nomor. RLS membatasi ke bengkel staf. */
export async function ambilAntrean(bengkelId: string, tanggal: string): Promise<KartuAntreanData[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("booking")
    .select(KOLOM)
    .eq("bengkel_id", bengkelId)
    .eq("tanggal", tanggal)
    .order("jam_slot")
    .order("nomor_antrean");
  if (error) console.error("[antrean]", error);
  return (data ?? []).map(ubah);
}

/** Booking hari-hari berikutnya yang belum dikonfirmasi. */
export async function ambilMenungguKonfirmasi(bengkelId: string, setelahTanggal: string): Promise<KartuAntreanData[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("booking")
    .select(KOLOM)
    .eq("bengkel_id", bengkelId)
    .eq("status", "menunggu")
    .gt("tanggal", setelahTanggal)
    .order("tanggal")
    .order("jam_slot")
    .limit(30);
  if (error) console.error("[antrean]", error);
  return (data ?? []).map(ubah);
}
