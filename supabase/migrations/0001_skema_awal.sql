-- =====================================================================
-- Servisin — skema awal
-- Jalankan sekali di Supabase: SQL Editor → New query → tempel → Run.
-- Urutan: tipe → tabel → fungsi bantu → RLS → fungsi bisnis → realtime.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. Tipe enum
-- ---------------------------------------------------------------------
create type public.peran as enum ('pelanggan', 'admin', 'mekanik', 'pemilik');
create type public.status_booking as enum ('menunggu', 'dikonfirmasi', 'dikerjakan', 'menunggu_bayar', 'selesai', 'batal');
create type public.sumber_booking as enum ('online', 'walk_in');
create type public.status_bayar as enum ('belum', 'lunas');
create type public.metode_bayar as enum ('tunai', 'qris', 'transfer');
create type public.tipe_item as enum ('jasa', 'sparepart');
create type public.status_pengingat as enum ('terjadwal', 'jatuh_tempo', 'terkirim', 'selesai');

-- ---------------------------------------------------------------------
-- 2. Tabel
-- ---------------------------------------------------------------------
create table public.bengkel (
  id                  uuid primary key default gen_random_uuid(),
  nama                text not null check (char_length(nama) between 2 and 100),
  alamat              text,
  no_wa               text,
  jam_buka            time not null default '08:00',
  jam_tutup           time not null default '17:00',
  durasi_slot_menit   int  not null default 60 check (durasi_slot_menit between 15 and 240),
  kapasitas_per_slot  int  not null default 2  check (kapasitas_per_slot between 1 and 50),
  created_at          timestamptz not null default now(),
  check (jam_tutup > jam_buka)
);

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  nama        text not null check (char_length(nama) between 1 and 100),
  no_hp       text check (no_hp ~ '^(\+62|62|0)8[0-9]{7,12}$'),
  role        public.peran not null default 'pelanggan',
  bengkel_id  uuid references public.bengkel (id),
  created_at  timestamptz not null default now()
);

-- Motor walk-in boleh tanpa akun: pemilik_id kosong, kontak di nama_pemilik/no_hp.
create table public.motor (
  id            uuid primary key default gen_random_uuid(),
  pemilik_id    uuid references public.profiles (id) on delete set null,
  nama_pemilik  text check (char_length(nama_pemilik) <= 100),
  no_hp         text check (no_hp ~ '^(\+62|62|0)8[0-9]{7,12}$'),
  plat_nomor    text not null unique,
  merk          text not null check (char_length(merk) between 1 and 50),
  tipe          text not null check (char_length(tipe) between 1 and 50),
  tahun         int  check (tahun between 1970 and 2100),
  km_terakhir   int  not null default 0 check (km_terakhir >= 0),
  created_at    timestamptz not null default now()
);

create table public.jenis_servis (
  id             uuid primary key default gen_random_uuid(),
  bengkel_id     uuid not null references public.bengkel (id),
  nama           text not null check (char_length(nama) between 2 and 80),
  deskripsi      text,
  harga_jasa     int  not null check (harga_jasa >= 0),
  durasi_menit   int  not null default 60 check (durasi_menit between 5 and 600),
  interval_km    int  check (interval_km > 0),
  interval_hari  int  check (interval_hari > 0),
  aktif          boolean not null default true,
  created_at     timestamptz not null default now()
);

create table public.booking (
  id               uuid primary key default gen_random_uuid(),
  bengkel_id       uuid not null references public.bengkel (id),
  motor_id         uuid not null references public.motor (id),
  jenis_servis_id  uuid not null references public.jenis_servis (id),
  tanggal          date not null,
  jam_slot         time not null,
  nomor_antrean    int  not null,
  kode             text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  sumber           public.sumber_booking not null default 'online',
  status           public.status_booking not null default 'menunggu',
  keluhan          text check (char_length(keluhan) <= 500),
  dibuat_oleh      uuid references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (bengkel_id, tanggal, nomor_antrean)
);
create index booking_bengkel_tanggal_idx on public.booking (bengkel_id, tanggal);
create index booking_motor_idx on public.booking (motor_id);

create table public.servis (
  id              uuid primary key default gen_random_uuid(),
  booking_id      uuid not null unique references public.booking (id),
  mekanik_id      uuid references public.profiles (id) on delete set null,
  km_saat_servis  int check (km_saat_servis >= 0),
  catatan         text check (char_length(catatan) <= 1000),
  mulai           timestamptz,
  selesai         timestamptz,
  total           int not null default 0 check (total >= 0),
  status_bayar    public.status_bayar not null default 'belum',
  metode_bayar    public.metode_bayar,
  created_at      timestamptz not null default now()
);

