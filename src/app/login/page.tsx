import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { BERANDA_PERAN, getProfil } from "@/lib/auth";
import { pathAman } from "@/lib/validasi";
import { FormLogin } from "./FormLogin";

export const metadata: Metadata = { title: "Masuk" };

const PESAN_GALAT: Record<string, string> = {
  tautan: "Tautan konfirmasi sudah kedaluwarsa atau tidak valid. Silakan masuk atau daftar ulang.",
  google: "Masuk dengan Google gagal. Coba lagi atau pakai email.",
};

export default async function HalamanLogin({
  searchParams,
}: {
  searchParams: Promise<{ lanjut?: string; galat?: string; mode?: string }>;
}) {
  const { lanjut, galat, mode } = await searchParams;
  const profil = await getProfil();
  if (profil) redirect(pathAman(lanjut, BERANDA_PERAN[profil.role]));

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center px-4">
        <Logo />
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pt-6 pb-16 sm:pt-12">
        <FormLogin
          lanjut={pathAman(lanjut, "")}
          modeAwal={mode === "daftar" ? "daftar" : "masuk"}
          galatAwal={galat ? PESAN_GALAT[galat] : undefined}
        />
      </main>
    </div>
  );
}
