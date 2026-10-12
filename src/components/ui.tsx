import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

export function cx(...kelas: Array<string | false | null | undefined>) {
  return kelas.filter(Boolean).join(" ");
}

type Varian = "utama" | "kedua" | "hantu" | "bahaya";
type Ukuran = "sm" | "md" | "lg";

const VARIAN: Record<Varian, string> = {
  utama: "bg-montir text-white hover:bg-montir-tua disabled:bg-montir/50",
  kedua: "bg-kertas text-aspal border border-garis hover:border-aspal-2 disabled:text-kabut",
  hantu: "text-montir hover:bg-montir-muda disabled:text-kabut",
  bahaya: "bg-kertas text-merah border border-merah/40 hover:bg-merah-muda disabled:opacity-50",
};

const UKURAN: Record<Ukuran, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-[15px]",
  lg: "h-13 px-6 text-base",
};

export function kelasTombol(varian: Varian = "utama", ukuran: Ukuran = "md", tambahan?: string) {
  return cx(
    "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed",
    VARIAN[varian],
    UKURAN[ukuran],
    tambahan,
  );
}

export function Tombol({
  varian = "utama",
  ukuran = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { varian?: Varian; ukuran?: Ukuran }) {
  return <button className={kelasTombol(varian, ukuran, className)} {...props} />;
}

const kelasIsian =
  "w-full rounded-lg border border-garis bg-kertas px-3 text-[15px] text-aspal placeholder:text-kabut/70 " +
  "focus:border-montir focus:outline-none focus:ring-2 focus:ring-montir/20 " +
  "aria-[invalid=true]:border-merah aria-[invalid=true]:ring-merah/15";

export function Isian({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(kelasIsian, "h-11", className)} {...props} />;
}

export function AreaTeks({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx(kelasIsian, "min-h-24 py-2.5", className)} {...props} />;
}

export function Pilihan({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cx(kelasIsian, "h-11 pr-8", className)} {...props} />;
}

/** Label + isian + petunjuk + pesan error, terhubung lewat aria. */
export function Kolom({
  id,
  label,
  petunjuk,
  galat,
  children,
}: {
  id: string;
  label: string;
  petunjuk?: string;
  galat?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-aspal-2">
        {label}
      </label>
      {children}
      {galat ? (
        <p id={`${id}-galat`} className="text-sm text-merah">
          {galat}
        </p>
      ) : petunjuk ? (
        <p id={`${id}-petunjuk`} className="text-sm text-kabut">
          {petunjuk}
        </p>
      ) : null}
    </div>
  );
}

/** Atribut aksesibilitas untuk isian di dalam <Kolom>. */
export function ariaKolom(id: string, galat?: string, petunjuk?: string) {
  return {
    id,
    name: id,
    "aria-invalid": galat ? true : undefined,
    "aria-describedby": galat ? `${id}-galat` : petunjuk ? `${id}-petunjuk` : undefined,
  } as const;
}

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cx("rounded-xl border border-garis bg-kertas", className)}>{children}</section>;
}

export function JudulHalaman({ judul, keterangan, aksi }: { judul: string; keterangan?: string; aksi?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-papan text-4xl font-bold leading-none tracking-tight sm:text-5xl">{judul}</h1>
        {keterangan ? <p className="mt-2 max-w-prose text-kabut">{keterangan}</p> : null}
      </div>
      {aksi}
    </div>
  );
}

export function Kosong({ judul, keterangan, aksi }: { judul: string; keterangan: string; aksi?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-garis bg-kertas/60 px-6 py-10 text-center">
      <p className="font-semibold">{judul}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-kabut">{keterangan}</p>
      {aksi ? <div className="mt-4 flex justify-center">{aksi}</div> : null}
    </div>
  );
}
