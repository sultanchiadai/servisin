import type { Metadata } from "next";
import { JudulHalaman } from "@/components/ui";
import { FormMotor } from "./FormMotor";

export const metadata: Metadata = { title: "Tambah motor" };

export default async function HalamanTambahMotor({
  searchParams,
}: {
  searchParams: Promise<{ lanjut?: string }>;
}) {
  const { lanjut } = await searchParams;
  return (
    <div className="grid gap-6">
      <JudulHalaman
        judul="Tambah motor"
        keterangan="Km terakhir dipakai untuk menghitung kapan servis berikutnya. Isi perkiraan saja kalau tidak ingat pasti."
      />
      <FormMotor lanjut={lanjut === "booking" ? "booking" : ""} />
    </div>
  );
}
