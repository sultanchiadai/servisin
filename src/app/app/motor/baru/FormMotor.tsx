"use client";

import { useActionState } from "react";
import { TombolKirim } from "@/components/TombolKirim";
import { Isian, Kolom, Panel, ariaKolom } from "@/components/ui";
import { tambahMotor } from "../../actions";

export function FormMotor({ lanjut }: { lanjut: string }) {
  const [state, aksi] = useActionState(tambahMotor, null);
  const g = state && !state.ok ? state.galat ?? {} : {};
  const v = state && !state.ok ? state.nilai ?? {} : {};

  return (
    <Panel className="p-5 sm:p-6">
      {state && !state.ok ? (
        <p role="alert" className="mb-5 rounded-lg bg-merah-muda px-4 py-3 text-sm font-medium text-merah">
          {state.pesan}
        </p>
      ) : null}
      <form action={aksi} className="grid gap-4 sm:grid-cols-2" noValidate>
        <input type="hidden" name="lanjut" value={lanjut} />
        <div className="sm:col-span-2">
          <Kolom id="plat_nomor" label="Plat nomor" petunjuk="Contoh: L 1234 AB" galat={g.plat_nomor}>
            <Isian
              {...ariaKolom("plat_nomor", g.plat_nomor, "x")}
              defaultValue={v.plat_nomor}
              autoCapitalize="characters"
              autoComplete="off"
              className="font-papan text-lg font-bold tracking-wide uppercase"
              required
            />
          </Kolom>
        </div>
        <Kolom id="merk" label="Merk" galat={g.merk}>
          <Isian {...ariaKolom("merk", g.merk)} defaultValue={v.merk} placeholder="Honda" list="daftar-merk" required />
        </Kolom>
        <Kolom id="tipe" label="Tipe" galat={g.tipe}>
          <Isian {...ariaKolom("tipe", g.tipe)} defaultValue={v.tipe} placeholder="Vario 125" required />
        </Kolom>
        <Kolom id="tahun" label="Tahun (opsional)" galat={g.tahun}>
          <Isian {...ariaKolom("tahun", g.tahun)} defaultValue={v.tahun} type="number" inputMode="numeric" min={1970} />
        </Kolom>
        <Kolom id="km_terakhir" label="Km di speedometer saat ini" galat={g.km_terakhir}>
          <Isian
            {...ariaKolom("km_terakhir", g.km_terakhir)}
            defaultValue={v.km_terakhir}
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="12000"
          />
        </Kolom>
        <datalist id="daftar-merk">
          <option value="Honda" />
          <option value="Yamaha" />
          <option value="Suzuki" />
          <option value="Kawasaki" />
          <option value="TVS" />
          <option value="Vespa" />
        </datalist>
        <div className="sm:col-span-2">
          <TombolKirim ukuran="lg" className="w-full sm:w-auto" teksProses="Menyimpan…">
            {lanjut === "booking" ? "Simpan dan lanjut booking" : "Simpan motor"}
          </TombolKirim>
        </div>
      </form>
    </Panel>
  );
}
