import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { Isian, Kolom, Panel, ariaKolom } from "@/components/ui";
import { TombolKirim } from "@/components/TombolKirim";

export const metadata: Metadata = { title: "Cek antrean" };

async function cari(formData: FormData) {
  "use server";
  const kode = String(formData.get("kode") ?? "")
    .toUpperCase()
    .replace(/[^0-9A-F]/g, "")
    .slice(0, 8);
  redirect(kode.length === 8 ? `/antrean/${kode}` : "/antrean?galat=1");
}

export default async function HalamanCekAntrean({ searchParams }: { searchParams: Promise<{ galat?: string }> }) {
  const { galat } = await searchParams;
  const pesan = galat ? "Kode antrean terdiri dari 8 karakter, contoh: 78C68A98." : undefined;

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex h-16 max-w-6xl items-center px-4">
        <Logo />
      </header>
      <main className="mx-auto max-w-md px-4 pt-6 pb-16">
        <Panel className="p-6">
          <h1 className="font-papan text-4xl font-bold tracking-tight">Cek antrean</h1>
          <p className="mt-1 text-kabut">Masukkan kode yang kamu dapat saat booking atau dari kasir bengkel.</p>
          <form action={cari} className="mt-6 grid gap-4">
            <Kolom id="kode" label="Kode antrean" galat={pesan}>
              <Isian
                {...ariaKolom("kode", pesan)}
                autoCapitalize="characters"
                autoComplete="off"
                maxLength={12}
                className="angka h-14 text-center text-3xl font-bold tracking-[0.2em] uppercase"
                required
              />
            </Kolom>
            <TombolKirim ukuran="lg" teksProses="Mencari…">
              Lihat status
            </TombolKirim>
          </form>
        </Panel>
      </main>
    </div>
  );
}
