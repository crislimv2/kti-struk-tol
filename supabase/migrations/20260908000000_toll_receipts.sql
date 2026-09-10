-- Riwayat struk tol format asli 58mm (opsional; app tetap jalan dengan localStorage tanpa tabel ini)
create table if not exists public.toll_receipts (
  id uuid primary key,
  created_at timestamptz not null default now(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  gerbang_id text not null,
  operator_id text not null,
  gerbang text not null,
  sub_judul text,
  info_tol text,
  lebar_kertas smallint not null default 58 check (lebar_kertas in (58, 80)),
  tanggal timestamptz not null,
  kode_gardu text,
  no_seri text,
  kode_trx text,
  sistem text not null check (sistem in ('terbuka', 'tertutup')),
  asal_kode text,
  asal_nama text,
  golongan smallint not null check (golongan between 1 and 6),
  kartu text,
  cn text,
  tarif integer not null check (tarif >= 0),
  saldo integer,
  peringatan_saldo boolean not null default false,
  gaya jsonb not null default '{}'::jsonb,
  lines text[] not null default '{}'
);

create index if not exists toll_receipts_user_tanggal_idx
  on public.toll_receipts (user_id, tanggal desc);

alter table public.toll_receipts enable row level security;

drop policy if exists "toll_receipts_select_own" on public.toll_receipts;
create policy "toll_receipts_select_own" on public.toll_receipts
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "toll_receipts_insert_own" on public.toll_receipts;
create policy "toll_receipts_insert_own" on public.toll_receipts
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "toll_receipts_update_own" on public.toll_receipts;
create policy "toll_receipts_update_own" on public.toll_receipts
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "toll_receipts_delete_own" on public.toll_receipts;
create policy "toll_receipts_delete_own" on public.toll_receipts
  for delete to authenticated using ((select auth.uid()) = user_id);
