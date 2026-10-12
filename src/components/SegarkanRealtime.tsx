"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Berlangganan perubahan tabel booking via Supabase Realtime lalu menyegarkan
 * data halaman (Server Component). Hak baca tetap mengikuti RLS.
 */
export function SegarkanRealtime({ bengkelId }: { bengkelId: string }) {
  const router = useRouter();
  const [terhubung, setTerhubung] = useState(false);
  const jeda = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`booking-${bengkelId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "booking", filter: `bengkel_id=eq.${bengkelId}` },
        () => {
          // Beberapa perubahan beruntun cukup satu kali refresh.
          if (jeda.current) clearTimeout(jeda.current);
          jeda.current = setTimeout(() => router.refresh(), 300);
        },
      )
      .subscribe((status: string) => setTerhubung(status === "SUBSCRIBED"));

    return () => {
      if (jeda.current) clearTimeout(jeda.current);
      supabase.removeChannel(channel);
    };
  }, [bengkelId, router]);

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-kabut" aria-live="polite">
      <span
        aria-hidden
        className={`size-2 rounded-full ${terhubung ? "bg-hijau animate-pulse" : "bg-garis"}`}
      />
      {terhubung ? "Live" : "Menyambung…"}
    </span>
  );
}
