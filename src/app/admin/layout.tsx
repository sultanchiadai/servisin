import { KepalaAplikasi } from "@/components/KepalaAplikasi";
import { wajibPeran } from "@/lib/auth";

export default async function LayoutAdmin({ children }: { children: React.ReactNode }) {
  const profil = await wajibPeran(["admin", "pemilik"]);
  return (
    <>
      <KepalaAplikasi
        profil={profil}
        beranda={profil.role === "pemilik" ? "/pemilik" : "/admin"}
        tautan={[
          { href: "/admin", label: "Antrean" },
          { href: "/admin/sparepart", label: "Sparepart", segera: true },
          { href: "/admin/pengingat", label: "Pengingat", segera: true },
          ...(profil.role === "pemilik" ? [{ href: "/pemilik", label: "Laporan" }] : []),
        ]}
      />
      <main className="mx-auto max-w-6xl px-4 pt-8 pb-28 md:pb-16">{children}</main>
    </>
  );
}
