import type { Metadata } from "next";
import { KepalaAplikasi } from "@/components/KepalaAplikasi";
import { PapanAntrean } from "@/components/antrean/PapanAntrean";
import { SegarkanRealtime } from "@/components/SegarkanRealtime";
import { JudulHalaman, Kosong } from "@/components/ui";
import { ambilAntrean } from "@/lib/antrean";
import { wajibPeran } from "@/lib/auth";
import { hariIniWIB, tanggalPanjang } from "@/lib/format";

export const metadata: Metadata = { title: "Tugas mekanik" };

export default async function HalamanMekanik() {
  const profil = await wajibPeran(["mekanik"]);
  const hariIni = hariIniWIB();
  const antrean = profil.bengkel_id ? await ambilAntrean(profil.bengkel_id, hariIni) : [];
  const tugasSaya = antrean.filter((a) => a.status === "dikerjakan" && a.servis?.mekanikId === profil.id).length;

  return (
    <>
      <KepalaAplikasi profil={profil} beranda="/mekanik" tautan={[{ href: "/mekanik", label: "Tugas hari ini" }]} />
      <main className="mx-auto max-w-4xl px-4 pt-8 pb-28 md:pb-16">
        {!profil.bengkel_id ? (
          <Kosong
            judul="Akun belum terhubung ke bengkel"
            keterangan="Minta admin menjalankan fungsi jadikan_staf untuk akunmu."
          />
        ) : (
          <div className="grid gap-6">
            <JudulHalaman
              judul={tugasSaya > 0 ? `${tugasSaya} motor sedang kamu kerjakan` : "Tugas hari ini"}
              keterangan={`${tanggalPanjang(hariIni)}. Ambil motor dari kolom antre, isi km saat selesai.`}
              aksi={<SegarkanRealtime bengkelId={profil.bengkel_id} />}
            />
            <PapanAntrean data={antrean} mode="mekanik" userId={profil.id} />
          </div>
        )}
      </main>
    </>
  );
}
