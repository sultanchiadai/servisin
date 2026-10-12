"use client";

import { useFormStatus } from "react-dom";
import type { ButtonHTMLAttributes } from "react";
import { Tombol } from "@/components/ui";

/** Tombol submit yang menampilkan status memproses selama form dikirim. */
export function TombolKirim({
  children,
  teksProses = "Memproses…",
  varian,
  ukuran,
  className,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  teksProses?: string;
  varian?: "utama" | "kedua" | "hantu" | "bahaya";
  ukuran?: "sm" | "md" | "lg";
}) {
  const { pending } = useFormStatus();
  return (
    <Tombol
      type="submit"
      varian={varian}
      ukuran={ukuran}
      className={className}
      {...props}
      disabled={pending || disabled}
      aria-busy={pending}
    >
      {pending ? (
        <>
          <span
            aria-hidden
            className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
          />
          {teksProses}
        </>
      ) : (
        children
      )}
    </Tombol>
  );
}
