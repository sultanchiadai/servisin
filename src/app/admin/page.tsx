import type { Metadata } from "next";
import { KartuAntrean } from "@/components/antrean/KartuAntrean";
import { PapanAntrean } from "@/components/antrean/PapanAntrean";
import { SegarkanRealtime } from "@/components/SegarkanRealtime";
import { JudulHalaman, Kosong } from "@/components/ui";
import { ambilAntrean, ambilMenungguKonfirmasi } from "@/lib/antrean";
import { getProfil } from "@/lib/auth";
import { hariIniWIB, rupiah, tanggalPanjang } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { FormWalkIn } from "./FormWalkIn";

export const metadata: Metadata = { title: "Antrean hari ini" };

export default async function HalamanAdmin() {
  const profil = (await getProfil())!;
  if (!profil.bengkel_id) {
    return (
      <Kosong
        judul="Akun belum terhubung ke bengkel"
        keterangan="Jalankan fungsi jadikan_staf di Supabase untuk menghubungkan akun ini ke bengkel."
      />
    );
  }

  const hariIni = hariIniWIB();
  const supabase = await createClient();
  const [antrean, mendatang, { data: jenis }] = await Promise.all([
    ambilAntrean(profil.bengkel_id, hariIni),
    ambilMenungguKonfirmasi(profil.bengkel_id, hariIni),
    supabase
      .from("jenis_servis")
      .select("id, nama, harga_jasa")
      .eq("bengkel_id", profil.bengkel_id)
      .eq("aktif", true)
      .order("nama"),
  ]);

  const selesai = antrean.filter((a) => a.status === "selesai");
  const pendapatan = selesai.reduce((t, a) => t + (a.servis?.estimasiTotal ?? 0), 0);
  const aktif = antrean.filter((a) => a.status !== "selesai" && a.status !== "batal");

  return (
    <div className="grid gap-8">
      <JudulHalaman
        judul="Antrean hari ini"
        keterangan={tanggalPanjang(hariIni)}
        aksi={<SegarkanRealtime bengkelId={profil.bengkel_id} />}
      />

      <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-garis bg-garis">
        {[
          ["Dalam proses", String(aktif.length)],
          ["Selesai", String(selesai.length)],
          ["Pendapatan", rupiah(pendapatan)],
        ].map(([label, nilai]) => (
          <div key={label} className="bg-kertas px-4 py-3">
            <dt className="text-sm text-kabut">{label}</dt>
            <dd className="angka mt-0.5 text-2xl font-bold sm:text-3xl">{nilai}</dd>
          </div>
        ))}
      </dl>

      <FormWalkIn jenisServis={jenis ?? []} />

      <PapanAntrean data={antrean} mode="pengelola" userId={profil.id} />

      {mendatang.length > 0 ? (
        <section aria-labelledby="judul-mendatang">
          <h2 id="judul-mendatang" className="font-papan text-2xl font-bold tracking-tight">
            Booking hari berikutnya yang perlu dikonfirmasi
          </h2>
          <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {mendatang.map((d) => (
              <KartuAntrean key={d.id} data={d} mode="pengelola" userId={profil.id} tampilkanTanggal />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
