"use client";

import { useActionState, useState } from "react";
import { TombolKirim } from "@/components/TombolKirim";
import { Isian, Kolom, Panel, ariaKolom, cx } from "@/components/ui";
import { daftar, masuk, masukGoogle } from "@/lib/actions/auth";

type Mode = "masuk" | "daftar";

export function FormLogin({ lanjut, modeAwal, galatAwal }: { lanjut: string; modeAwal: Mode; galatAwal?: string }) {
  const [mode, setMode] = useState<Mode>(modeAwal);
  const [stateMasuk, aksiMasuk] = useActionState(masuk, null);
  const [stateDaftar, aksiDaftar] = useActionState(daftar, null);

  const state = mode === "masuk" ? stateMasuk : stateDaftar;
  const g = state && !state.ok ? state.galat ?? {} : {};
  const v = state && !state.ok ? state.nilai ?? {} : {};
  const sukses = state?.ok ? state.pesan : null;
  const galatUmum = state && !state.ok ? state.pesan : galatAwal;

  return (
    <Panel className="w-full max-w-md p-6 sm:p-8">
      <h1 className="font-papan text-4xl font-bold tracking-tight">
        {mode === "masuk" ? "Masuk ke Servisin" : "Buat akun pelanggan"}
      </h1>
      <p className="mt-1 text-kabut">
        {mode === "masuk"
          ? "Pelanggan dan staf bengkel masuk di sini."
          : "Gratis. Dipakai untuk booking dan menerima pengingat servis."}
      </p>

      <div role="tablist" aria-label="Pilih masuk atau daftar" className="mt-6 grid grid-cols-2 rounded-lg bg-latar p-1">
        {(["masuk", "daftar"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={cx(
              "h-9 rounded-md text-sm font-semibold transition-colors",
              mode === m ? "bg-kertas text-aspal shadow-sm" : "text-kabut hover:text-aspal",
            )}
          >
            {m === "masuk" ? "Masuk" : "Daftar"}
          </button>
        ))}
      </div>

      {sukses ? (
        <p role="status" className="mt-6 rounded-lg bg-hijau-muda px-4 py-3 text-sm font-medium text-hijau">
          {sukses}
        </p>
      ) : (
        <>
          {galatUmum ? (
            <p role="alert" className="mt-6 rounded-lg bg-merah-muda px-4 py-3 text-sm font-medium text-merah">
              {galatUmum}
            </p>
          ) : null}

          <form action={mode === "masuk" ? aksiMasuk : aksiDaftar} className="mt-6 grid gap-4" noValidate>
            <input type="hidden" name="lanjut" value={lanjut} />
            {mode === "daftar" ? (
              <>
                <Kolom id="nama" label="Nama lengkap" galat={g.nama}>
                  <Isian {...ariaKolom("nama", g.nama)} defaultValue={v.nama} autoComplete="name" required />
                </Kolom>
                <Kolom id="no_hp" label="Nomor WhatsApp" petunjuk="Untuk pengingat servis. Contoh: 081234567890" galat={g.no_hp}>
                  <Isian
                    {...ariaKolom("no_hp", g.no_hp, "x")}
                    defaultValue={v.no_hp}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    required
                  />
                </Kolom>
              </>
            ) : null}
            <Kolom id="email" label="Email" galat={g.email}>
              <Isian {...ariaKolom("email", g.email)} defaultValue={v.email} type="email" autoComplete="email" required />
            </Kolom>
            <Kolom
              id="password"
              label="Kata sandi"
              petunjuk={mode === "daftar" ? "Minimal 8 karakter." : undefined}
              galat={g.password}
            >
              <Isian
                {...ariaKolom("password", g.password, mode === "daftar" ? "x" : undefined)}
                type="password"
                autoComplete={mode === "masuk" ? "current-password" : "new-password"}
                required
              />
            </Kolom>
            <TombolKirim ukuran="lg" className="mt-2 w-full" teksProses={mode === "masuk" ? "Masuk…" : "Mendaftar…"}>
              {mode === "masuk" ? "Masuk" : "Daftar"}
            </TombolKirim>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-kabut">
            <span className="h-px flex-1 bg-garis" />
            atau
            <span className="h-px flex-1 bg-garis" />
          </div>
          <form action={masukGoogle}>
            <input type="hidden" name="lanjut" value={lanjut || "/app"} />
            <TombolKirim varian="kedua" ukuran="lg" className="w-full" teksProses="Membuka Google…">
              Lanjut dengan Google
            </TombolKirim>
          </form>
        </>
      )}
    </Panel>
  );
}
