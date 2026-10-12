-- =====================================================================
-- Data contoh untuk demo. Jalankan SETELAH 0001_skema_awal.sql.
-- Nama bengkel, harga, dan interval di bawah adalah CONTOH;
-- ganti dengan data bengkel yang kamu wawancarai.
-- =====================================================================

insert into public.bengkel (id, nama, alamat, no_wa, jam_buka, jam_tutup, durasi_slot_menit, kapasitas_per_slot)
values ('00000000-0000-4000-8000-000000000001', 'Bengkel Maju Jaya Motor', 'Jl. Contoh No. 10, Surabaya',
        '081234567890', '08:00', '17:00', 60, 2);

insert into public.jenis_servis (bengkel_id, nama, deskripsi, harga_jasa, durasi_menit, interval_km, interval_hari) values
  ('00000000-0000-4000-8000-000000000001', 'Servis rutin', 'Cek & setel mesin, rem, rantai/CVT, kelistrikan', 50000, 60, 4000, 90),
  ('00000000-0000-4000-8000-000000000001', 'Ganti oli', 'Ganti oli mesin (oli dihitung terpisah)', 15000, 20, 2000, 60),
  ('00000000-0000-4000-8000-000000000001', 'Servis CVT', 'Bersihkan & cek komponen CVT motor matic', 60000, 60, 8000, 180),
  ('00000000-0000-4000-8000-000000000001', 'Ganti kampas rem', 'Ganti kampas rem depan/belakang', 25000, 30, null, null),
  ('00000000-0000-4000-8000-000000000001', 'Tambal / ganti ban', 'Tambal ban tubeless atau ganti ban', 20000, 30, null, null);

insert into public.sparepart (bengkel_id, kode, nama, stok, stok_minimum, harga_jual) values
  ('00000000-0000-4000-8000-000000000001', 'OLI-08', 'Oli mesin matic 0,8 L', 24, 10, 55000),
  ('00000000-0000-4000-8000-000000000001', 'OLI-10', 'Oli mesin bebek 1 L', 12, 8, 60000),
  ('00000000-0000-4000-8000-000000000001', 'OLI-GR', 'Oli gardan 120 ml', 15, 5, 18000),
  ('00000000-0000-4000-8000-000000000001', 'KMP-DP', 'Kampas rem depan', 6, 4, 45000),
  ('00000000-0000-4000-8000-000000000001', 'KMP-BL', 'Kampas rem belakang', 3, 4, 40000),
  ('00000000-0000-4000-8000-000000000001', 'BUSI-01', 'Busi standar', 20, 6, 25000),
  ('00000000-0000-4000-8000-000000000001', 'VBELT-01', 'V-belt matic 110-125cc', 4, 2, 120000),
  ('00000000-0000-4000-8000-000000000001', 'FLT-UD', 'Filter udara matic', 8, 3, 55000);