create table public.sparepart (
  id            uuid primary key default gen_random_uuid(),
  bengkel_id    uuid not null references public.bengkel (id),
  kode          text not null check (char_length(kode) between 1 and 30),
  nama          text not null check (char_length(nama) between 2 and 100),
  stok          int  not null default 0 check (stok >= 0),
  stok_minimum  int  not null default 0 check (stok_minimum >= 0),
  harga_jual    int  not null check (harga_jual >= 0),
  created_at    timestamptz not null default now(),
  unique (bengkel_id, kode)
);

create table public.servis_item (
  id            uuid primary key default gen_random_uuid(),
  servis_id     uuid not null references public.servis (id) on delete cascade,
  tipe          public.tipe_item not null,
  sparepart_id  uuid references public.sparepart (id),
  nama          text not null,
  qty           int  not null check (qty > 0),
  harga         int  not null check (harga >= 0),
  check ((tipe = 'sparepart') = (sparepart_id is not null))
);
create index servis_item_servis_idx on public.servis_item (servis_id);

-- Jejak audit: setiap perubahan stok tercatat di sini.
create table public.mutasi_stok (
  id            uuid primary key default gen_random_uuid(),
  sparepart_id  uuid not null references public.sparepart (id),
  servis_id     uuid references public.servis (id),
  jumlah        int  not null check (jumlah <> 0),
  alasan        text not null,
  dibuat_oleh   uuid references public.profiles (id) on delete set null,
  waktu         timestamptz not null default now()
);
create index mutasi_stok_sparepart_idx on public.mutasi_stok (sparepart_id, waktu desc);

create table public.pengingat (
  id                   uuid primary key default gen_random_uuid(),
  motor_id             uuid not null references public.motor (id) on delete cascade,
  jenis_servis_id      uuid not null references public.jenis_servis (id),
  jatuh_tempo_tanggal  date,
  jatuh_tempo_km       int,
  status               public.status_pengingat not null default 'terjadwal',
  dikirim_at           timestamptz,
  created_at           timestamptz not null default now(),
  check (jatuh_tempo_tanggal is not null or jatuh_tempo_km is not null)
);
create index pengingat_status_idx on public.pengingat (status, jatuh_tempo_tanggal);

create table public.ulasan (
  id          uuid primary key default gen_random_uuid(),
  servis_id   uuid not null unique references public.servis (id),
  rating      int  not null check (rating between 1 and 5),
  komentar    text check (char_length(komentar) <= 500),
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3. Fungsi bantu (waktu WIB, plat nomor, peran)
-- ---------------------------------------------------------------------
create or replace function public.hari_ini() returns date
language sql stable as $$ select (now() at time zone 'Asia/Jakarta')::date $$;

create or replace function public.jam_kini() returns time
language sql stable as $$ select (now() at time zone 'Asia/Jakarta')::time $$;

-- "l1234ab" / "L 1234 AB" / "l-1234-ab" → "L 1234 AB"
create or replace function public.normalisasi_plat(p text) returns text
language plpgsql immutable as $$
declare
  v text := regexp_replace(upper(coalesce(p, '')), '[^A-Z0-9]', '', 'g');
begin
  if v !~ '^[A-Z]{1,2}[0-9]{1,4}[A-Z]{0,3}$' then
    raise exception 'Format plat nomor tidak valid (contoh: L 1234 AB).';
  end if;
  return trim(regexp_replace(v, '^([A-Z]{1,2})([0-9]{1,4})([A-Z]{0,3})$', '\1 \2 \3'));
end $$;

create or replace function public.trg_motor_normalisasi() returns trigger
language plpgsql as $$
begin
  new.plat_nomor := public.normalisasi_plat(new.plat_nomor);
  return new;
end $$;
create trigger motor_normalisasi before insert or update of plat_nomor on public.motor
  for each row execute function public.trg_motor_normalisasi();

create or replace function public.trg_set_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at := now(); return new; end $$;
create trigger booking_updated_at before update on public.booking
  for each row execute function public.trg_set_updated_at();

-- Fungsi peran dipakai di policy RLS. SECURITY DEFINER agar tidak memicu
-- rekursi policy, dan hanya membaca data milik pemanggil sendiri.
create or replace function public.peran_saya() returns public.peran
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function public.bengkel_saya() returns uuid
language sql stable security definer set search_path = public as $$
  select bengkel_id from profiles where id = auth.uid()
$$;

create or replace function public.is_staf() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('admin', 'mekanik', 'pemilik') and bengkel_id is not null
                   from profiles where id = auth.uid()), false)
$$;

create or replace function public.is_pengelola() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('admin', 'pemilik') and bengkel_id is not null
                   from profiles where id = auth.uid()), false)
$$;

create or replace function public.motor_milik_saya(p_motor_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from motor where id = p_motor_id and pemilik_id = auth.uid())
$$;

