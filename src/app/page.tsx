import Link from "next/link";
import { Karcis } from "@/components/Karcis";
import { Logo } from "@/components/Logo";
import { kelasTombol } from "@/components/ui";
import { BERANDA_PERAN, getProfil } from "@/lib/auth";

const LANGKAH = [
  {
    judul: "Booking dari HP",
    isi: "Pilih motor, jenis servis, dan jam datang. Slot yang sudah penuh tidak bisa dipilih, jadi tidak ada rebutan.",
  },
  {
    judul: "Pantau antrean",
    isi: "Nomor antreanmu bergerak sendiri di layar. Datang saat giliranmu dekat, tidak perlu duduk berjam-jam.",
  },
  {
    judul: "Diingatkan servis berikutnya",
    isi: "Setelah servis, bengkel mengirim pengingat lewat WhatsApp saat jadwal ganti oli atau servis rutin tiba.",
  },
];

const UNTUK_BENGKEL = [
  ["Papan antrean live", "Booking online dan pelanggan yang datang langsung masuk ke satu antrean."],
  ["Riwayat tiap motor", "Mekanik tahu kapan oli dan kampas terakhir diganti tanpa bertanya."],
  ["Stok terpotong sendiri", "Sparepart di nota langsung mengurangi stok dan tercatat di log."],
  ["Laporan harian", "Pendapatan, servis per mekanik, dan stok yang hampir habis dalam satu layar."],
];

export default async function Beranda() {
  const profil = await getProfil();
  const tujuanBooking = profil ? BERANDA_PERAN[profil.role] : "/login?lanjut=/app/booking";

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Logo />
        <nav className="flex items-center gap-2">
          <Link href="/antrean" className={kelasTombol("hantu", "sm")}>
            Cek antrean
          </Link>
          {profil ? (
            <Link href={BERANDA_PERAN[profil.role]} className={kelasTombol("kedua", "sm")}>
              Buka aplikasi
            </Link>
          ) : (
            <Link href="/login" className={kelasTombol("kedua", "sm")}>
              Masuk
            </Link>
          )}
        </nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-10 pb-16 md:grid-cols-[1.15fr_1fr] md:pt-16 md:pb-24">
          <div>
            <h1 className="font-papan text-5xl font-bold leading-[0.95] tracking-tight text-balance sm:text-7xl">
              Servis motor tanpa menunggu lama di bengkel.
            </h1>
            <p className="mt-5 max-w-[34rem] text-lg leading-relaxed text-aspal-2">
              Booking jam servis dari HP, lihat nomor antreanmu bergerak, dan datang saat giliranmu sudah dekat.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={tujuanBooking} className={kelasTombol("utama", "lg")}>
                Booking servis
              </Link>
              <Link href="/antrean" className={kelasTombol("kedua", "lg")}>
                Cek antrean dengan kode
              </Link>
            </div>
          </div>

          {/* Contoh layar status antrean — elemen paling khas dari produk. */}
          <div aria-hidden className="relative mx-auto w-full max-w-sm">
            <div className="rounded-2xl border border-garis bg-kertas p-6 shadow-[0_1px_0_var(--color-garis)]">
              <p className="text-sm font-semibold text-kabut">Nomor antreanmu</p>
              <div className="mt-3 flex items-end justify-between gap-4">
                <Karcis nomor={7} ukuran="sedang" />
                <div className="text-right">
                  <p className="angka text-4xl font-bold leading-none">2</p>
                  <p className="text-sm text-kabut">antrean lagi</p>
                </div>
              </div>
              <div className="mt-6 border-t border-dashed border-garis pt-4">
                <p className="text-sm text-kabut">Sedang dikerjakan</p>
                <div className="mt-2 flex gap-2">
                  <Karcis nomor={4} redup />
                  <Karcis nomor={5} redup />
                </div>
              </div>
              <p className="mt-5 rounded-lg bg-montir-muda px-3 py-2 text-sm font-medium text-montir-tua">
                Servis rutin Vario 125, datang jam 10.00
              </p>
            </div>
          </div>
        </section>

        <section className="border-y border-garis bg-kertas">
          <div className="mx-auto max-w-6xl px-4 py-14">
            <h2 className="font-papan text-3xl font-bold tracking-tight">Cara kerjanya</h2>
            <ol className="mt-8 grid gap-8 md:grid-cols-3">
              {LANGKAH.map((l, i) => (
                <li key={l.judul} className="grid grid-cols-[auto_1fr] gap-4">
                  <span className="angka text-5xl font-bold leading-none text-montir">{i + 1}</span>
                  <div>
                    <h3 className="font-semibold">{l.judul}</h3>
                    <p className="mt-1 text-[15px] leading-relaxed text-kabut">{l.isi}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14">
          <div className="grid gap-10 md:grid-cols-[1fr_1.4fr]">
            <div>
              <h2 className="font-papan text-3xl font-bold tracking-tight">Untuk pemilik bengkel</h2>
              <p className="mt-3 max-w-sm text-kabut">
                Semua yang biasanya tercatat di buku tulis dan chat WhatsApp pribadi, sekarang di satu tempat.
              </p>
            </div>
            <dl className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
              {UNTUK_BENGKEL.map(([judul, isi]) => (
                <div key={judul} className="border-l-2 border-montir pl-4">
                  <dt className="font-semibold">{judul}</dt>
                  <dd className="mt-1 text-[15px] leading-relaxed text-kabut">{isi}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </main>

      <footer className="border-t border-garis">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-sm text-kabut">
          <span>Servisin — karya untuk GTNIC 2026, kategori Web Development.</span>
          <Link href="/login" className="hover:text-aspal">
            Masuk sebagai staf bengkel
          </Link>
        </div>
      </footer>
    </div>
  );
}
