"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Karcis } from "@/components/Karcis";
import { TombolKirim } from "@/components/TombolKirim";
import { AreaTeks, Isian, Kolom, Pilihan, Tombol, ariaKolom, cx } from "@/components/ui";
import { selesaiKerja, selesaikanNota, ubahStatus } from "@/lib/actions/antrean";
import type { KartuAntreanData } from "@/lib/antrean";
import { jam, km, rupiah, tanggalPendek, tautanWhatsApp, waktu } from "@/lib/format";
import type { MetodeBayar } from "@/lib/types";

type Mode = "pengelola" | "mekanik";

export function KartuAntrean({
  data,
  mode,
  userId,
  tampilkanTanggal = false,
}: {
  data: KartuAntreanData;
  mode: Mode;
  userId: string;
  tampilkanTanggal?: boolean;
}) {
  const [proses, mulai] = useTransition();
  const [formKm, setFormKm] = useState(false);
  const [metode, setMetode] = useState<MetodeBayar>("tunai");

  function jalankan(aksi: () => Promise<{ ok: boolean; pesan: string }>, konfirmasi?: string) {
    if (konfirmasi && !window.confirm(konfirmasi)) return;
    mulai(async () => {
      const hasil = await aksi();
      if (hasil.ok) toast.success(hasil.pesan);
      else toast.error(hasil.pesan);
    });
  }

  const pengelola = mode === "pengelola";
  const milikMekanikLain =
    mode === "mekanik" && data.servis?.mekanikId != null && data.servis.mekanikId !== userId;

  return (
    <article
      className={cx(
        "rounded-xl border bg-kertas p-3.5 transition-opacity",
        data.status === "dikerjakan" ? "border-montir/40" : "border-garis",
        proses && "opacity-60",
      )}
      aria-busy={proses}
    >
      <div className="flex items-start gap-3">
        <Karcis nomor={data.nomor_antrean} />
        <div className="min-w-0 flex-1">
          <p className="font-papan text-xl leading-tight font-bold tracking-wide">{data.plat}</p>
          <p className="truncate text-sm text-kabut">{data.motor}</p>
        </div>
        <div className="text-right text-sm">
          {tampilkanTanggal ? (
            <p className="font-semibold">{tanggalPendek(data.tanggal).tanggal}</p>
          ) : null}
          <p className="angka text-lg font-bold leading-none">{jam(data.jam_slot)}</p>
          {data.sumber === "walk_in" ? (
            <p className="mt-1 text-xs font-semibold text-oranye">Datang langsung</p>
          ) : null}
        </div>
      </div>

      <div className="mt-3 grid gap-1 text-sm">
        <p>
          <span className="font-semibold">{data.jenis}</span>
          <span className="text-kabut">, sekitar {data.durasiMenit} menit</span>
        </p>
        {data.pelanggan ? <p className="text-kabut">{data.pelanggan}</p> : null}
        {data.keluhan ? (
          <p className="rounded-md bg-latar px-2.5 py-1.5 text-aspal-2">Keluhan: {data.keluhan}</p>
        ) : null}
        {data.servis?.mekanikNama || data.servis?.mulai ? (
          <p className="text-kabut">
            {data.servis?.mekanikNama ? `Mekanik ${data.servis.mekanikNama}` : "Belum ada mekanik"}
            {data.servis?.mulai ? `, mulai ${waktu(data.servis.mulai)}` : ""}
          </p>
        ) : null}
        {data.status === "menunggu_bayar" && data.servis ? (
          <p className="text-kabut">
            {data.servis.km != null ? `Km ${km(data.servis.km)}. ` : ""}
            {data.servis.catatan ? `Catatan: ${data.servis.catatan}` : ""}
          </p>
        ) : null}
      </div>

      {/* Aksi per status. Validasi akhir tetap di database. */}
      <div className="mt-3 flex flex-wrap gap-2">
        {data.status === "menunggu" && pengelola ? (
          <>
            <Tombol ukuran="sm" disabled={proses} onClick={() => jalankan(() => ubahStatus(data.id, "dikonfirmasi"))}>
              Konfirmasi
            </Tombol>
            <Tombol
              ukuran="sm"
              varian="bahaya"
              disabled={proses}
              onClick={() => jalankan(() => ubahStatus(data.id, "batal"), `Batalkan booking ${data.plat}?`)}
            >
              Tolak
            </Tombol>
          </>
        ) : null}

        {data.status === "dikonfirmasi" ? (
          <>
            <Tombol ukuran="sm" disabled={proses} onClick={() => jalankan(() => ubahStatus(data.id, "dikerjakan"))}>
              {mode === "mekanik" ? "Ambil & kerjakan" : "Mulai kerjakan"}
            </Tombol>
            {pengelola ? (
              <Tombol
                ukuran="sm"
                varian="hantu"
                disabled={proses}
                onClick={() => jalankan(() => ubahStatus(data.id, "batal"), `Batalkan antrean ${data.plat}?`)}
              >
                Batalkan
              </Tombol>
            ) : null}
          </>
        ) : null}

        {data.status === "dikerjakan" && !milikMekanikLain ? (
          formKm ? (
            <FormSelesaiKerja data={data} onTutup={() => setFormKm(false)} />
          ) : (
            <Tombol ukuran="sm" disabled={proses} onClick={() => setFormKm(true)}>
              Selesai dikerjakan
            </Tombol>
          )
        ) : null}

        {data.status === "menunggu_bayar" && pengelola ? (
          <div className="grid w-full gap-2">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-kabut">Total sementara</span>
              <span className="angka text-xl font-bold">{rupiah(data.servis?.estimasiTotal ?? 0)}</span>
            </div>
            <div className="flex gap-2">
              <label className="sr-only" htmlFor={`metode-${data.id}`}>
                Metode bayar
              </label>
              <Pilihan
                id={`metode-${data.id}`}
                value={metode}
                onChange={(e) => setMetode(e.target.value as MetodeBayar)}
                className="h-9 flex-1 text-sm"
              >
                <option value="tunai">Tunai</option>
                <option value="qris">QRIS</option>
                <option value="transfer">Transfer</option>
              </Pilihan>
              <Tombol
                ukuran="sm"
                disabled={proses}
                onClick={() => jalankan(() => selesaikanNota(data.id, metode))}
              >
                Lunas & selesai
              </Tombol>
            </div>
            {data.noHp ? (
              <a
                href={tautanWhatsApp(
                  data.noHp,
                  `Halo${data.pelanggan ? ` ${data.pelanggan}` : ""}, motor ${data.plat} sudah selesai diservis dan siap diambil. Terima kasih.`,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-hijau hover:underline"
              >
                <MessageCircle className="size-4" aria-hidden />
                Kabari pelanggan lewat WhatsApp
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function FormSelesaiKerja({ data, onTutup }: { data: KartuAntreanData; onTutup: () => void }) {
  const [state, aksi] = useActionState(selesaiKerja, null);
  const g = state && !state.ok ? state.galat ?? {} : {};
  const v = state && !state.ok ? state.nilai ?? {} : {};

  const terakhir = useRef<typeof state>(null);
  useEffect(() => {
    // Tiap hasil aksi diproses sekali saja, walau kartu dirender ulang oleh realtime.
    if (!state || terakhir.current === state) return;
    terakhir.current = state;
    if (state.ok) {
      toast.success(state.pesan);
      onTutup();
    } else if (!state.galat) {
      toast.error(state.pesan);
    }
  }, [state, onTutup]);

  const idKm = `km-${data.id}`;
  const idCatatan = `catatan-${data.id}`;

  return (
    <form action={aksi} className="grid w-full gap-3 rounded-lg bg-latar p-3">
      <input type="hidden" name="booking_id" value={data.id} />
      <Kolom id={idKm} label="Km di speedometer" petunjuk={`Km terakhir tercatat ${km(data.kmTerakhir)}`} galat={g.km}>
        <Isian
          {...ariaKolom(idKm, g.km, "x")}
          name="km"
          type="number"
          inputMode="numeric"
          min={data.kmTerakhir}
          defaultValue={v.km ?? ""}
          required
          autoFocus
        />
      </Kolom>
      <Kolom id={idCatatan} label="Catatan untuk pelanggan (opsional)" galat={g.catatan}>
        <AreaTeks
          {...ariaKolom(idCatatan, g.catatan)}
          name="catatan"
          defaultValue={v.catatan ?? ""}
          maxLength={1000}
          className="min-h-16"
          placeholder="Rantai kendor sudah disetel, kampas rem tinggal 30%."
        />
      </Kolom>
      <div className="flex gap-2">
        <TombolKirim ukuran="sm" teksProses="Menyimpan…">
          Simpan, siap dibayar
        </TombolKirim>
        <Tombol type="button" ukuran="sm" varian="hantu" onClick={onTutup}>
          Batal
        </Tombol>
      </div>
    </form>
  );
}
