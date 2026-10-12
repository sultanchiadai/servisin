"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

/** Tampilkan satu toast sukses (mis. setelah redirect), lalu bersihkan query string. */
export function ToastSekali({ pesan }: { pesan: string }) {
  const sudah = useRef(false);
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    if (sudah.current) return;
    sudah.current = true;
    toast.success(pesan);
    router.replace(path, { scroll: false });
  }, [pesan, path, router]);

  return null;
}
