import Link from "next/link";
import { CalendarClock, ChevronRight } from "lucide-react";
import { Karcis } from "@/components/Karcis";
import { LencanaStatus } from "@/components/LencanaStatus";
import { ToastSekali } from "@/components/ToastSekali";
import { JudulHalaman, Kosong, Panel, kelasTombol } from "@/components/ui";
import { getProfil } from "@/lib/auth";
import { baris, jam, km, satu, tanggalPanjang } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { StatusBooking } from "@/lib/types";
import { TombolBatal } from "./TombolBatal";

type Relasi<T> = T | T[] | null;

interface BarisBookingMentah {
  id: string;
  kode: string;
  tanggal: string;
  jam_slot: string;
  nomor_antrean: number;
  status: StatusBooking;
  motor: Relasi<{ plat_nomor: string; merk: string; tipe: string }>;
  jenis_servis: Relasi<{ nama: string }>;
}

interface BarisPengingatMentah {
  id: string;
  jatuh_tempo_tanggal: string | null;
  jatuh_tempo_km: number | null;
  status: string;
  motor: Relasi<{ plat_nomor: string }>;
  jenis_servis: Relasi<{ nama: string }>;
}

interface BarisBooking {
  id: string;
  kode: string;
  tanggal: string;
  jam_slot: string;
  nomor_antrean: number;
  status: StatusBooking;
  motor: { plat_nomor: string; merk: string; tipe: string } | null;
  jenis_servis: { nama: string } | null;
}

interface BarisMotor {
  id: string;
  plat_nomor: string;
  merk: string;
  tipe: string;
  tahun: number | null;
  km_terakhir: number;
}

interface BarisPengingat {
  id: string;
  jatuh_tempo_tanggal: string | null;
  jatuh_tempo_km: number | null;
  status: string;
  motor: { plat_nomor: string } | null;
  jenis_servis: { nama: string } | null;
}