create or replace function public.motor_di_bengkel_saya(p_motor_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_staf() and exists (
    select 1 from booking where motor_id = p_motor_id and bengkel_id = public.bengkel_saya())
$$;

create or replace function public.pelanggan_di_bengkel_saya(p_profile_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_staf() and exists (
    select 1 from motor m join booking b on b.motor_id = m.id
    where m.pemilik_id = p_profile_id and b.bengkel_id = public.bengkel_saya())
$$;

create or replace function public.booking_milik_saya(p_booking_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from booking b join motor m on m.id = b.motor_id
    where b.id = p_booking_id and m.pemilik_id = auth.uid())
$$;

create or replace function public.booking_di_bengkel_saya(p_booking_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_staf() and exists (
    select 1 from booking where id = p_booking_id and bengkel_id = public.bengkel_saya())
$$;

create or replace function public.servis_milik_saya(p_servis_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from servis s where s.id = p_servis_id and public.booking_milik_saya(s.booking_id))
$$;

create or replace function public.servis_di_bengkel_saya(p_servis_id uuid, p_harus_terbuka boolean default false)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from servis s
    where s.id = p_servis_id
      and public.booking_di_bengkel_saya(s.booking_id)
      and (not p_harus_terbuka or s.selesai is null))
$$;

-- ---------------------------------------------------------------------
-- 4. Pembuatan profil otomatis saat daftar. Peran SELALU 'pelanggan';
--    metadata dari klien tidak bisa menaikkan peran.
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_hp text := nullif(regexp_replace(coalesce(new.raw_user_meta_data ->> 'no_hp', ''), '[^0-9+]', '', 'g'), '');
begin
  if v_hp is not null and v_hp !~ '^(\+62|62|0)8[0-9]{7,12}$' then
    v_hp := null;
  end if;
  insert into profiles (id, nama, no_hp)
  values (
    new.id,
    left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'nama'), ''),
                  nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
                  split_part(new.email, '@', 1)), 100),
    v_hp);
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Harga & nama item sparepart diambil dari master, bukan dari input klien.
create or replace function public.trg_servis_item_harga() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_sp sparepart%rowtype;
begin
  if new.tipe = 'sparepart' then
    select * into v_sp from sparepart where id = new.sparepart_id;
    if not found then raise exception 'Sparepart tidak ditemukan.'; end if;
    new.nama := v_sp.nama;
    new.harga := v_sp.harga_jual;
  end if;
  return new;
end $$;
create trigger servis_item_harga before insert or update on public.servis_item
  for each row execute function public.trg_servis_item_harga();

-- Stok awal sparepart tercatat di mutasi.
create or replace function public.trg_sparepart_stok_awal() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.stok > 0 then
    insert into mutasi_stok (sparepart_id, jumlah, alasan, dibuat_oleh)
    values (new.id, new.stok, 'Stok awal', auth.uid());
  end if;
  return new;
end $$;
create trigger sparepart_stok_awal after insert on public.sparepart
  for each row execute function public.trg_sparepart_stok_awal();

-- ---------------------------------------------------------------------
-- 5. Row Level Security
-- ---------------------------------------------------------------------
alter table public.bengkel      enable row level security;
alter table public.profiles     enable row level security;
alter table public.motor        enable row level security;
alter table public.jenis_servis enable row level security;
alter table public.booking      enable row level security;
alter table public.servis       enable row level security;
alter table public.servis_item  enable row level security;
alter table public.sparepart    enable row level security;
alter table public.mutasi_stok  enable row level security;
alter table public.pengingat    enable row level security;
alter table public.ulasan       enable row level security;

-- bengkel: info publik; hanya pemilik yang boleh mengubah.
create policy bengkel_baca on public.bengkel for select to anon, authenticated using (true);
create policy bengkel_ubah on public.bengkel for update to authenticated
  using (public.peran_saya() = 'pemilik' and id = public.bengkel_saya())
  with check (public.peran_saya() = 'pemilik' and id = public.bengkel_saya());

-- profiles: baca milik sendiri; staf membaca karyawan & pelanggan bengkelnya.
create policy profiles_baca on public.profiles for select to authenticated
  using (
    id = auth.uid()
    or (public.is_staf() and bengkel_id = public.bengkel_saya())
    or public.pelanggan_di_bengkel_saya(id));
create policy profiles_ubah_sendiri on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
-- Kolom role & bengkel_id tidak bisa diubah dari aplikasi.
revoke update on public.profiles from anon, authenticated;
grant update (nama, no_hp) on public.profiles to authenticated;

-- motor
create policy motor_baca on public.motor for select to authenticated
  using (pemilik_id = auth.uid() or public.motor_di_bengkel_saya(id));
create policy motor_tambah on public.motor for insert to authenticated
  with check (pemilik_id = auth.uid());
