"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/components/ui";

export interface Tautan {
  href: string;
  label: string;
  segera?: boolean;
}

/** Navigasi utama. Di HP tampil sebagai bar bawah agar mudah dijangkau jempol. */
export function NavTautan({ tautan }: { tautan: Tautan[] }) {
  const path = usePathname();
  const aktif = (href: string) =>
    path === href || (href !== tautan[0]?.href && path.startsWith(`${href}/`));

  const item = (t: Tautan, mobile: boolean) =>
    t.segera ? (
      <span
        key={t.href}
        className={cx(
          "cursor-not-allowed text-kabut/60",
          mobile ? "flex-1 py-2 text-center text-xs" : "px-3 py-1.5 text-sm",
        )}
        title="Dikerjakan di tahap berikutnya"
      >
        {t.label}
      </span>
    ) : (
      <Link
        key={t.href}
        href={t.href}
        aria-current={aktif(t.href) ? "page" : undefined}
        className={cx(
          "font-semibold transition-colors",
          mobile
            ? "flex-1 py-2.5 text-center text-xs aria-[current=page]:text-montir"
            : "rounded-md px-3 py-1.5 text-sm text-aspal-2 hover:bg-latar aria-[current=page]:bg-montir-muda aria-[current=page]:text-montir-tua",
          mobile && "text-kabut",
        )}
      >
        {t.label}
      </Link>
    );

  return (
    <>
      <nav aria-label="Navigasi utama" className="ml-4 hidden items-center gap-1 md:flex">
        {tautan.map((t) => item(t, false))}
      </nav>
      <nav
        aria-label="Navigasi utama"
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-garis bg-kertas pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {tautan.map((t) => item(t, true))}
      </nav>
    </>
  );
}
