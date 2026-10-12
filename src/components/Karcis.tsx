import { cx } from "@/components/ui";

/** Nomor antrean dalam bentuk karcis kuning bertakik — identitas visual Servisin. */
export function Karcis({
  nomor,
  ukuran = "kecil",
  redup = false,
  className,
}: {
  nomor: number;
  ukuran?: "kecil" | "sedang" | "besar";
  redup?: boolean;
  className?: string;
}) {
  const kelasUkuran = {
    kecil: "h-11 min-w-14 px-3 text-3xl",
    sedang: "h-16 min-w-20 px-5 text-5xl",
    besar: "h-36 min-w-48 px-10 text-[7.5rem]",
  }[ukuran];

  return (
    <span
      className={cx(
        "karcis angka inline-flex items-center justify-center font-bold leading-none",
        kelasUkuran,
        redup && "opacity-45 grayscale",
        className,
      )}
      aria-label={`Nomor antrean ${nomor}`}
    >
      {String(nomor).padStart(2, "0")}
    </span>
  );
}
