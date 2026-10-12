"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Karcis } from "@/components/Karcis";
import { LencanaStatus } from "@/components/LencanaStatus";
import { Panel, cx } from "@/components/ui";
import { jam, tanggalPanjang } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import type { StatusAntrean, StatusBooking } from "@/lib/types";

const INTERVAL_MS = 10_000;
const TAHAP: { status: StatusBooking; label: string }[] = [
  { status: "dikonfirmasi", label: "Antre" },
  { status: "dikerjakan", label: "Dikerjakan" },
  { status: "menunggu_bayar", label: "Bayar" },
  { status: "selesai", label: "Selesai" },
];
const URUTAN: StatusBooking[] = ["menunggu", "dikonfirmasi", "dikerjakan", "menunggu_bayar", "selesai"];

function pesanUtama(s: StatusAntrean): { besar: string; kecil: string } {
  switch (s.status) {
    case "menunggu":
      return { besar: "Menunggu konfirmasi", kecil: "Bengkel akan mengonfirmasi booking-mu sebentar lagi." };
    case "dikonfirmasi":
      return s.posisi === 0
        ? { besar: "Giliranmu berikutnya", kecil: "Siapkan motormu dan menuju bengkel sekarang." }
        : { besar: `${s.posisi} antrean lagi`, kecil: "Datang saat tinggal 1–2 antrean agar tidak lama menunggu." };
    case "dikerjakan":
      return { besar: "Sedang dikerjakan", kecil: "Mekanik sedang menangani motormu." };
    case "menunggu_bayar":
      return { besar: "Siap diambil", kecil: "Servis selesai. Silakan ke kasir untuk pembayaran." };
    case "selesai":
      return { besar: "Selesai", kecil: "Terima kasih sudah servis. Riwayatnya tersimpan di akunmu." };
    case "batal":
      return { besar: "Dibatalkan", kecil: "Booking ini sudah dibatalkan. Buat booking baru bila perlu." };
  }
}

export function StatusLive({ awal }: { awal: StatusAntrean }) {
  const [data, setData] = useState(awal);
  // Diisi setelah mount agar jam di server dan browser tidak bentrok (hydration).
  const [diperbarui, setDiperbarui] = useState<Date | null>(null);
  const [tersalin, setTersalin] = useState(false);
  const final = data.status === "selesai" || data.status === "batal";

  useEffect(() => {
    setDiperbarui(new Date());
  }, []);

  // Status publik dibaca lewat fungsi status_antrean (tanpa login), diperbarui berkala.
  useEffect(() => {
    if (final) return;
    const supabase = createClient();
    const muat = async () => {
      if (document.visibilityState !== "visible") return;
      const { data: baru } = await supabase.rpc("status_antrean", { p_kode: awal.kode });
      if (baru) {
        setData(baru as StatusAntrean);
        setDiperbarui(new Date());
      }
    };
    const id = setInterval(muat, INTERVAL_MS);
    document.addEventListener("visibilitychange", muat);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", muat);
    };
  }, [awal.kode, final]);

  const pesan = pesanUtama(data);
  const posisiStatus = URUTAN.indexOf(data.status);

  async function salinKode() {
    try {
      await navigator.clipboard.writeText(data.kode);
      setTersalin(true);
      toast.success("Kode antrean disalin.");
      setTimeout(() => setTersalin(false), 2000);
    } catch {
      toast.error("Tidak bisa menyalin. Catat kodenya secara manual.");
    }
  }

  return (
    <div className="grid gap-4">
      <Panel className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-garis px-5 py-3">
          <p className="truncate text-sm font-semibold">{data.bengkel}</p>
          <LencanaStatus status={data.status} />
        </div>

        <div className="grid justify-items-center gap-5 px-5 pt-8 pb-6 text-center">
          <Karcis nomor={data.nomor} ukuran="besar" redup={data.status === "batal"} />
          <div aria-live="polite">
            <p className="font-papan text-4xl font-bold tracking-tight">{pesan.besar}</p>
            <p className="mx-auto mt-1 max-w-xs text-kabut">{pesan.kecil}</p>
          </div>
        </div>

        {data.status !== "batal" ? (
          <ol className="grid grid-cols-4 gap-1 px-5 pb-6" aria-label="Tahap servis">
            {TAHAP.map((t) => {
              const lewat = posisiStatus >= URUTAN.indexOf(t.status);
              const kini = data.status === t.status;
              return (
                <li key={t.status} aria-current={kini ? "step" : undefined} className="grid gap-1.5 text-center">
                  <span className={cx("h-1.5 rounded-full", lewat ? "bg-montir" : "bg-garis")} />
                  <span className={cx("text-xs", kini ? "font-bold text-aspal" : lewat ? "text-montir" : "text-kabut")}>
                    {t.label}
                  </span>
                </li>
              );
            })}
          </ol>
        ) : null}

        {!final && data.sedang_dikerjakan.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 border-t border-dashed border-garis px-5 py-4">
            <p className="mr-1 text-sm text-kabut">Sedang dikerjakan</p>
            {data.sedang_dikerjakan.map((n) => (
              <Karcis key={n} nomor={n} redup={n !== data.nomor} />
            ))}
          </div>
        ) : null}
      </Panel>

      <Panel className="p-5">
        <dl className="grid grid-cols-[7rem_1fr] gap-y-2 text-sm">
          <dt className="text-kabut">Tanggal</dt>
          <dd className="font-semibold">{tanggalPanjang(data.tanggal)}</dd>
          <dt className="text-kabut">Jam datang</dt>
          <dd className="font-semibold">{jam(data.jam_slot)}</dd>
          <dt className="text-kabut">Servis</dt>
          <dd className="font-semibold">
            {data.jenis_servis}, sekitar {data.durasi_menit} menit
          </dd>
          <dt className="text-kabut">Motor</dt>
          <dd className="font-semibold">{data.plat}</dd>
          <dt className="text-kabut">Kode</dt>
          <dd className="flex items-center gap-2">
            <span className="angka text-xl font-bold tracking-widest">{data.kode}</span>
            <button
              type="button"
              onClick={salinKode}
              className="inline-flex size-8 items-center justify-center rounded-md text-kabut hover:bg-latar hover:text-aspal"
              aria-label="Salin kode antrean"
            >
              {tersalin ? <Check className="size-4 text-hijau" aria-hidden /> : <Copy className="size-4" aria-hidden />}
            </button>
          </dd>
        </dl>
      </Panel>

      {!final && diperbarui ? (
        <p className="text-center text-xs text-kabut">
          Diperbarui otomatis tiap 10 detik. Terakhir{" "}
          {diperbarui.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}.
        </p>
      ) : null}
    </div>
  );
}
