"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Tombol } from "@/components/ui";
import { batalkanBooking } from "./actions";

export function TombolBatal({ bookingId }: { bookingId: string }) {
  const [proses, mulai] = useTransition();

  return (
    <Tombol
      varian="bahaya"
      ukuran="sm"
      className="flex-1 sm:flex-none"
      disabled={proses}
      onClick={() => {
        if (!window.confirm("Batalkan booking ini? Nomor antreanmu akan dilepas.")) return;
        mulai(async () => {
          const hasil = await batalkanBooking(bookingId);
          if (hasil.ok) toast.success(hasil.pesan);
          else toast.error(hasil.pesan);
        });
      }}
    >
      {proses ? "Membatalkan…" : "Batalkan booking"}
    </Tombol>
  );
}
