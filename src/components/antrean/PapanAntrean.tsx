import { KartuAntrean } from "@/components/antrean/KartuAntrean";
import { cx } from "@/components/ui";
import type { KartuAntreanData } from "@/lib/antrean";
import type { StatusBooking } from "@/lib/types";

const KOLOM: { status: StatusBooking; judul: string; kosong: string }[] = [
  { status: "menunggu", judul: "Perlu konfirmasi", kosong: "Tidak ada booking baru." },
  { status: "dikonfirmasi", judul: "Antre", kosong: "Belum ada yang antre." },
  { status: "dikerjakan", judul: "Dikerjakan", kosong: "Belum ada yang dikerjakan." },
  { status: "menunggu_bayar", judul: "Siap dibayar", kosong: "Belum ada yang selesai." },
];

/** Papan kanban antrean hari ini. Di HP kolom bertumpuk, di layar lebar berjajar. */
export function PapanAntrean({
  data,
  mode,
  userId,
}: {
  data: KartuAntreanData[];
  mode: "pengelola" | "mekanik";
  userId: string;
}) {
  const kolom = mode === "mekanik" ? KOLOM.filter((k) => k.status !== "menunggu" && k.status !== "menunggu_bayar") : KOLOM;

  return (
    <div className={cx("grid gap-4", mode === "mekanik" ? "md:grid-cols-2" : "md:grid-cols-2 xl:grid-cols-4")}>
      {kolom.map((k) => {
        const isi = data.filter((d) => d.status === k.status);
        return (
          <section key={k.status} aria-labelledby={`kolom-${k.status}`} className="rounded-xl bg-latar/70 p-2">
            <h2 id={`kolom-${k.status}`} className="flex items-baseline justify-between px-1.5 pt-1 pb-2.5">
              <span className="font-semibold">{k.judul}</span>
              <span className="angka text-xl font-bold text-kabut">{isi.length}</span>
            </h2>
            <div className="grid gap-2">
              {isi.length === 0 ? (
                <p className="rounded-lg border border-dashed border-garis px-3 py-6 text-center text-sm text-kabut">
                  {k.kosong}
                </p>
              ) : (
                isi.map((d) => <KartuAntrean key={d.id} data={d} mode={mode} userId={userId} />)
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
