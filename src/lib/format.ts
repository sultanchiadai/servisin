import type { MetodeBayar, StatusBooking } from "@/lib/types";

const fmtRupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});
const fmtAngka = new Intl.NumberFormat("id-ID");

export const rupiah = (n: number) => fmtRupiah.format(n);
export const km = (n: number) => `${fmtAngka.format(n)} km`;

/** Tanggal hari ini di WIB dalam format YYYY-MM-DD. */
export function hariIniWIB(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
}

export function tambahHari(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function tanggalPanjang(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}

export function tanggalPendek(iso: string): { hari: string; tanggal: string } {
  const d = new Date(`${iso}T00:00:00Z`);
  return {
    hari: new Intl.DateTimeFormat("id-ID", { weekday: "short", timeZone: "UTC" }).format(d),
    tanggal: new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", timeZone: "UTC" }).format(d),
  };
}

export function waktu(isoTimestamp: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(isoTimestamp));
}

/** "09:00:00" → "09.00" (gaya penulisan jam Indonesia). */
export const jam = (t: string) => t.slice(0, 5).replace(":", ".");

export const LABEL_STATUS: Record<StatusBooking, string> = {
  menunggu: "Menunggu konfirmasi",
  dikonfirmasi: "Dalam antrean",
  dikerjakan: "Sedang dikerjakan",
  menunggu_bayar: "Siap dibayar",
  selesai: "Selesai",
  batal: "Dibatalkan",
};

export const LABEL_METODE: Record<MetodeBayar, string> = {
  tunai: "Tunai",
  qris: "QRIS",
  transfer: "Transfer",
};

/** Tautan WhatsApp berisi pesan siap kirim. 08xx → 628xx. */
export function tautanWhatsApp(noHp: string, pesan: string): string {
  const nomor = noHp.replace(/[^0-9]/g, "").replace(/^0/, "62");
  return `https://wa.me/${nomor}?text=${encodeURIComponent(pesan)}`;
}

/**
 * Hasil query Supabase sebagai array bertipe. Proyek ini belum memakai tipe hasil
 * `supabase gen types`; bentuk baris ditulis manual di tiap halaman.
 */
export function baris<T>(data: unknown): T[] {
  return Array.isArray(data) ? (data as T[]) : [];
}

/** Ambil satu objek dari relasi Supabase yang bisa berupa objek atau array. */
export function satu<T>(nilai: T | T[] | null | undefined): T | null {
  if (Array.isArray(nilai)) return nilai[0] ?? null;
  return nilai ?? null;
}
