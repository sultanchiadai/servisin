import type { Metadata } from "next";
import Link from "next/link";
import { KepalaAplikasi } from "@/components/KepalaAplikasi";
import { JudulHalaman, Kosong, Panel, kelasTombol } from "@/components/ui";
import { wajibPeran } from "@/lib/auth";
import { baris, hariIniWIB, rupiah, satu, tambahHari, tanggalPanjang } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Laporan" };

interface BarisStok {
  id: string;
  nama: string;
  stok: number;
  stok_minimum: number;
}

/**
 * Ringkasan pemilik. Versi awal: angka hari ini & 7 hari, stok menipis.
 * Grafik dan laporan per mekanik dibangun di tahap dashboard.
 */
export default async function HalamanPemilik() {
  const profil = await wajibPeran(["pemilik"]);
  const hariIni = hariIniWIB();
  const supabase = await createClient();

  if (!profil.bengkel_id) {
    return (
      <Kosong judul="Akun belum terhubung ke bengkel" keterangan="Jalankan fungsi jadikan_staf di Supabase." />
    );
  }

  const awalMinggu = tambahHari(hariIni, -6);
  const [{ data: servisRaw }, { data: stokRaw }] = await Promise.all([
    supabase
      .from("booking")
      .select("tanggal, servis(total)")
      .eq("bengkel_id", profil.bengkel_id)
      .eq("status", "selesai")
      .gte("tanggal", awalMinggu)
      .lte("tanggal", hariIni),
    supabase
      .from("sparepart")
      .select("id, nama, stok, stok_minimum")
      .eq("bengkel_id", profil.bengkel_id)
      .order("stok"),
  ]);

  const selesai = baris<{ tanggal: string; servis: { total: number } | { total: number }[] | null }>(servisRaw).map(
    (b) => ({ tanggal: b.tanggal, total: Number(satu(b.servis)?.total ?? 0) }),
  );
  const hariIniBaris = selesai.filter((b) => b.tanggal === hariIni);
  const stokMenipis = baris<BarisStok>(stokRaw).filter((s) => s.stok <= s.stok_minimum);

  const angka = [
    ["Servis selesai hari ini", String(hariIniBaris.length)],
    ["Pendapatan hari ini", rupiah(hariIniBaris.reduce((t, b) => t + b.total, 0))],
    ["Servis 7 hari terakhir", String(selesai.length)],
    ["Pendapatan 7 hari terakhir", rupiah(selesai.reduce((t, b) => t + b.total, 0))],
  ];

  return (
    <>
      <KepalaAplikasi
        profil={profil}
        beranda="/pemilik"
        tautan={[
          { href: "/pemilik", label: "Laporan" },
          { href: "/admin", label: "Antrean" },
        ]}
      />
      <main className="mx-auto max-w-6xl px-4 pt-8 pb-28 md:pb-16">
        <div className="grid gap-8">
          <JudulHalaman
            judul="Laporan bengkel"
            keterangan={tanggalPanjang(hariIni)}
            aksi={
              <Link href="/admin" className={kelasTombol("kedua", "md")}>
                Buka antrean
              </Link>
            }
          />

          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-garis bg-garis lg:grid-cols-4">
            {angka.map(([label, nilai]) => (
              <div key={label} className="bg-kertas px-4 py-4">
                <dt className="text-sm text-kabut">{label}</dt>
                <dd className="angka mt-1 text-3xl font-bold">{nilai}</dd>
              </div>
            ))}
          </dl>

          <section aria-labelledby="judul-stok">
            <h2 id="judul-stok" className="font-papan text-2xl font-bold tracking-tight">
              Stok menipis
            </h2>
            <div className="mt-4">
              {stokMenipis.length === 0 ? (
                <Kosong judul="Semua stok aman" keterangan="Tidak ada sparepart di bawah batas minimum." />
              ) : (
                <Panel>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-garis text-left text-kabut">
                        <th className="px-4 py-2.5 font-semibold">Sparepart</th>
                        <th className="px-4 py-2.5 text-right font-semibold">Stok</th>
                        <th className="px-4 py-2.5 text-right font-semibold">Minimum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stokMenipis.map((s) => (
                        <tr key={s.id} className="border-b border-garis last:border-0">
                          <td className="px-4 py-2.5">{s.nama}</td>
                          <td className={`angka px-4 py-2.5 text-right text-lg font-bold ${s.stok === 0 ? "text-merah" : "text-oranye"}`}>
                            {s.stok}
                          </td>
                          <td className="angka px-4 py-2.5 text-right text-lg text-kabut">{s.stok_minimum}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Panel>
              )}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
