"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { AreaTeks, Kolom, Panel, Tombol, ariaKolom, cx } from "@/components/ui";
import { TombolKirim } from "@/components/TombolKirim";
import { baris, jam, rupiah, tambahHari, tanggalPanjang, tanggalPendek } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import type { Bengkel, JenisServis, Motor, Slot } from "@/lib/types";
import { buatBooking } from "../actions";

type MotorRingkas = Pick<Motor, "id" | "plat_nomor" | "merk" | "tipe" | "km_terakhir">;
type JenisRingkas = Pick<JenisServis, "id" | "nama" | "deskripsi" | "harga_jasa" | "durasi_menit">;

const LANGKAH = ["Motor & servis", "Waktu datang", "Konfirmasi"] as const;
const JUMLAH_HARI = 7;

export function FormBooking({
  bengkel,
  motor,
  jenisServis,
  hariIni,
}: {
  bengkel: Bengkel;
  motor: MotorRingkas[];
  jenisServis: JenisRingkas[];
  hariIni: string;
}) {
  const [langkah, setLangkah] = useState(0);
  const [motorId, setMotorId] = useState(motor[0]?.id ?? "");
  const [jenisId, setJenisId] = useState("");
  const [keluhan, setKeluhan] = useState("");
  const [tanggal, setTanggal] = useState(hariIni);
  const [jamSlot, setJamSlot] = useState("");
  const [slot, setSlot] = useState<Slot[] | null>(null);
  const [galatSlot, setGalatSlot] = useState<string | null>(null);
  const [muatUlang, setMuatUlang] = useState(0);
  const [state, aksi] = useActionState(buatBooking, null);

  const hari = useMemo(() => Array.from({ length: JUMLAH_HARI }, (_, i) => tambahHari(hariIni, i)), [hariIni]);
  const motorDipilih = motor.find((m) => m.id === motorId);
  const jenisDipilih = jenisServis.find((j) => j.id === jenisId);

  // Ambil ketersediaan slot setiap kali tanggal berganti.
  useEffect(() => {
    let batal = false;
    setSlot(null);
    setGalatSlot(null);
    (async () => {
      const { data, error } = await createClient().rpc("slot_tersedia", {
        p_bengkel_id: bengkel.id,
        p_tanggal: tanggal,
      });
      if (batal) return;
      if (error) setGalatSlot("Gagal memuat jadwal. Periksa koneksi lalu pilih tanggal lagi.");
      else setSlot(baris<Slot>(data));
    })();
    return () => {
      batal = true;
    };
  }, [bengkel.id, tanggal, muatUlang]);

  // Booking gagal karena slot penuh → kembali ke pilihan waktu.
  useEffect(() => {
    if (state && !state.ok && /slot|jam|tanggal/i.test(state.pesan)) {
      setLangkah(1);
      setJamSlot("");
      setMuatUlang((n) => n + 1);
    }
  }, [state]);

  const bisaLanjut = langkah === 0 ? Boolean(motorId && jenisId) : langkah === 1 ? Boolean(jamSlot) : true;

  return (
    <div className="grid gap-5">
      <ol className="grid grid-cols-3 gap-2" aria-label="Langkah booking">
        {LANGKAH.map((l, i) => (
          <li
            key={l}
            aria-current={i === langkah ? "step" : undefined}
            className={cx(
              "border-t-4 pt-2 text-sm font-semibold",
              i < langkah ? "border-montir text-montir" : i === langkah ? "border-aspal text-aspal" : "border-garis text-kabut",
            )}
          >
            <span className="angka mr-1 text-lg">{i + 1}</span>
            <span className="hidden sm:inline">{l}</span>
          </li>
        ))}
      </ol>

      {state && !state.ok ? (
        <p role="alert" className="rounded-lg bg-merah-muda px-4 py-3 text-sm font-medium text-merah">
          {state.pesan}
        </p>
      ) : null}

      {langkah === 0 ? (
        <Panel className="grid gap-6 p-5 sm:p-6">
          {motor.length > 1 ? (
            <fieldset>
              <legend className="text-sm font-semibold text-aspal-2">Motor</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {motor.map((m) => (
                  <label
                    key={m.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-garis p-3 has-[:checked]:border-montir has-[:checked]:bg-montir-muda"
                  >
                    <input
                      type="radio"
                      name="pilih-motor"
                      value={m.id}
                      checked={motorId === m.id}
                      onChange={() => setMotorId(m.id)}
                      className="accent-montir"
                    />
                    <span className="font-papan text-lg font-bold tracking-wide">{m.plat_nomor}</span>
                    <span className="text-sm text-kabut">
                      {m.merk} {m.tipe}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          ) : (
            <p className="text-sm text-kabut">
              Motor:{" "}
              <span className="font-semibold text-aspal">
                {motorDipilih?.plat_nomor}, {motorDipilih?.merk} {motorDipilih?.tipe}
              </span>
            </p>
          )}

          <fieldset>
            <legend className="text-sm font-semibold text-aspal-2">Jenis servis</legend>
            <div className="mt-2 grid gap-2">
              {jenisServis.map((j) => (
                <label
                  key={j.id}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border border-garis p-3 has-[:checked]:border-montir has-[:checked]:bg-montir-muda"
                >
                  <input
                    type="radio"
                    name="pilih-jenis"
                    value={j.id}
                    checked={jenisId === j.id}
                    onChange={() => setJenisId(j.id)}
                    className="mt-1 accent-montir"
                  />
                  <span className="flex-1">
                    <span className="flex flex-wrap items-baseline justify-between gap-x-4">
                      <span className="font-semibold">{j.nama}</span>
                      <span className="text-sm text-aspal-2">
                        Jasa {rupiah(j.harga_jasa)}, sekitar {j.durasi_menit} menit
                      </span>
                    </span>
                    {j.deskripsi ? <span className="mt-0.5 block text-sm text-kabut">{j.deskripsi}</span> : null}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <Kolom id="keluhan" label="Keluhan (opsional)" petunjuk="Misalnya: rem bunyi, mesin susah hidup pagi hari.">
            <AreaTeks
              {...ariaKolom("keluhan", undefined, "x")}
              value={keluhan}
              onChange={(e) => setKeluhan(e.target.value)}
              maxLength={500}
            />
          </Kolom>
        </Panel>
      ) : null}

      {langkah === 1 ? (
        <Panel className="grid gap-6 p-5 sm:p-6">
          <fieldset>
            <legend className="text-sm font-semibold text-aspal-2">Tanggal</legend>
            <div className="-mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1">
              {hari.map((h, i) => {
                const { hari: namaHari, tanggal: tgl } = tanggalPendek(h);
                const pilih = h === tanggal;
                return (
                  <button
                    key={h}
                    type="button"
                    aria-pressed={pilih}
                    onClick={() => {
                      setTanggal(h);
                      setJamSlot("");
                    }}
                    className={cx(
                      "flex min-w-16 shrink-0 flex-col items-center rounded-lg border px-3 py-2 text-sm",
                      pilih ? "border-montir bg-montir text-white" : "border-garis bg-kertas hover:border-aspal-2",
                    )}
                  >
                    <span className={pilih ? "text-white/80" : "text-kabut"}>{i === 0 ? "Hari ini" : namaHari}</span>
                    <span className="font-semibold">{tgl}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-semibold text-aspal-2">Jam datang</legend>
            {galatSlot ? (
              <p className="mt-2 text-sm text-merah">{galatSlot}</p>
            ) : slot === null ? (
              <p className="mt-2 text-sm text-kabut" aria-live="polite">
                Memuat jadwal…
              </p>
            ) : slot.length === 0 ? (
              <p className="mt-2 text-sm text-kabut">Tidak ada jadwal di tanggal ini.</p>
            ) : slot.every((s) => !s.tersedia) ? (
              <p className="mt-2 text-sm text-kabut">Semua jam di tanggal ini sudah penuh atau lewat. Pilih tanggal lain.</p>
            ) : null}
            {slot && slot.length > 0 ? (
              <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
                {slot.map((s) => {
                  const pilih = s.jam_slot === jamSlot;
                  const sisa = s.kapasitas - s.terisi;
                  return (
                    <button
                      key={s.jam_slot}
                      type="button"
                      disabled={!s.tersedia}
                      aria-pressed={pilih}
                      onClick={() => setJamSlot(s.jam_slot)}
                      className={cx(
                        "rounded-lg border px-2 py-2 text-center",
                        pilih
                          ? "border-montir bg-montir text-white"
                          : s.tersedia
                            ? "border-garis bg-kertas hover:border-aspal-2"
                            : "cursor-not-allowed border-dashed border-garis bg-latar text-kabut/70",
                      )}
                    >
                      <span className="angka block text-xl font-bold">{jam(s.jam_slot)}</span>
                      <span className={cx("block text-xs", pilih ? "text-white/80" : "text-kabut")}>
                        {s.tersedia ? `sisa ${sisa}` : sisa <= 0 ? "penuh" : "lewat"}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </fieldset>
        </Panel>
      ) : null}

      {langkah === 2 ? (
        <Panel className="p-5 sm:p-6">
          <dl className="grid gap-3 text-[15px] sm:grid-cols-[10rem_1fr]">
            <dt className="text-kabut">Motor</dt>
            <dd className="font-semibold">
              {motorDipilih?.plat_nomor}, {motorDipilih?.merk} {motorDipilih?.tipe}
            </dd>
            <dt className="text-kabut">Servis</dt>
            <dd className="font-semibold">
              {jenisDipilih?.nama}, jasa {jenisDipilih ? rupiah(jenisDipilih.harga_jasa) : ""}
            </dd>
            <dt className="text-kabut">Datang</dt>
            <dd className="font-semibold">
              {tanggalPanjang(tanggal)}, jam {jam(jamSlot)}
            </dd>
            {keluhan.trim() ? (
              <>
                <dt className="text-kabut">Keluhan</dt>
                <dd>{keluhan.trim()}</dd>
              </>
            ) : null}
          </dl>
          <p className="mt-4 text-sm text-kabut">
            Harga sparepart dihitung terpisah sesuai yang dipakai. Bengkel akan mengonfirmasi booking-mu.
          </p>
        </Panel>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {langkah > 0 ? (
          <Tombol type="button" varian="kedua" ukuran="lg" onClick={() => setLangkah((l) => l - 1)}>
            Kembali
          </Tombol>
        ) : null}
        {langkah < 2 ? (
          <Tombol
            type="button"
            ukuran="lg"
            disabled={!bisaLanjut}
            onClick={() => setLangkah((l) => l + 1)}
            className="flex-1 sm:flex-none"
          >
            Lanjut
          </Tombol>
        ) : (
          <form action={aksi} className="flex-1 sm:flex-none">
            <input type="hidden" name="motor_id" value={motorId} />
            <input type="hidden" name="jenis_servis_id" value={jenisId} />
            <input type="hidden" name="tanggal" value={tanggal} />
            <input type="hidden" name="jam_slot" value={jamSlot} />
            <input type="hidden" name="keluhan" value={keluhan} />
            <TombolKirim ukuran="lg" className="w-full" teksProses="Mengambil nomor…">
              Ambil nomor antrean
            </TombolKirim>
          </form>
        )}
      </div>
    </div>
  );
}
