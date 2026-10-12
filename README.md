# Servisin

Sistem booking, antrean, dan manajemen servis untuk bengkel motor UMKM.
Karya untuk **GTNIC 2026 — kategori Web Development**, subtema *Accelerating Digital Transformation for Business and SMEs*.

- Pelanggan booking jam servis dari HP dan memantau nomor antrean secara live.
- Bengkel mengelola antrean (online dan datang langsung), mekanik, nota, dan stok sparepart di satu tempat.
- Setiap servis selesai otomatis menjadwalkan pengingat servis berikutnya berdasarkan tanggal dan km.

## Status pengerjaan

| Bagian | Status |
| --- | --- |
| Skema database, RLS per peran, fungsi bisnis | ✅ Selesai dan teruji |
| Login/daftar (email, Google), pembagian peran | ✅ |
| Pelanggan: motor saya, booking 3 langkah, riwayat servis | ✅ |
| Status antrean publik via kode (refresh tiap 10 detik) | ✅ |
| Admin: papan antrean realtime, walk-in, konfirmasi, bayar | ✅ |
| Mekanik: ambil antrean, catat km & catatan | ✅ |
| Pemilik: ringkasan hari ini & 7 hari, stok menipis | ✅ versi awal |
| Job harian pengingat jatuh tempo (Vercel Cron) | ✅ |
| Halaman nota (tambah sparepart ke nota) | ⏳ tahap berikutnya |
| Halaman sparepart & mutasi stok | ⏳ tahap berikutnya |
| Halaman pengingat + tombol kirim WhatsApp | ⏳ tahap berikutnya |
| Dashboard grafik pemilik | ⏳ tahap berikutnya |

Fungsi database untuk tiga baris terakhir **sudah ada** (`selesaikan_servis`, `sesuaikan_stok`, `tandai_pengingat_jatuh_tempo`); yang belum hanya halamannya.

## Teknologi

| Lapisan | Pilihan |
| --- | --- |
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| Backend | Next.js Server Actions & Route Handlers |
| Database | Supabase PostgreSQL + Row Level Security |
| Auth | Supabase Auth (email & Google) |
| Realtime | Supabase Realtime (papan antrean) |
| Validasi | Zod (di server) + constraint & fungsi di database |
| Hosting | Vercel + Supabase (paket gratis) |

## Cara menjalankan

### 1. Siapkan Supabase

