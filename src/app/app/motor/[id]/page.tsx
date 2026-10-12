import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Kosong, Panel, kelasTombol } from "@/components/ui";
import { LABEL_METODE, baris, km, rupiah, satu, tanggalPanjang } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { MetodeBayar } from "@/lib/types";

export const metadata: Metadata = { title: "Riwayat motor" };

interface ItemNota {
  nama: string;
  qty: number;
  harga: number;
  tipe: "jasa" | "sparepart";
}

type Relasi<T> = T | T[] | null;

interface ServisRiwayat {
  km_saat_servis: number | null;
  catatan: string | null;
  total: number;
  metode_bayar: MetodeBayar | null;
  servis_item: ItemNota[];
}

interface RiwayatMentah {
  id: string;
  kode: string;
  tanggal: string;
  jenis_servis: Relasi<{ nama: string }>;
  servis: Relasi<ServisRiwayat>;
}

interface Riwayat {
  id: string;
  kode: string;
  tanggal: string;
  jenis_servis: { nama: string } | null;
  servis: ServisRiwayat | null;
}

export default async function HalamanMotor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await createClient();
  const { data: motor } = await supabase
    .from("motor")
    .select("id, plat_nomor, merk, tipe, tahun, km_terakhir")
    .eq("id", id)
    .maybeSingle();
  if (!motor) notFound(); // RLS: motor orang lain tidak terbaca.

  const { data: riwayatRaw } = await supabase
    .from("booking")
    .select(
      "id, kode, tanggal, jenis_servis:jenis_servis_id(nama), servis(km_saat_servis, catatan, total, metode_bayar, servis_item(nama, qty, harga, tipe))",
    )
    .eq("motor_id", id)
    .eq("status", "selesai")
    .order("tanggal", { ascending: false });

  const riwayat: Riwayat[] = baris<RiwayatMentah>(riwayatRaw).map((r) => ({
    ...r,
    jenis_servis: satu(r.jenis_servis),
    servis: satu(r.servis),
  }));

  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="inline-block rounded-md border-2 border-aspal bg-kertas px-3 py-1 font-papan text-3xl font-bold tracking-wide">
            {motor.plat_nomor}
          </p>
          <p className="mt-3 text-lg font-semibold">
            {motor.merk} {motor.tipe}
            {motor.tahun ? `, ${motor.tahun}` : ""}
          </p>
          <p className="text-kabut">Km terakhir {km(motor.km_terakhir)}</p>
        </div>
        <Link href="/app/booking" className={kelasTombol("utama", "md")}>
          Booking servis
        </Link>
      </div>

      <section aria-labelledby="judul-riwayat">
        <h2 id="judul-riwayat" className="font-papan text-2xl font-bold tracking-tight">
          Riwayat servis
        </h2>
        <div className="mt-4 grid gap-3">
          {riwayat.length === 0 ? (
            <Kosong
              judul="Belum ada riwayat"
              keterangan="Setiap servis yang selesai di bengkel akan tercatat di sini, lengkap dengan sparepart yang diganti."
            />
          ) : (
            riwayat.map((r) => (
              <Panel key={r.id} className="p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-semibold">{r.jenis_servis?.nama}</p>
                  <p className="text-sm text-kabut">{tanggalPanjang(r.tanggal)}</p>
                </div>
                {r.servis ? (
                  <>
                    <ul className="mt-3 grid gap-1 text-sm">
                      {r.servis.servis_item.map((it, i) => (
                        <li key={i} className="flex justify-between gap-4">
                          <span>
                            {it.nama}
                            {it.qty > 1 ? ` × ${it.qty}` : ""}
                          </span>
                          <span className="angka text-base">{rupiah(it.qty * it.harga)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 flex flex-wrap justify-between gap-2 border-t border-dashed border-garis pt-3 text-sm">
                      <span className="text-kabut">
                        {[
                          r.servis.km_saat_servis != null ? `Di ${km(r.servis.km_saat_servis)}` : null,
                          r.servis.metode_bayar ? `dibayar ${LABEL_METODE[r.servis.metode_bayar]}` : null,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                      <span className="font-semibold">Total {rupiah(r.servis.total)}</span>
                    </div>
                    {r.servis.catatan ? (
                      <p className="mt-2 rounded-md bg-latar px-3 py-2 text-sm text-aspal-2">
                        Catatan mekanik: {r.servis.catatan}
                      </p>
                    ) : null}
                  </>
                ) : null}
              </Panel>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
