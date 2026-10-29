-- ICON MUN applicant portal + digital event pass / check-in
-- Apply after supabase/schema.sql. Safe to re-run.
-- Public visitors cannot read applications or pass rows directly. Applicant data is
-- returned only by an authenticated-email-checked RPC; only admins can scan/check in.

create table if not exists public.event_passes (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.applications(id) on delete cascade,
  token uuid not null unique default gen_random_uuid(),
  created_at timestamptz not null default now(),
  checked_in_at timestamptz,
  checked_in_by uuid references auth.users(id) on delete set null
);

alter table public.event_passes enable row level security;
revoke all on public.event_passes from anon, authenticated;
grant select, insert, update, delete on public.event_passes to authenticated;

drop policy if exists event_passes_admin_only on public.event_passes;
create policy event_passes_admin_only on public.event_passes
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create or replace function public.my_application_status()
returns table (
  id uuid,
  created_at timestamptz,
  track text,
  status text,
  committee text,
  first_country text,
  institution text,
  delegation_type text,
  role text,
  pass_token uuid,
  checked_in_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  verified_email text;
begin
  if auth.uid() is null then
    raise exception 'Please sign in first' using errcode = '42501';
  end if;
  verified_email := lower(coalesce(auth.jwt() ->> 'email', ''));
  if verified_email = '' then
    raise exception 'A verified email is required' using errcode = '42501';
  end if;

  -- Issue a stable pass only for accepted applications belonging to this verified email.
  insert into public.event_passes(application_id)
  select a.id
  from public.applications a
  where lower(a.email) = verified_email and a.status = 'accepted'
  on conflict (application_id) do nothing;

  return query
  select a.id, a.created_at, a.track, a.status, a.committee, a.first_country,
         a.institution, a.delegation_type,
         case when a.track = 'delegate' then a.committee else coalesce(a.details ->> 'focus', a.track) end,
         case when a.status = 'accepted' then p.token else null::uuid end,
         p.checked_in_at
  from public.applications a
  left join public.event_passes p on p.application_id = a.id
  where lower(a.email) = verified_email
  order by a.created_at desc;
end;
$$;

revoke all on function public.my_application_status() from public, anon;
grant execute on function public.my_application_status() to authenticated;

create or replace function public.check_in_pass(p_token text)
returns table (
  ok boolean,
  name text,
  email text,
  track text,
  role text,
  checked_in_at timestamptz,
  message text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  pass_row public.event_passes%rowtype;
  app_row public.applications%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Organiser access required' using errcode = '42501';
  end if;
  if p_token is null or p_token !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return query select false, null::text, null::text, null::text, null::text, null::timestamptz, 'Invalid pass code';
    return;
  end if;

  select ep.* into pass_row from public.event_passes ep where ep.token = p_token::uuid for update;
  if not found then
    return query select false, null::text, null::text, null::text, null::text, null::timestamptz, 'Pass not found';
    return;
  end if;

  select a.* into app_row from public.applications a where a.id = pass_row.application_id;
  if app_row.status <> 'accepted' then
    return query select false, null::text, null::text, null::text, null::text, null::timestamptz, 'Application is not accepted';
    return;
  end if;
  if pass_row.checked_in_at is not null then
    return query select false, app_row.full_name, app_row.email, app_row.track,
      case when app_row.track = 'delegate' then app_row.committee else coalesce(app_row.details ->> 'focus', app_row.track) end,
      pass_row.checked_in_at, 'Already checked in';
    return;
  end if;

  update public.event_passes
  set checked_in_at = now(), checked_in_by = auth.uid()
  where id = pass_row.id
  returning * into pass_row;

  return query select true, app_row.full_name, app_row.email, app_row.track,
    case when app_row.track = 'delegate' then app_row.committee else coalesce(app_row.details ->> 'focus', app_row.track) end,
    pass_row.checked_in_at, 'Check-in successful';
end;
$$;

revoke all on function public.check_in_pass(text) from public, anon;
grant execute on function public.check_in_pass(text) to authenticated;
