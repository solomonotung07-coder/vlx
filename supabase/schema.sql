-- =====================================================================
-- VLX — Featured Rentals CMS schema
-- Run this once in Supabase: Dashboard → SQL Editor → New query → Run.
-- It is safe to re-run (everything is "if not exists" / "or replace").
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. Who is allowed to edit the CMS
--    Only emails listed here can add / edit / delete products, even if
--    someone else manages to create an account on your project.
-- ---------------------------------------------------------------------
create table if not exists public.cms_admins (
  email      text primary key,
  created_at timestamptz not null default now()
);

alter table public.cms_admins enable row level security;
-- (No policies on purpose: the table is only editable from the SQL editor.)

-- Admin = email is in cms_admins AND signed in less than 30 minutes ago
-- (sign-in time comes from the token's "amr" claim; see 003_session_limit.sql).
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1
      from public.cms_admins
      where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
    and coalesce(
      (
        select max((entry ->> 'timestamp')::bigint)
        from jsonb_array_elements(
          case
            when jsonb_typeof(auth.jwt() -> 'amr') = 'array' then auth.jwt() -> 'amr'
            else '[]'::jsonb
          end
        ) as entry
      ) > extract(epoch from now()) - 30 * 60,  -- 30-minute sign-in limit
      true
    );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------
-- 2. Rentals (the "Featured Rentals" cards on the homepage)
-- ---------------------------------------------------------------------
create table if not exists public.rentals (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (char_length(name) between 1 and 120),
  price_amount numeric(12, 2) not null check (price_amount >= 0),
  price_unit   text not null default 'day'
               check (price_unit in ('hour', 'day', 'week', 'month', 'event')),
  image_url    text,
  image_path   text,          -- path inside the storage bucket (for clean-up)
  whatsapp     text not null default '2349051376816',
  is_active    boolean not null default true,   -- false = hidden from site
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- How the photo sits in the card (set with the framing tool in /admin)
alter table public.rentals
  add column if not exists image_fit text not null default 'cover'
    constraint rentals_image_fit_check check (image_fit in ('cover', 'contain'));
alter table public.rentals
  add column if not exists image_zoom numeric(4, 2) not null default 1
    constraint rentals_image_zoom_check check (image_zoom between 1 and 3);
alter table public.rentals
  add column if not exists image_pos_x numeric(5, 2) not null default 50
    constraint rentals_image_pos_x_check check (image_pos_x between 0 and 100);
alter table public.rentals
  add column if not exists image_pos_y numeric(5, 2) not null default 50
    constraint rentals_image_pos_y_check check (image_pos_y between 0 and 100);

create index if not exists rentals_sort_idx
  on public.rentals (sort_order, created_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists rentals_set_updated_at on public.rentals;
create trigger rentals_set_updated_at
  before update on public.rentals
  for each row execute function public.set_updated_at();

alter table public.rentals enable row level security;

drop policy if exists "Anyone can read live rentals" on public.rentals;
create policy "Anyone can read live rentals"
  on public.rentals for select
  to anon, authenticated
  using (is_active or public.is_admin());

drop policy if exists "Admins can add rentals" on public.rentals;
create policy "Admins can add rentals"
  on public.rentals for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can edit rentals" on public.rentals;
create policy "Admins can edit rentals"
  on public.rentals for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete rentals" on public.rentals;
create policy "Admins can delete rentals"
  on public.rentals for delete
  to authenticated
  using (public.is_admin());

grant select on public.rentals to anon, authenticated;
grant insert, update, delete on public.rentals to authenticated;

-- ---------------------------------------------------------------------
-- 3. Image storage (public bucket, 5 MB limit, images only)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'rental-images',
  'rental-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admins can list rental images" on storage.objects;
create policy "Admins can list rental images"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'rental-images' and public.is_admin());

drop policy if exists "Admins can upload rental images" on storage.objects;
create policy "Admins can upload rental images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'rental-images' and public.is_admin());

drop policy if exists "Admins can replace rental images" on storage.objects;
create policy "Admins can replace rental images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'rental-images' and public.is_admin());

drop policy if exists "Admins can delete rental images" on storage.objects;
create policy "Admins can delete rental images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'rental-images' and public.is_admin());

-- ---------------------------------------------------------------------
-- 4. Starter products (only inserted if the table is empty)
-- ---------------------------------------------------------------------
insert into public.rentals (name, price_amount, price_unit, image_url, sort_order)
select v.name, v.price_amount, v.price_unit, v.image_url, v.sort_order
from (values
  ('Sony FX3 Cinema Camera',   180000, 'day', 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80', 1),
  ('Aputure LED Lighting Kit',  45000, 'day', 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80', 2),
  ('Canon RF Lens Kit',         95000, 'day', 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=900&q=80', 3),
  ('DJI Ronin Gimbal',          70000, 'day', 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=900&q=80', 4)
) as v(name, price_amount, price_unit, image_url, sort_order)
where not exists (select 1 from public.rentals);

-- ---------------------------------------------------------------------
-- 5. Give yourself CMS access  ← EDIT THE EMAIL, then run
--    (Create the same user under Authentication → Users → Add user.)
-- ---------------------------------------------------------------------
-- insert into public.cms_admins (email) values ('you@example.com')
--   on conflict do nothing;