create policy motor_ubah on public.motor for update to authenticated
  using (pemilik_id = auth.uid()) with check (pemilik_id = auth.uid());
create policy motor_hapus on public.motor for delete to authenticated
  using (pemilik_id = auth.uid());

-- jenis_servis: yang aktif terlihat publik; pengelola bengkel mengatur.
create policy jenis_servis_baca on public.jenis_servis for select to anon, authenticated
  using (aktif or (public.is_staf() and bengkel_id = public.bengkel_saya()));
create policy jenis_servis_tambah on public.jenis_servis for insert to authenticated
  with check (public.is_pengelola() and bengkel_id = public.bengkel_saya());
create policy jenis_servis_ubah on public.jenis_servis for update to authenticated
  using (public.is_pengelola() and bengkel_id = public.bengkel_saya())
  with check (public.is_pengelola() and bengkel_id = public.bengkel_saya());

-- booking: hanya dibaca langsung; semua penulisan lewat fungsi di bagian 6.
create policy booking_baca on public.booking for select to authenticated
  using (public.booking_milik_saya(id) or (public.is_staf() and bengkel_id = public.bengkel_saya()));

-- servis
create policy servis_baca on public.servis for select to authenticated
  using (public.booking_milik_saya(booking_id) or public.booking_di_bengkel_saya(booking_id));

-- servis_item: staf menambah/menghapus item selama nota belum selesai.
create policy servis_item_baca on public.servis_item for select to authenticated
  using (public.servis_milik_saya(servis_id) or public.servis_di_bengkel_saya(servis_id));
create policy servis_item_tambah on public.servis_item for insert to authenticated
  with check (
    public.servis_di_bengkel_saya(servis_id, true)
    and (sparepart_id is null or exists (
      select 1 from public.sparepart sp where sp.id = sparepart_id and sp.bengkel_id = public.bengkel_saya())));
create policy servis_item_hapus on public.servis_item for delete to authenticated
  using (public.servis_di_bengkel_saya(servis_id, true));

-- sparepart: staf membaca; pengelola mengatur. Kolom stok hanya berubah lewat fungsi.
create policy sparepart_baca on public.sparepart for select to authenticated
  using (public.is_staf() and bengkel_id = public.bengkel_saya());
create policy sparepart_tambah on public.sparepart for insert to authenticated
  with check (public.is_pengelola() and bengkel_id = public.bengkel_saya());
create policy sparepart_ubah on public.sparepart for update to authenticated
  using (public.is_pengelola() and bengkel_id = public.bengkel_saya())
  with check (public.is_pengelola() and bengkel_id = public.bengkel_saya());
revoke update on public.sparepart from anon, authenticated;
grant update (kode, nama, stok_minimum, harga_jual) on public.sparepart to authenticated;

-- mutasi_stok: hanya dibaca; ditulis oleh fungsi.
create policy mutasi_stok_baca on public.mutasi_stok for select to authenticated
  using (exists (select 1 from public.sparepart sp
                 where sp.id = sparepart_id and public.is_staf() and sp.bengkel_id = public.bengkel_saya()));

-- pengingat
create policy pengingat_baca on public.pengingat for select to authenticated
  using (
    public.motor_milik_saya(motor_id)
    or (public.is_staf() and exists (select 1 from public.jenis_servis js
                                     where js.id = jenis_servis_id and js.bengkel_id = public.bengkel_saya())));

-- ulasan: pelanggan memberi ulasan untuk servis miliknya yang sudah selesai.
create policy ulasan_baca on public.ulasan for select to authenticated
  using (public.servis_milik_saya(servis_id) or public.servis_di_bengkel_saya(servis_id));
create policy ulasan_tambah on public.ulasan for insert to authenticated
  with check (public.servis_milik_saya(servis_id)
              and exists (select 1 from public.servis s where s.id = servis_id and s.selesai is not null));

-- ---------------------------------------------------------------------
-- 6. Fungsi bisnis (dipanggil dari aplikasi lewat supabase.rpc)
-- ---------------------------------------------------------------------

-- Slot jam untuk satu tanggal beserta sisa kapasitasnya.
create or replace function public.slot_tersedia(p_bengkel_id uuid, p_tanggal date)
returns table (jam_slot text, terisi int, kapasitas int, tersedia boolean)
language sql stable security definer set search_path = public as $$
  with b as (select * from bengkel where id = p_bengkel_id),
  s as (
    select gs::time as jam, b.durasi_slot_menit as durasi, b.kapasitas_per_slot as kap
    from b, generate_series(
      p_tanggal + b.jam_buka,
      p_tanggal + b.jam_tutup - make_interval(mins => b.durasi_slot_menit),
      make_interval(mins => b.durasi_slot_menit)) gs
  ),
  hitung as (
    select s.jam, s.kap,
      (select count(*)::int from booking bk
        where bk.bengkel_id = p_bengkel_id and bk.tanggal = p_tanggal and bk.status <> 'batal'
          and bk.jam_slot >= s.jam and bk.jam_slot < s.jam + make_interval(mins => s.durasi)) as n
    from s
  )
  select to_char(h.jam, 'HH24:MI'), h.n, h.kap,
         h.n < h.kap and (p_tanggal > public.hari_ini() or h.jam > public.jam_kini())
  from hitung h
  where p_tanggal between public.hari_ini() and public.hari_ini() + 14
  order by h.jam
