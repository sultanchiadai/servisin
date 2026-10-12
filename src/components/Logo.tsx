import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="group inline-flex items-baseline gap-1.5" aria-label="Servisin, ke beranda">
      <span aria-hidden className="karcis inline-block h-5 w-3 translate-y-0.5 [--takik:3px]" />
      <span className="font-papan text-2xl font-bold tracking-tight text-aspal">servisin</span>
    </Link>
  );
}
