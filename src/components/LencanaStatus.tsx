import { cx } from "@/components/ui";
import { LABEL_STATUS } from "@/lib/format";
import type { StatusBooking } from "@/lib/types";

const WARNA: Record<StatusBooking, string> = {
  menunggu: "bg-latar text-aspal-2 border-garis",
  dikonfirmasi: "bg-montir-muda text-montir-tua border-montir/25",
  dikerjakan: "bg-montir text-white border-montir",
  menunggu_bayar: "bg-oranye-muda text-oranye border-oranye/30",
  selesai: "bg-hijau-muda text-hijau border-hijau/30",
  batal: "bg-merah-muda text-merah border-merah/30",
};

export function LencanaStatus({ status, className }: { status: StatusBooking; className?: string }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        WARNA[status],
        className,
      )}
    >
      {status === "dikerjakan" ? (
        <span aria-hidden className="size-1.5 animate-pulse rounded-full bg-karcis" />
      ) : null}
      {LABEL_STATUS[status]}
    </span>
  );
}