$$;

-- Booking online oleh pelanggan: validasi, kunci slot, nomor antrean.
create or replace function public.buat_booking(
  p_motor_id uuid, p_jenis_servis_id uuid, p_tanggal date, p_jam_slot time, p_keluhan text default null)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_uid    uuid := auth.uid();
  v_js     jenis_servis%rowtype;
  v_b      bengkel%rowtype;
  v_terisi int;
  v_nomor  int;
  v_kode   text;
begin
  if v_uid is null then raise exception 'Silakan masuk terlebih dahulu.'; end if;
  if not public.motor_milik_saya(p_motor_id) then raise exception 'Motor tidak ditemukan.'; end if;

  select * into v_js from jenis_servis where id = p_jenis_servis_id and aktif;
  if not found then raise exception 'Jenis servis tidak tersedia.'; end if;
  select * into v_b from bengkel where id = v_js.bengkel_id;

  if p_tanggal < public.hari_ini() or p_tanggal > public.hari_ini() + 14 then
    raise exception 'Tanggal booking harus antara hari ini dan 14 hari ke depan.';
  end if;
  if p_jam_slot < v_b.jam_buka
     or p_jam_slot > v_b.jam_tutup - make_interval(mins => v_b.durasi_slot_menit)
     or (extract(epoch from (p_jam_slot - v_b.jam_buka))::int % (v_b.durasi_slot_menit * 60)) <> 0 then
    raise exception 'Jam yang dipilih bukan slot yang tersedia.';
  end if;
  if p_tanggal = public.hari_ini() and p_jam_slot <= public.jam_kini() then
    raise exception 'Slot jam ini sudah lewat. Silakan pilih jam lain.';
  end if;
  if char_length(coalesce(p_keluhan, '')) > 500 then
    raise exception 'Keluhan maksimal 500 karakter.';
  end if;

  -- Batas wajar agar satu akun tidak membanjiri antrean.
  if (select count(*) from booking where dibuat_oleh = v_uid and created_at > now() - interval '1 day') >= 5 then
    raise exception 'Batas booking tercapai (5 per 24 jam). Coba lagi besok.';
  end if;
  if exists (select 1 from booking where motor_id = p_motor_id and tanggal = p_tanggal
             and status not in ('batal', 'selesai')) then
    raise exception 'Motor ini sudah punya booking aktif di tanggal tersebut.';
  end if;

  -- Kunci per bengkel+tanggal supaya dua booking bersamaan tidak melebihi kuota.
  perform pg_advisory_xact_lock(hashtext(v_b.id::text || p_tanggal::text));

  select count(*) into v_terisi from booking
  where bengkel_id = v_b.id and tanggal = p_tanggal and status <> 'batal'
    and jam_slot >= p_jam_slot and jam_slot < p_jam_slot + make_interval(mins => v_b.durasi_slot_menit);
  if v_terisi >= v_b.kapasitas_per_slot then
    raise exception 'Slot ini sudah penuh. Silakan pilih jam lain.';
  end if;

  select coalesce(max(nomor_antrean), 0) + 1 into v_nomor
  from booking where bengkel_id = v_b.id and tanggal = p_tanggal;

  insert into booking (bengkel_id, motor_id, jenis_servis_id, tanggal, jam_slot, nomor_antrean,
                       sumber, status, keluhan, dibuat_oleh)
  values (v_b.id, p_motor_id, v_js.id, p_tanggal, p_jam_slot, v_nomor,
          'online', 'menunggu', nullif(trim(p_keluhan), ''), v_uid)
  returning kode into v_kode;

  return v_kode;
end $$;

