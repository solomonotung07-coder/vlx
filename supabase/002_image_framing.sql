-- =====================================================================
-- VLX — Featured Rentals CMS: image framing (fit / zoom / position)
-- Run once in Supabase: Dashboard → SQL Editor → New query → Run.
-- Needed if you ran schema.sql before this feature was added.
-- Safe to re-run. Existing products keep their current look
-- (fill card, 100% zoom, centred).
-- =====================================================================

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

-- Make the API pick up the new columns immediately.
notify pgrst, 'reload schema';