export default async function BerandaPelanggan({
  searchParams,
}: {
  searchParams: Promise<{ motor?: string }>;
}) {
  const { motor: motorBaru } = await searchParams;
  const profil = await getProfil();
  const supabase = await createClient();

  const [{ data: bookingRaw }, { data: motorRaw }, { data: pengingatRaw }] = await Promise.all([
    supabase
      .from("booking")
      .select(
        "id, kode, tanggal, jam_slot, nomor_antrean, status, motor:motor_id(plat_nomor, merk, tipe), jenis_servis:jenis_servis_id(nama)",
      )
      .not("status", "in", "(selesai,batal)")
      .order("tanggal")
      .order("jam_slot"),
    supabase
      .from("motor")
      .select("id, plat_nomor, merk, tipe, tahun, km_terakhir")
      .eq("pemilik_id", profil!.id)
      .order("created_at"),
    supabase
      .from("pengingat")
      .select("id, jatuh_tempo_tanggal, jatuh_tempo_km, status, motor:motor_id(plat_nomor), jenis_servis:jenis_servis_id(nama)")
      .neq("status", "selesai")
      .order("jatuh_tempo_tanggal", { nullsFirst: false })
      .limit(5),
  ]);

  const booking: BarisBooking[] = baris<BarisBookingMentah>(bookingRaw).map((b) => ({
    ...b,
    motor: satu(b.motor),
    jenis_servis: satu(b.jenis_servis),
  }));
  const motor = baris<BarisMotor>(motorRaw);
  const pengingat: BarisPengingat[] = baris<BarisPengingatMentah>(pengingatRaw).map((p) => ({
    ...p,
    motor: satu(p.motor),
    jenis_servis: satu(p.jenis_servis),
  }));

  return (
    <div className="grid gap-10">
      {motorBaru ? <ToastSekali pesan="Motor ditambahkan." /> : null}

      <JudulHalaman
        judul={`Halo, ${profil!.nama.split(" ")[0]}`}
        keterangan="Booking servis, pantau antrean, dan lihat jadwal servis berikutnya."
        aksi={
          motor.length > 0 ? (
            <Link href="/app/booking" className={kelasTombol("utama", "md")}>
              Booking servis
            </Link>
          ) : null
        }
      />

      <section aria-labelledby="judul-booking">
        <h2 id="judul-booking" className="font-papan text-2xl font-bold tracking-tight">
          Booking aktif
        </h2>
        <div className="mt-4 grid gap-3">
          {booking.length === 0 ? (
            <Kosong
              judul="Belum ada booking aktif"
              keterangan={
                motor.length === 0
                  ? "Tambahkan motormu dulu, lalu pilih jam servis yang pas."
                  : "Pilih jenis servis dan jam datang. Nomor antrean langsung kamu dapat."
              }
              aksi={
                <Link href={motor.length === 0 ? "/app/motor/baru" : "/app/booking"} className={kelasTombol("utama", "md")}>
                  {motor.length === 0 ? "Tambah motor" : "Booking servis"}
                </Link>
              }
            />
          ) : (
            booking.map((b) => (
              <Panel key={b.id} className="flex flex-wrap items-center gap-4 p-4">
                <Karcis nomor={b.nomor_antrean} ukuran="sedang" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{b.jenis_servis?.nama}</p>
                    <LencanaStatus status={b.status} />
                  </div>
                  <p className="mt-1 text-sm text-kabut">
                    {tanggalPanjang(b.tanggal)}, jam {jam(b.jam_slot)}
                  </p>
                  <p className="text-sm text-kabut">
                    {b.motor?.plat_nomor}, {b.motor?.merk} {b.motor?.tipe}
                  </p>
                </div>
                <div className="flex w-full gap-2 sm:w-auto">
                  <Link href={`/antrean/${b.kode}`} className={kelasTombol("kedua", "sm", "flex-1 sm:flex-none")}>
                    Lihat antrean
                  </Link>
                  {b.status === "menunggu" || b.status === "dikonfirmasi" ? <TombolBatal bookingId={b.id} /> : null}
                </div>
              </Panel>
            ))
          )}
        </div>
      </section>

      {pengingat.length > 0 ? (
        <section aria-labelledby="judul-pengingat">
          <h2 id="judul-pengingat" className="font-papan text-2xl font-bold tracking-tight">
            Servis berikutnya
          </h2>
          <ul className="mt-4 divide-y divide-garis rounded-xl border border-garis bg-kertas">
            {pengingat.map((p) => (
              <li key={p.id} className="flex items-start gap-3 p-4">
                <CalendarClock
                  className={`mt-0.5 size-5 shrink-0 ${p.status === "terjadwal" ? "text-kabut" : "text-oranye"}`}
                  aria-hidden
                />
                <div className="text-sm">
                  <p className="font-semibold">
                    {p.jenis_servis?.nama} untuk {p.motor?.plat_nomor}
                  </p>
                  <p className="text-kabut">
                    {p.status === "terjadwal" ? "Dijadwalkan " : "Sudah waktunya, "}
                    {[
                      p.jatuh_tempo_tanggal ? tanggalPanjang(p.jatuh_tempo_tanggal) : null,
                      p.jatuh_tempo_km ? `atau saat mencapai ${km(p.jatuh_tempo_km)}` : null,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="judul-motor">
        <div className="flex items-end justify-between gap-4">
          <h2 id="judul-motor" className="font-papan text-2xl font-bold tracking-tight">
            Motor saya
          </h2>
          {motor.length > 0 ? (
            <Link href="/app/motor/baru" className={kelasTombol("hantu", "sm")}>
              Tambah motor
            </Link>
          ) : null}
        </div>
        <div className="mt-4">
          {motor.length === 0 ? (
            <Kosong
              judul="Belum ada motor"
              keterangan="Data motor dipakai untuk booking dan menyimpan riwayat servisnya."
              aksi={
                <Link href="/app/motor/baru" className={kelasTombol("utama", "md")}>
                  Tambah motor
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-garis rounded-xl border border-garis bg-kertas">
              {motor.map((m) => (
                <li key={m.id}>
                  <Link href={`/app/motor/${m.id}`} className="flex items-center gap-4 p-4 hover:bg-latar/60">
                    <span className="rounded-md border-2 border-aspal bg-kertas px-2 py-0.5 font-papan text-lg font-bold tracking-wide">
                      {m.plat_nomor}
                    </span>
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="font-semibold">
                        {m.merk} {m.tipe}
                        {m.tahun ? `, ${m.tahun}` : ""}
                      </p>
                      <p className="text-kabut">Km terakhir {km(m.km_terakhir)}</p>
                    </div>
                    <ChevronRight className="size-5 text-kabut" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