-- Pelanggan membatalkan booking miliknya sebelum dikerjakan.
create or replace function public.batalkan_booking_saya(p_booking_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.booking_milik_saya(p_booking_id) then raise exception 'Booking tidak ditemukan.'; end if;
  update booking set status = 'batal'
  where id = p_booking_id and status in ('menunggu', 'dikonfirmasi');
  if not found then raise exception 'Booking yang sudah dikerjakan tidak bisa dibatalkan.'; end if;
end $$;

-- Pelanggan datang langsung: admin mendaftarkan motor (tanpa akun) dan antrean.
create or replace function public.buat_walk_in(
  p_plat text, p_merk text, p_tipe text, p_nama text, p_no_hp text,
  p_jenis_servis_id uuid, p_keluhan text default null)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_uid     uuid := auth.uid();
  v_bengkel uuid := public.bengkel_saya();
  v_js      jenis_servis%rowtype;
  v_motor   uuid;
  v_nomor   int;
  v_kode    text;
  v_hp      text := nullif(regexp_replace(coalesce(p_no_hp, ''), '[^0-9+]', '', 'g'), '');
begin
  if not public.is_pengelola() then raise exception 'Hanya admin bengkel yang bisa menambah walk-in.'; end if;

  select * into v_js from jenis_servis where id = p_jenis_servis_id and bengkel_id = v_bengkel and aktif;
  if not found then raise exception 'Jenis servis tidak tersedia.'; end if;

  select id into v_motor from motor where plat_nomor = public.normalisasi_plat(p_plat);
  if v_motor is null then
    insert into motor (plat_nomor, merk, tipe, nama_pemilik, no_hp)
    values (p_plat, trim(p_merk), trim(p_tipe), nullif(trim(p_nama), ''), v_hp)
    returning id into v_motor;
  end if;

  if exists (select 1 from booking where motor_id = v_motor and tanggal = public.hari_ini()
             and status not in ('batal', 'selesai')) then
    raise exception 'Motor ini sudah ada di antrean hari ini.';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_bengkel::text || public.hari_ini()::text));
  select coalesce(max(nomor_antrean), 0) + 1 into v_nomor
  from booking where bengkel_id = v_bengkel and tanggal = public.hari_ini();

  insert into booking (bengkel_id, motor_id, jenis_servis_id, tanggal, jam_slot, nomor_antrean,
                       sumber, status, keluhan, dibuat_oleh)
  values (v_bengkel, v_motor, v_js.id, public.hari_ini(),
          date_trunc('minute', now() at time zone 'Asia/Jakarta')::time, v_nomor,
          'walk_in', 'dikonfirmasi', nullif(trim(p_keluhan), ''), v_uid)
  returning kode into v_kode;

  return v_kode;
end $$;

-- Perubahan status oleh staf. Perpindahan yang sah:
--   menunggu     → dikonfirmasi | batal      (admin/pemilik)
--   dikonfirmasi → dikerjakan               (semua staf)
--   dikonfirmasi → batal                    (admin/pemilik)
-- "menunggu_bayar" lewat selesai_dikerjakan(), "selesai" lewat selesaikan_servis().
create or replace function public.ubah_status_booking(p_booking_id uuid, p_status public.status_booking)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_uid    uuid := auth.uid();
  v_role   public.peran := public.peran_saya();
  v_bk     booking%rowtype;
  v_js     jenis_servis%rowtype;
  v_servis uuid;
begin
  if not public.is_staf() then raise exception 'Akses ditolak.'; end if;

  select * into v_bk from booking where id = p_booking_id and bengkel_id = public.bengkel_saya() for update;
  if not found then raise exception 'Booking tidak ditemukan.'; end if;

  if not (
       (v_bk.status = 'menunggu'     and p_status in ('dikonfirmasi', 'batal') and v_role <> 'mekanik')
    or (v_bk.status = 'dikonfirmasi' and p_status = 'dikerjakan')
    or (v_bk.status = 'dikonfirmasi' and p_status = 'batal' and v_role <> 'mekanik')
  ) then
    raise exception 'Status "%" tidak bisa diubah menjadi "%".', v_bk.status, p_status;
  end if;

  if p_status = 'dikerjakan' then
    select * into v_js from jenis_servis where id = v_bk.jenis_servis_id;
    insert into servis (booking_id, mekanik_id, mulai)
    values (v_bk.id, case when v_role = 'mekanik' then v_uid end, now())
    returning id into v_servis;
    insert into servis_item (servis_id, tipe, nama, qty, harga)
    values (v_servis, 'jasa', v_js.nama, 1, v_js.harga_jasa);
  end if;

  update booking set status = p_status where id = v_bk.id;
end $$;

-- Mekanik selesai mengerjakan: catat km & catatan, lanjut ke kasir.
create or replace function public.selesai_dikerjakan(p_booking_id uuid, p_km int, p_catatan text default null)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_uid  uuid := auth.uid();
  v_role public.peran := public.peran_saya();
  v_bk   booking%rowtype;
  v_sv   servis%rowtype;
  v_km   int;
