"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { TombolKirim } from "@/components/TombolKirim";
import { AreaTeks, Isian, Kolom, Panel, Pilihan, Tombol, ariaKolom } from "@/components/ui";
import { tambahWalkIn } from "@/lib/actions/antrean";
import { rupiah } from "@/lib/format";

interface Jenis {
  id: string;
  nama: string;
  harga_jasa: number;
}

/** Pelanggan datang langsung tanpa booking: masukkan ke antrean hari ini. */
export function FormWalkIn({ jenisServis }: { jenisServis: Jenis[] }) {
  const [buka, setBuka] = useState(false);
  const [state, aksi] = useActionState(tambahWalkIn, null);
  const formRef = useRef<HTMLFormElement>(null);
  const terakhir = useRef<typeof state>(null);
  const g = state && !state.ok ? state.galat ?? {} : {};
  const v = state && !state.ok ? state.nilai ?? {} : {};

  useEffect(() => {
    if (!state || terakhir.current === state) return;
    terakhir.current = state;
    if (state.ok) {
      toast.success(state.pesan, { duration: 8000 });
      formRef.current?.reset();
      setBuka(false);
    }
  }, [state]);

  if (!buka) {
    return (
      <Tombol varian="kedua" onClick={() => setBuka(true)}>
        Tambah pelanggan datang langsung
      </Tombol>
    );
  }

  return (
    <Panel className="w-full p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-papan text-2xl font-bold tracking-tight">Pelanggan datang langsung</h2>
          <p className="text-sm text-kabut">Langsung masuk antrean hari ini dengan status antre.</p>
        </div>
        <Tombol varian="hantu" ukuran="sm" onClick={() => setBuka(false)}>
          Tutup
        </Tombol>
      </div>

      {state && !state.ok ? (
        <p role="alert" className="mt-4 rounded-lg bg-merah-muda px-4 py-3 text-sm font-medium text-merah">
          {state.pesan}
        </p>
      ) : null}

      <form ref={formRef} action={aksi} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" noValidate>
        <Kolom id="plat_nomor" label="Plat nomor" galat={g.plat_nomor}>
          <Isian
            {...ariaKolom("plat_nomor", g.plat_nomor)}
            defaultValue={v.plat_nomor}
            autoCapitalize="characters"
            autoComplete="off"
            placeholder="L 1234 AB"
            className="font-papan text-lg font-bold tracking-wide uppercase"
            required
            autoFocus
          />
        </Kolom>
        <Kolom id="merk" label="Merk" galat={g.merk}>
          <Isian {...ariaKolom("merk", g.merk)} defaultValue={v.merk} placeholder="Honda" required />
        </Kolom>
        <Kolom id="tipe" label="Tipe" galat={g.tipe}>
          <Isian {...ariaKolom("tipe", g.tipe)} defaultValue={v.tipe} placeholder="Beat" required />
        </Kolom>
        <Kolom id="nama" label="Nama pelanggan (opsional)" galat={g.nama}>
          <Isian {...ariaKolom("nama", g.nama)} defaultValue={v.nama} autoComplete="off" />
        </Kolom>
        <Kolom id="no_hp" label="No. WhatsApp (opsional)" petunjuk="Untuk kabar siap diambil & pengingat." galat={g.no_hp}>
          <Isian {...ariaKolom("no_hp", g.no_hp, "x")} defaultValue={v.no_hp} type="tel" inputMode="tel" autoComplete="off" />
        </Kolom>
        <Kolom id="jenis_servis_id" label="Jenis servis" galat={g.jenis_servis_id}>
          <Pilihan {...ariaKolom("jenis_servis_id", g.jenis_servis_id)} defaultValue={v.jenis_servis_id ?? ""} required>
            <option value="" disabled>
              Pilih servis
            </option>
            {jenisServis.map((j) => (
              <option key={j.id} value={j.id}>
                {j.nama} ({rupiah(j.harga_jasa)})
              </option>
            ))}
          </Pilihan>
        </Kolom>
        <div className="sm:col-span-2 lg:col-span-3">
          <Kolom id="keluhan_walkin" label="Keluhan (opsional)" galat={g.keluhan}>
            <AreaTeks
              {...ariaKolom("keluhan_walkin", g.keluhan)}
              name="keluhan"
              defaultValue={v.keluhan}
              maxLength={500}
              className="min-h-16"
            />
          </Kolom>
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <TombolKirim teksProses="Memasukkan…">Masukkan ke antrean</TombolKirim>
        </div>
      </form>
    </Panel>
  );
}
