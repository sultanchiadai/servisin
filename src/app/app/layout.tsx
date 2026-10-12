import { KepalaAplikasi } from "@/components/KepalaAplikasi";
import { wajibPeran } from "@/lib/auth";

export default async function LayoutPelanggan({ children }: { children: React.ReactNode }) {
  const profil = await wajibPeran(["pelanggan"]);
  return (
    <>
      <KepalaAplikasi
        profil={profil}
        beranda="/app"
        tautan={[
          { href: "/app", label: "Beranda" },
          { href: "/app/booking", label: "Booking" },
          { href: "/app/motor/baru", label: "Tambah motor" },
        ]}
      />
      <main className="mx-auto max-w-3xl px-4 pt-8 pb-28 md:pb-16">{children}</main>
    </>
  );
}