begin
  if not public.is_staf() then raise exception 'Akses ditolak.'; end if;

  select * into v_bk from booking where id = p_booking_id and bengkel_id = public.bengkel_saya() for update;
  if not found or v_bk.status <> 'dikerjakan' then raise exception 'Servis ini tidak sedang dikerjakan.'; end if;

  select * into v_sv from servis where booking_id = v_bk.id for update;
  if v_role = 'mekanik' and v_sv.mekanik_id is not null and v_sv.mekanik_id <> v_uid then
    raise exception 'Servis ini dikerjakan mekanik lain.';
  end if;

  select km_terakhir into v_km from motor where id = v_bk.motor_id;
  if p_km is null or p_km < 0 or p_km > 2000000 then raise exception 'Km tidak valid.'; end if;
  if p_km < v_km then raise exception 'Km tidak boleh lebih kecil dari km terakhir (% km).', v_km; end if;
  if char_length(coalesce(p_catatan, '')) > 1000 then raise exception 'Catatan maksimal 1000 karakter.'; end if;

  update servis
  set km_saat_servis = p_km,
      catatan = nullif(trim(p_catatan), ''),
      mekanik_id = coalesce(mekanik_id, case when v_role = 'mekanik' then v_uid end)
  where id = v_sv.id;

  update booking set status = 'menunggu_bayar' where id = v_bk.id;
end $$;

-- Kasir menyelesaikan nota dalam SATU transaksi:
-- potong stok + log mutasi, hitung total, tutup booking, perbarui km,
-- tutup pengingat lama, buat pengingat berikutnya.
create or replace function public.selesaikan_servis(p_booking_id uuid, p_metode public.metode_bayar)
returns int
language plpgsql security definer set search_path = public as $$
declare
  v_uid    uuid := auth.uid();
  v_bk     booking%rowtype;
  v_sv     servis%rowtype;
  v_js     jenis_servis%rowtype;
  v_item   record;
  v_total  int;
  v_km     int;
begin
  if not public.is_pengelola() then raise exception 'Hanya admin/kasir yang bisa menyelesaikan nota.'; end if;

  select * into v_bk from booking where id = p_booking_id and bengkel_id = public.bengkel_saya() for update;
  if not found or v_bk.status <> 'menunggu_bayar' then
    raise exception 'Nota hanya bisa diselesaikan setelah mekanik selesai mengerjakan.';
  end if;
  select * into v_sv from servis where booking_id = v_bk.id for update;

  for v_item in
    select si.sparepart_id, si.nama, sum(si.qty)::int as qty
    from servis_item si where si.servis_id = v_sv.id and si.tipe = 'sparepart'
    group by si.sparepart_id, si.nama
  loop
    update sparepart set stok = stok - v_item.qty
    where id = v_item.sparepart_id and bengkel_id = v_bk.bengkel_id and stok >= v_item.qty;
    if not found then raise exception 'Stok "%" tidak cukup.', v_item.nama; end if;
    insert into mutasi_stok (sparepart_id, servis_id, jumlah, alasan, dibuat_oleh)
    values (v_item.sparepart_id, v_sv.id, -v_item.qty, 'Dipakai servis #' || v_bk.kode, v_uid);
  end loop;

  select coalesce(sum(qty * harga), 0)::int into v_total from servis_item where servis_id = v_sv.id;

  update servis set selesai = now(), total = v_total, status_bayar = 'lunas', metode_bayar = p_metode
  where id = v_sv.id;
  update booking set status = 'selesai' where id = v_bk.id;

  update motor set km_terakhir = greatest(km_terakhir, coalesce(v_sv.km_saat_servis, 0))
  where id = v_bk.motor_id
  returning km_terakhir into v_km;

  update pengingat set status = 'selesai'
  where motor_id = v_bk.motor_id and jenis_servis_id = v_bk.jenis_servis_id and status <> 'selesai';

  select * into v_js from jenis_servis where id = v_bk.jenis_servis_id;
  if v_js.interval_hari is not null or v_js.interval_km is not null then
    insert into pengingat (motor_id, jenis_servis_id, jatuh_tempo_tanggal, jatuh_tempo_km)
    values (v_bk.motor_id, v_js.id,
            case when v_js.interval_hari is not null then public.hari_ini() + v_js.interval_hari end,
            case when v_js.interval_km is not null then v_km + v_js.interval_km end);
  end if;

  return v_total;
end $$;

-- Penyesuaian stok manual (restock / koreksi), selalu tercatat di mutasi.
create or replace function public.sesuaikan_stok(p_sparepart_id uuid, p_jumlah int, p_alasan text)
returns int
language plpgsql security definer set search_path = public as $$
declare v_stok int;
begin
  if not public.is_pengelola() then raise exception 'Akses ditolak.'; end if;
  if p_jumlah is null or p_jumlah = 0 then raise exception 'Jumlah tidak boleh nol.'; end if;
  if char_length(trim(coalesce(p_alasan, ''))) < 3 then raise exception 'Alasan wajib diisi.'; end if;

  update sparepart set stok = stok + p_jumlah
  where id = p_sparepart_id and bengkel_id = public.bengkel_saya() and stok + p_jumlah >= 0
  returning stok into v_stok;
  if not found then raise exception 'Sparepart tidak ditemukan atau stok akan menjadi minus.'; end if;

  insert into mutasi_stok (sparepart_id, jumlah, alasan, dibuat_oleh)
  values (p_sparepart_id, p_jumlah, trim(p_alasan), auth.uid());
  return v_stok;
