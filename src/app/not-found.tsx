import Link from "next/link";
import { Logo } from "@/components/Logo";
import { kelasTombol } from "@/components/ui";

export default function TidakDitemukan() {
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex h-16 max-w-6xl items-center px-4">
        <Logo />
      </header>
      <main className="mx-auto max-w-md px-4 pt-16 text-center">
        <p className="angka text-8xl font-bold text-garis">404</p>
        <h1 className="mt-2 font-papan text-3xl font-bold tracking-tight">Halaman tidak ditemukan</h1>
        <p className="mt-2 text-kabut">
          Tautannya mungkin salah ketik, atau kode antrean tidak terdaftar. Periksa lagi kodenya.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/antrean" className={kelasTombol("utama", "md")}>
            Cek antrean
          </Link>
          <Link href="/" className={kelasTombol("kedua", "md")}>
            Ke beranda
          </Link>
        </div>
      </main>
    </div>
  );
}
