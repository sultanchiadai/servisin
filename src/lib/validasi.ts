import { z } from "zod";

const kosongJadiUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

const noHp = z
  .string()
  .trim()
  .transform((s) => s.replace(/[^0-9+]/g, ""))
  .pipe(z.string().regex(/^(\+62|62|0)8[0-9]{7,12}$/, "Nomor HP tidak valid. Contoh: 081234567890"));

const platNomor = z
  .string()
  .trim()
  .toUpperCase()
  .transform((s) => s.replace(/[^A-Z0-9]/g, ""))
  .refine((s) => /^[A-Z]{1,2}[0-9]{1,4}[A-Z]{0,3}$/.test(s), "Format plat tidak valid. Contoh: L 1234 AB")
  .transform((s) => s.replace(/^([A-Z]{1,2})([0-9]{1,4})([A-Z]{0,3})$/, "$1 $2 $3").trim());

const uuid = z.string().uuid("Pilihan tidak valid");

export const skemaMasuk = z.object({
  email: z.string().trim().toLowerCase().email("Alamat email tidak valid"),
  password: z.string().min(1, "Isi kata sandi"),
});

export const skemaDaftar = z.object({
  nama: z.string().trim().min(2, "Nama minimal 2 huruf").max(100, "Nama terlalu panjang"),
  no_hp: noHp,
  email: z.string().trim().toLowerCase().email("Alamat email tidak valid"),
  password: z.string().min(8, "Kata sandi minimal 8 karakter").max(72, "Kata sandi maksimal 72 karakter"),
});

export const skemaMotor = z.object({
  plat_nomor: platNomor,
  merk: z.string().trim().min(1, "Isi merk motor").max(50),
  tipe: z.string().trim().min(1, "Isi tipe motor").max(50),
  tahun: z.preprocess(
    kosongJadiUndefined,
    z.coerce
      .number({ invalid_type_error: "Tahun harus angka" })
      .int()
      .min(1970, "Tahun minimal 1970")
      .max(new Date().getFullYear() + 1, "Tahun tidak valid")
      .optional(),
  ),
  km_terakhir: z.preprocess(
    kosongJadiUndefined,
    z.coerce.number({ invalid_type_error: "Km harus angka" }).int().min(0, "Km tidak boleh minus").max(2_000_000).default(0),
  ),
});

export const skemaBooking = z.object({
  motor_id: uuid,
  jenis_servis_id: uuid,
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pilih tanggal"),
  jam_slot: z.string().regex(/^\d{2}:\d{2}$/, "Pilih jam"),
  keluhan: z.preprocess(kosongJadiUndefined, z.string().trim().max(500, "Maksimal 500 karakter").optional()),
});

export const skemaWalkIn = z.object({
  plat_nomor: platNomor,
  merk: z.string().trim().min(1, "Isi merk motor").max(50),
  tipe: z.string().trim().min(1, "Isi tipe motor").max(50),
  nama: z.preprocess(kosongJadiUndefined, z.string().trim().max(100).optional()),
  no_hp: z.preprocess(kosongJadiUndefined, noHp.optional()),
  jenis_servis_id: uuid,
  keluhan: z.preprocess(kosongJadiUndefined, z.string().trim().max(500, "Maksimal 500 karakter").optional()),
});

export const skemaSelesaiKerja = z.object({
  booking_id: uuid,
  km: z.coerce.number({ invalid_type_error: "Km harus angka" }).int().min(0, "Km tidak boleh minus").max(2_000_000),
  catatan: z.preprocess(kosongJadiUndefined, z.string().trim().max(1000, "Maksimal 1000 karakter").optional()),
});

/** Ubah error Zod menjadi { namaField: pesanPertama }. */
export function galatField(error: z.ZodError): Record<string, string> {
  const hasil: Record<string, string> = {};
  for (const [field, pesan] of Object.entries(error.flatten().fieldErrors)) {
    if (Array.isArray(pesan) && pesan[0]) hasil[field] = pesan[0];
  }
  return hasil;
}

/** Isian form sebagai teks, tanpa field rahasia, untuk dikembalikan saat error. */
export function nilaiForm(formData: FormData, kecuali: string[] = ["password"]): Record<string, string> {
  const hasil: Record<string, string> = {};
  formData.forEach((v, k) => {
    if (typeof v === "string" && !kecuali.includes(k) && !k.startsWith("$")) hasil[k] = v;
  });
  return hasil;
}

/** Hanya izinkan redirect ke path internal (cegah open redirect). */
export function pathAman(nilai: unknown, cadangan = "/"): string {
  if (typeof nilai !== "string") return cadangan;
  if (!nilai.startsWith("/") || nilai.startsWith("//") || nilai.includes("\\")) return cadangan;
  return nilai;
}