end $$;

-- Status antrean publik berdasarkan kode booking (tanpa login).
-- Hanya mengembalikan data minimum; plat nomor disamarkan.
create or replace function public.status_antrean(p_kode text) returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'kode', bk.kode,
    'nomor', bk.nomor_antrean,
    'status', bk.status,
    'tanggal', bk.tanggal,
    'jam_slot', to_char(bk.jam_slot, 'HH24:MI'),
    'jenis_servis', js.nama,
    'durasi_menit', js.durasi_menit,
    'plat', split_part(m.plat_nomor, ' ', 1) || ' ****',
    'bengkel', b.nama,
    'alamat', b.alamat,
    'posisi', (select count(*) from booking x
               where x.bengkel_id = bk.bengkel_id and x.tanggal = bk.tanggal
                 and x.status in ('menunggu', 'dikonfirmasi')
                 and (x.jam_slot, x.nomor_antrean) < (bk.jam_slot, bk.nomor_antrean)),
    'sedang_dikerjakan', (select coalesce(json_agg(x.nomor_antrean order by x.nomor_antrean), '[]'::json)
                          from booking x
                          where x.bengkel_id = bk.bengkel_id and x.tanggal = bk.tanggal
                            and x.status = 'dikerjakan'))
  from booking bk
  join jenis_servis js on js.id = bk.jenis_servis_id
  join motor m on m.id = bk.motor_id
  join bengkel b on b.id = bk.bengkel_id
  where bk.kode = upper(trim(p_kode))
$$;

-- Job harian (Vercel Cron): tandai pengingat yang jatuh tempo hari ini.
create or replace function public.tandai_pengingat_jatuh_tempo() returns int
language plpgsql security definer set search_path = public as $$
declare v_n int;
begin
  update pengingat set status = 'jatuh_tempo'
  where status = 'terjadwal' and jatuh_tempo_tanggal is not null and jatuh_tempo_tanggal <= public.hari_ini();
  get diagnostics v_n = row_count;
  return v_n;
end $$;

-- Dijalankan MANUAL dari SQL Editor untuk menjadikan akun sebagai staf.
create or replace function public.jadikan_staf(p_email text, p_role public.peran, p_bengkel_id uuid default null)
returns void
language plpgsql security definer set search_path = public as $$
begin
  update profiles set role = p_role,
         bengkel_id = case when p_role = 'pelanggan' then null
                           else coalesce(p_bengkel_id, (select id from bengkel order by created_at limit 1)) end
  where id = (select id from auth.users where lower(email) = lower(p_email));
  if not found then raise exception 'Akun % belum terdaftar.', p_email; end if;
end $$;

-- ---------------------------------------------------------------------
-- 7. Hak eksekusi fungsi (default Supabase: semua bisa; kita batasi)
-- ---------------------------------------------------------------------
revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function public.hari_ini(), public.jam_kini(), public.normalisasi_plat(text),
  public.peran_saya(), public.bengkel_saya(), public.is_staf(), public.is_pengelola(),
  public.motor_milik_saya(uuid), public.motor_di_bengkel_saya(uuid), public.pelanggan_di_bengkel_saya(uuid),
  public.booking_milik_saya(uuid), public.booking_di_bengkel_saya(uuid),
  public.servis_milik_saya(uuid), public.servis_di_bengkel_saya(uuid, boolean)
  to anon, authenticated;

grant execute on function public.status_antrean(text) to anon, authenticated;

grant execute on function
  public.slot_tersedia(uuid, date),
  public.buat_booking(uuid, uuid, date, time, text),
  public.batalkan_booking_saya(uuid),
  public.buat_walk_in(text, text, text, text, text, uuid, text),
  public.ubah_status_booking(uuid, public.status_booking),
  public.selesai_dikerjakan(uuid, int, text),
  public.selesaikan_servis(uuid, public.metode_bayar),
  public.sesuaikan_stok(uuid, int, text)
  to authenticated;

grant execute on function public.tandai_pengingat_jatuh_tempo() to service_role;
-- jadikan_staf sengaja tidak diberikan ke siapa pun: hanya dari SQL Editor.

-- ---------------------------------------------------------------------
-- 8. Realtime untuk antrean (tetap tunduk pada RLS)
-- ---------------------------------------------------------------------
alter publication supabase_realtime add table public.booking;
