import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/Logo";
import { ToastSekali } from "@/components/ToastSekali";
import { kelasTombol } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import type { StatusAntrean } from "@/lib/types";
import { StatusLive } from "./StatusLive";

export const metadata: Metadata = {
  title: "Status antrean",
  robots: { index: false, follow: false },
};

export default async function HalamanStatusAntrean({
  params,
  searchParams,
}: {
  params: Promise<{ kode: string }>;
  searchParams: Promise<{ baru?: string }>;
}) {
  const { kode } = await params;
  const { baru } = await searchParams;
  if (!/^[0-9A-Fa-f]{8}$/.test(kode)) notFound();

  const supabase = await createClient();
  const { data } = await supabase.rpc("status_antrean", { p_kode: kode });
  if (!data) notFound();

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Logo />
        <Link href="/app" className={kelasTombol("hantu", "sm")}>
          Booking saya
        </Link>
      </header>
      <main className="mx-auto max-w-md px-4 pt-4 pb-16">
        {baru ? <ToastSekali pesan="Booking berhasil. Simpan kode ini untuk cek antrean." /> : null}
        <StatusLive awal={data as StatusAntrean} />
      </main>
    </div>
  );
}
