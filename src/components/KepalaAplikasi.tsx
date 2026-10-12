import { LogOut } from "lucide-react";
import { Logo } from "@/components/Logo";
import { NavTautan, type Tautan } from "@/components/NavTautan";
import { keluar } from "@/lib/actions/auth";
import type { Profil } from "@/lib/types";

const NAMA_PERAN: Record<Profil["role"], string> = {
  pelanggan: "Pelanggan",
  admin: "Admin",
  mekanik: "Mekanik",
  pemilik: "Pemilik",
};

export function KepalaAplikasi({ profil, tautan, beranda }: { profil: Profil; tautan: Tautan[]; beranda: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-garis bg-kertas/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <Logo href={beranda} />
        <NavTautan tautan={tautan} />
        <div className="ml-auto flex items-center gap-3">
          <div className="hidden text-right leading-tight sm:block">
            <p className="text-sm font-semibold">{profil.nama}</p>
            <p className="text-xs text-kabut">{NAMA_PERAN[profil.role]}</p>
          </div>
          <form action={keluar}>
            <button
              type="submit"
              className="inline-flex size-9 items-center justify-center rounded-lg text-kabut hover:bg-latar hover:text-aspal"
              aria-label="Keluar"
              title="Keluar"
            >
              <LogOut className="size-4.5" aria-hidden />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
