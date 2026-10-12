export type Peran = "pelanggan" | "admin" | "mekanik" | "pemilik";

export type StatusBooking =
  | "menunggu"
  | "dikonfirmasi"
  | "dikerjakan"
  | "menunggu_bayar"
  | "selesai"
  | "batal";

export type MetodeBayar = "tunai" | "qris" | "transfer";

export interface Profil {
  id: string;
  nama: string;
  no_hp: string | null;
  role: Peran;
  bengkel_id: string | null;
  email?: string;
}

export interface Bengkel {
  id: string;
  nama: string;
  alamat: string | null;
  no_wa: string | null;
  jam_buka: string;
  jam_tutup: string;
  durasi_slot_menit: number;
  kapasitas_per_slot: number;
}

export interface Motor {
  id: string;
  pemilik_id: string | null;
  nama_pemilik: string | null;
  no_hp: string | null;
  plat_nomor: string;
  merk: string;
  tipe: string;
  tahun: number | null;
  km_terakhir: number;
}

export interface JenisServis {
  id: string;
  bengkel_id: string;
  nama: string;
  deskripsi: string | null;
  harga_jasa: number;
  durasi_menit: number;
  interval_km: number | null;
  interval_hari: number | null;
  aktif: boolean;
}

export interface Servis {
  id: string;
  mekanik_id: string | null;
  km_saat_servis: number | null;
  catatan: string | null;
  mulai: string | null;
  selesai: string | null;
  total: number;
  metode_bayar: MetodeBayar | null;
}

export interface Booking {
  id: string;
  bengkel_id: string;
  motor_id: string;
  jenis_servis_id: string;
  tanggal: string;
  jam_slot: string;
  nomor_antrean: number;
  kode: string;
  sumber: "online" | "walk_in";
  status: StatusBooking;
  keluhan: string | null;
  created_at: string;
}

/** Booking beserta relasi yang dipakai papan antrean dan halaman pelanggan. */
export interface BookingLengkap extends Booking {
  motor: Pick<Motor, "plat_nomor" | "merk" | "tipe" | "km_terakhir" | "nama_pemilik" | "no_hp">;
  jenis_servis: Pick<JenisServis, "nama" | "durasi_menit" | "harga_jasa">;
  servis: Servis | null;
}

export interface Slot {
  jam_slot: string;
  terisi: number;
  kapasitas: number;
  tersedia: boolean;
}

export interface StatusAntrean {
  kode: string;
  nomor: number;
  status: StatusBooking;
  tanggal: string;
  jam_slot: string;
  jenis_servis: string;
  durasi_menit: number;
  plat: string;
  bengkel: string;
  alamat: string | null;
  posisi: number;
  sedang_dikerjakan: number[];
}

export type HasilAksi =
  | { ok: true; pesan: string }
  | {
      ok: false;
      pesan: string;
      galat?: Record<string, string>;
      /** Isian yang dikirim, agar form tidak kosong lagi setelah error. */
      nilai?: Record<string, string>;
    };
