-- =====================================================================
-- VLX — Rentals CMS: 30-minute admin sign-in limit (database side)
-- Run once in Supabase: Dashboard → SQL Editor → New query → Run.
-- Safe to re-run.
--
-- The CMS already signs admins out 30 minutes after they sign in. This makes
-- the database enforce the same rule: 30 minutes after the password was
-- entered, that login can no longer add, edit, delete or upload anything —
-- even if the browser check is bypassed or an old token is reused.
-- (It uses the sign-in time inside the Supabase token, which does not change
-- when the token is silently refreshed.)
-- =====================================================================

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
      ) > extract(epoch from now()) - 30 * 60,  -- ← 30-minute limit
      true  -- tokens without a sign-in time: rely on the CMS's own limit
    );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;