1. Buat project baru di [supabase.com](https://supabase.com) (region Singapore paling dekat).
2. Buka **SQL Editor → New query**, tempel seluruh isi `supabase/migrations/0001_skema_awal.sql`, lalu **Run**.
3. Query baru lagi, tempel `supabase/seed.sql`, lalu **Run**. Ini membuat 1 bengkel contoh, 5 jenis servis, dan 8 sparepart.
4. **Authentication → URL Configuration**:
   - Site URL: `http://localhost:3000` (nanti ganti ke URL Vercel).
   - Redirect URLs: tambahkan `http://localhost:3000/auth/callback` dan `https://<domain-vercel>/auth/callback`.
5. (Opsional, memudahkan demo) **Authentication → Providers → Email**: matikan *Confirm email* agar akun langsung aktif saat daftar.
6. (Opsional) Login Google: aktifkan provider Google dan isi Client ID/Secret dari Google Cloud Console.

### 2. Jalankan di laptop

Butuh Node.js 20 atau lebih baru.

```bash
cp .env.example .env.local     # lalu isi URL & anon key dari Supabase: Project Settings → API
npm install
npm run dev                    # buka http://localhost:3000
```

### 3. Buat akun staf

Semua akun yang daftar lewat aplikasi otomatis menjadi **pelanggan**. Peran staf hanya bisa diberikan dari SQL Editor:

1. Daftar 3 akun lewat halaman `/login` (misalnya admin, mekanik, pemilik).
2. Jalankan di SQL Editor:

```sql
select jadikan_staf('admin@contoh.com', 'admin');
select jadikan_staf('mekanik@contoh.com', 'mekanik');
select jadikan_staf('pemilik@contoh.com', 'pemilik');
```

3. Keluar lalu masuk lagi. Tiap peran diarahkan ke halamannya sendiri (`/admin`, `/mekanik`, `/pemilik`).

### 4. Deploy ke Vercel

1. Push repo ini ke GitHub (atur sebagai **public** sesuai syarat lomba).
2. Di Vercel: **Add New → Project → Import** repo.
3. Isi Environment Variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL` (URL Vercel), `CRON_SECRET` (string acak panjang), `SUPABASE_SERVICE_ROLE_KEY`.
4. Deploy, lalu perbarui Site URL dan Redirect URLs di Supabase ke domain Vercel.
5. Job harian di `vercel.json` berjalan setiap pukul 06.00 WIB untuk menandai pengingat yang jatuh tempo.

## Alur demo (untuk video)

1. **Pelanggan** daftar, tambah motor, booking servis rutin untuk besok jam 09.00, lalu dapat nomor antrean dan kode.
2. Buka `/antrean/<kode>` di HP: status "Menunggu konfirmasi".
3. **Admin** di laptop: kartu muncul otomatis di kolom *Perlu konfirmasi* → **Konfirmasi**. Tambah satu pelanggan **datang langsung**.
4. **Mekanik**: **Ambil & kerjakan**, lalu **Selesai dikerjakan** dengan mengisi km.
5. **Admin**: pilih metode bayar → **Lunas & selesai**. Stok terpotong dan pengingat servis berikutnya dibuat otomatis.
6. **Pelanggan**: riwayat servis dan jadwal servis berikutnya muncul di beranda.

> Untuk demo di hari yang sama, booking untuk hari ini di jam yang belum lewat.

## Struktur folder

```
supabase/
  migrations/0001_skema_awal.sql   # tabel, RLS, fungsi bisnis, realtime
  seed.sql                         # data contoh bengkel
src/
  middleware.ts                    # sesi Supabase + proteksi area login
  app/
    page.tsx                       # landing page
    login/                         # masuk & daftar
    antrean/                       # cek antrean publik via kode
    app/                           # area pelanggan (beranda, motor, booking)
    admin/                         # papan antrean & walk-in
    mekanik/                       # tugas mekanik
    pemilik/                       # laporan pemilik
    api/cron/pengingat/            # job harian
  components/                      # UI bersama (karcis, papan antrean, form)
  lib/
    actions/                       # server actions (auth, antrean)
    supabase/                      # klien server, browser, middleware
    validasi.ts                    # skema Zod
    galat.ts                       # pesan error aman untuk pengguna
```

## Keamanan

- **Row Level Security di semua tabel.** Pelanggan hanya membaca data miliknya; staf hanya membaca data bengkelnya. Diuji dengan skenario lintas akun.
- **Semua perubahan status lewat fungsi database** yang memeriksa peran dan urutan status (misalnya mekanik tidak bisa membatalkan booking, nota tidak bisa selesai sebelum mekanik selesai).
- **Peran tidak bisa dinaikkan dari aplikasi**: kolom `role` dan `bengkel_id` dicabut hak ubahnya; akun baru selalu pelanggan.
- **Harga sparepart diambil dari master** oleh trigger, bukan dari input klien. Kolom `stok` hanya berubah lewat fungsi dan selalu tercatat di `mutasi_stok`.
- **Kuota slot dijaga kunci transaksi** (`pg_advisory_xact_lock`) sehingga dua booking bersamaan tidak melebihi kapasitas. Booking dibatasi 5 per akun per 24 jam.
- **Validasi dua lapis**: Zod di server + constraint & pengecekan di database.
- **Halaman antrean publik** hanya mengembalikan data minimum lewat fungsi khusus; plat nomor disamarkan.
- **Pesan error** dari database yang tidak dikenal dicatat di server dan diganti pesan umum.
- **Redirect setelah login** hanya ke path internal (mencegah open redirect). Header keamanan dasar diatur di `next.config.ts`.
- Secret (`SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`) hanya di environment server dan tidak pernah di-commit.

## Pustaka pihak ketiga

| Pustaka | Lisensi | Dipakai untuk |
| --- | --- | --- |
| Next.js, React | MIT | Framework aplikasi |
| @supabase/supabase-js, @supabase/ssr | MIT | Klien database, auth, realtime |
| Tailwind CSS | MIT | Styling |
| Zod | MIT | Validasi input |
| Sonner | MIT | Notifikasi toast |
| Lucide | ISC | Ikon |
| Plus Jakarta Sans, Barlow Condensed | SIL Open Font License | Huruf (via next/font) |
