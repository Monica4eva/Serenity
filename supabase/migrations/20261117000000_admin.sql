-- =====================================================================
-- Project Serenity: admin dashboard (separate website, same database)
-- =====================================================================
-- What admins CAN do: verify counsellors, manage emergency numbers, see ANONYMOUS totals,
-- manage other admins, read the admin activity log.
-- What admins can NEVER do: read anyone's journal, check-ins, messages, notes or care data.
-- Every admin function checks the caller is an admin AND signed in with a second step (MFA).
--
-- The FIRST admin is added by hand in the Supabase SQL Editor (see ADMIN_SETUP.md):
--   insert into public.admins (user_id, role, display_name)
--   select id, 'admin', 'Your name' from auth.users where email = 'you@example.com';

create table public.admins (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  role         text not null check (role in ('admin', 'clinician', 'editor')),
  display_name text not null default '' check (length(display_name) <= 80),
  added_by     uuid,
  created_at   timestamptz not null default now()
);

create table public.admin_actions (
  id        bigint generated always as identity primary key,
  admin_id  uuid,
  action    text not null,
  target    text,
  detail    jsonb not null default '{}'::jsonb,
  at        timestamptz not null default now()
);
create index admin_actions_at on public.admin_actions (at desc);

-- Counsellor checks
alter table public.care_profiles
  add column review_status text not null default 'pending' check (review_status in ('pending', 'verified', 'rejected', 'suspended')),
  add column review_note   text check (length(review_note) <= 500),
  add column reviewed_at   timestamptz,
  add column reviewed_by   uuid;

-- Emergency numbers: when they were last checked, and by whom
alter table public.emergency_numbers
  add column checked_at timestamptz,
  add column checked_by uuid;

-- ---------- who is an admin (only with MFA) ----------
create or replace function public.admin_role() returns text
language sql stable security definer set search_path = '' as $$
  select a.role from public.admins a
  where a.user_id = (select auth.uid())
    and coalesce((select auth.jwt()) ->> 'aal', '') = 'aal2';
$$;
-- Lets the dashboard tell "not an admin" apart from "admin, but needs the second step".
create or replace function public.admin_status() returns text
language sql stable security definer set search_path = '' as $$
  select case
    when not exists (select 1 from public.admins a where a.user_id = (select auth.uid())) then 'none'
    when coalesce((select auth.jwt()) ->> 'aal', '') = 'aal2' then 'ok'
    else 'needs_mfa' end;
$$;
revoke all on function public.admin_role() from public, anon;
revoke all on function public.admin_status() from public, anon;
grant execute on function public.admin_role() to authenticated;
grant execute on function public.admin_status() to authenticated;

create or replace function private.require_admin(p_roles text[]) returns uuid
language plpgsql stable security definer set search_path = '' as $$
declare r text := public.admin_role();
begin
  if r is null or not (r = any (p_roles)) then raise exception 'Not allowed'; end if;
  return auth.uid();
end $$;
revoke all on function private.require_admin(text[]) from public, anon, authenticated;

create or replace function private.log_admin(p_action text, p_target text, p_detail jsonb) returns void
language sql volatile security definer set search_path = '' as $$
  insert into public.admin_actions (admin_id, action, target, detail) values (auth.uid(), p_action, p_target, coalesce(p_detail, '{}'::jsonb));
$$;
revoke all on function private.log_admin(text, text, jsonb) from public, anon, authenticated;

-- ---------- row level security ----------
alter table public.admins enable row level security;
alter table public.admins force row level security;
alter table public.admin_actions enable row level security;
alter table public.admin_actions force row level security;
revoke all on public.admins from anon;
revoke all on public.admin_actions from anon;
revoke insert, update, delete on public.admins from authenticated;
revoke insert, update, delete on public.admin_actions from authenticated;

create policy "admins: admins read" on public.admins for select to authenticated using (public.admin_role() is not null);
create policy "admin log: full admins read" on public.admin_actions for select to authenticated using (public.admin_role() = 'admin');

-- Emergency numbers: admins and clinicians can see every number (also hidden ones) and edit them.
create policy "emergency numbers: admin read" on public.emergency_numbers for select to authenticated using (public.admin_role() is not null);
create policy "emergency numbers: admin insert" on public.emergency_numbers for insert to authenticated with check (public.admin_role() in ('admin', 'clinician'));
create policy "emergency numbers: admin update" on public.emergency_numbers for update to authenticated using (public.admin_role() in ('admin', 'clinician')) with check (public.admin_role() in ('admin', 'clinician'));
create policy "emergency numbers: admin delete" on public.emergency_numbers for delete to authenticated using (public.admin_role() = 'admin');
grant insert, update, delete on public.emergency_numbers to authenticated;

create or replace function private.log_emergency_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.admin_actions (admin_id, action, target, detail)
  values (auth.uid(), 'emergency_number_' || lower(tg_op), coalesce(new.id, old.id),
          jsonb_build_object('label', coalesce(new.label, old.label), 'number', coalesce(new.number, old.number), 'active', coalesce(new.active, old.active)));
  return coalesce(new, old);
end $$;
create trigger log_emergency_change after insert or update or delete on public.emergency_numbers
for each row execute function private.log_emergency_change();

-- ---------- suspended counsellors lose access straight away ----------
create or replace function public.is_link_viewer(p_link uuid, p_perm text default null) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.care_links l
    where l.id = p_link and l.viewer_id = (select auth.uid()) and l.status = 'active'
      and (p_perm is null or coalesce((l.permissions ->> p_perm)::boolean, false))
      and not exists (select 1 from public.care_profiles cp where cp.user_id = l.viewer_id and cp.review_status = 'suspended')
  );
$$;
create or replace function public.is_link_professional(p_link uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.care_links l
    where l.id = p_link and l.viewer_id = (select auth.uid()) and l.status = 'active' and l.role = 'professional'
      and not exists (select 1 from public.care_profiles cp where cp.user_id = l.viewer_id and cp.review_status = 'suspended')
  );
$$;

-- ---------- counsellors ----------
create or replace function public.admin_list_professionals()
returns table (user_id uuid, display_name text, email text, profession text, registration text, organisation text,
               review_status text, review_note text, reviewed_at timestamptz, created_at timestamptz, active_clients bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.require_admin(array['admin', 'clinician']);
  return query
    select cp.user_id, cp.display_name, u.email::text, cp.profession, cp.registration, cp.organisation,
           cp.review_status, cp.review_note, cp.reviewed_at, cp.created_at,
           (select count(*) from public.care_links l where l.viewer_id = cp.user_id and l.status = 'active' and l.role = 'professional')
    from public.care_profiles cp left join auth.users u on u.id = cp.user_id
    where cp.role = 'professional'
    order by case cp.review_status when 'pending' then 0 when 'suspended' then 1 else 2 end, cp.created_at desc;
end $$;

create or replace function public.admin_review_professional(p_user uuid, p_status text, p_note text default null) returns void
language plpgsql volatile security definer set search_path = '' as $$
begin
  perform private.require_admin(array['admin', 'clinician']);
  if p_status not in ('pending', 'verified', 'rejected', 'suspended') then raise exception 'Unknown status'; end if;
  update public.care_profiles
  set review_status = p_status, verified = (p_status = 'verified'), review_note = left(p_note, 500), reviewed_at = now(), reviewed_by = auth.uid()
  where user_id = p_user and role = 'professional';
  if not found then raise exception 'Not found'; end if;
  perform private.log_admin('professional_' || p_status, p_user::text, jsonb_build_object('note', left(p_note, 500)));
end $$;

-- ---------- admins ----------
create or replace function public.admin_list_admins()
returns table (user_id uuid, display_name text, email text, role text, created_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.require_admin(array['admin']);
  return query select a.user_id, a.display_name, u.email::text, a.role, a.created_at
    from public.admins a left join auth.users u on u.id = a.user_id order by a.created_at;
end $$;

-- The person must already have a Serenity account (signed up with this email).
create or replace function public.admin_add(p_email text, p_role text, p_name text) returns void
language plpgsql volatile security definer set search_path = '' as $$
declare uid uuid;
begin
  perform private.require_admin(array['admin']);
  if p_role not in ('admin', 'clinician', 'editor') then raise exception 'Unknown role'; end if;
  select id into uid from auth.users where lower(email) = lower(trim(p_email)) limit 1;
  if uid is null then raise exception 'No account with that email. Ask them to sign up first.'; end if;
  insert into public.admins (user_id, role, display_name, added_by) values (uid, p_role, left(coalesce(p_name, ''), 80), auth.uid())
  on conflict (user_id) do update set role = excluded.role, display_name = excluded.display_name;
  perform private.log_admin('admin_added', uid::text, jsonb_build_object('role', p_role));
end $$;

create or replace function public.admin_remove(p_user uuid) returns void
language plpgsql volatile security definer set search_path = '' as $$
begin
  perform private.require_admin(array['admin']);
  if p_user = auth.uid() then raise exception 'You cannot remove yourself.'; end if;
  delete from public.admins where user_id = p_user;
  perform private.log_admin('admin_removed', p_user::text, '{}'::jsonb);
end $$;

-- ---------- impact dashboard: ANONYMOUS totals only ----------
-- Any group smaller than 10 people is returned as null, so nobody can be singled out.
create or replace function public.admin_impact() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  k constant int := 10;
  res jsonb;
begin
  perform private.require_admin(array['admin', 'clinician', 'editor']);

  with members as (
    select p.user_id, p.created_at, p.language, p.approach
    from public.profiles p
    where p.onboarded and not exists (select 1 from public.care_profiles cp where cp.user_id = p.user_id and cp.role in ('professional', 'supporter'))
  ),
  activity as (
    select user_id, created_at as at from public.checkins
    union all select user_id, created_at from public.journal_entries
    union all select user_id, day::timestamptz from public.day_logs
    union all select user_id, completed_at from public.activities_completed
  ),
  act as (select a.* from activity a join members m using (user_id)),
  retention as (
    select n,
      (select count(*) from members m where m.created_at <= now() - make_interval(days => n)) as cohort,
      (select count(*) from members m where m.created_at <= now() - make_interval(days => n)
         and exists (select 1 from act a where a.user_id = m.user_id and a.at >= m.created_at + make_interval(days => n))) as kept
    from unnest(array[7, 30, 90]) as n
  ),
  slips as (
    select r.user_id, r.occurred_at,
      (select min(a.at) from act a where a.user_id = r.user_id and a.at > r.occurred_at) as back_at
    from public.relapses r join members m using (user_id)
    where r.occurred_at > now() - interval '180 days' and r.occurred_at < now() - interval '7 days'
  ),
  weeks as (
    select generate_series(date_trunc('week', now()) - interval '11 weeks', date_trunc('week', now()), interval '1 week') as wk
  ),
  weekly as (
    select w.wk,
      (select count(distinct a.user_id) from act a where a.at >= w.wk and a.at < w.wk + interval '1 week') as active,
      (select count(distinct j.user_id) from public.journal_entries j join members m using (user_id) where j.mood is not null and j.created_at >= w.wk and j.created_at < w.wk + interval '1 week') as mood_n,
      (select avg(j.mood) from public.journal_entries j join members m using (user_id) where j.mood is not null and j.created_at >= w.wk and j.created_at < w.wk + interval '1 week') as mood,
      (select count(distinct d.user_id) from public.day_logs d join members m using (user_id) where d.sleep_hours is not null and d.day >= w.wk::date and d.day < (w.wk + interval '1 week')::date) as sleep_n,
      (select avg(d.sleep_hours) from public.day_logs d join members m using (user_id) where d.sleep_hours is not null and d.day >= w.wk::date and d.day < (w.wk + interval '1 week')::date) as sleep,
      (select count(*) from public.checkins c join members m using (user_id) where c.created_at >= w.wk and c.created_at < w.wk + interval '1 week') as checkins
    from weeks w
  ),
  langs as (
    select m.language,
      count(*) as members,
      count(*) filter (where m.created_at <= now() - interval '30 days') as cohort30,
      count(*) filter (where m.created_at <= now() - interval '30 days'
        and exists (select 1 from act a where a.user_id = m.user_id and a.at >= m.created_at + interval '30 days')) as kept30
    from members m group by m.language
  )
  select jsonb_build_object(
    'generated_at', now(),
    'min_group', k,
    'members', (select count(*) from members),
    'new_30d', (select count(*) from members where created_at > now() - interval '30 days'),
    'active_7d', (select count(distinct user_id) from act where at > now() - interval '7 days'),
    'active_30d', (select count(distinct user_id) from act where at > now() - interval '30 days'),
    'retention', (select jsonb_agg(jsonb_build_object('days', n, 'cohort', case when cohort >= k then cohort end,
                    'pct', case when cohort >= k then round(100.0 * kept / cohort) end) order by n) from retention),
    'slips', jsonb_build_object(
      'count', case when (select count(*) from slips) >= k then (select count(*) from slips) end,
      'back_within_7d_pct', case when (select count(*) from slips) >= k
        then round(100.0 * (select count(*) from slips where back_at is not null and back_at <= occurred_at + interval '7 days') / (select count(*) from slips)) end,
      'median_days_back', case when (select count(*) from slips where back_at is not null) >= k
        then (select round((percentile_cont(0.5) within group (order by extract(epoch from back_at - occurred_at) / 86400))::numeric, 1) from slips where back_at is not null) end
    ),
    'weekly', (select jsonb_agg(jsonb_build_object(
                  'week', to_char(wk, 'YYYY-MM-DD'),
                  'active', case when active >= k then active end,
                  'mood', case when mood_n >= k then round(mood::numeric, 2) end,
                  'sleep', case when sleep_n >= k then round(sleep::numeric, 1) end,
                  'checkins', case when active >= k then checkins end) order by wk) from weekly),
    'by_language', (select jsonb_agg(jsonb_build_object('language', language,
                  'members', case when members >= k then members end,
                  'retention30', case when cohort30 >= k then round(100.0 * kept30 / cohort30) end) order by language) from langs),
    'safety_30d', (select coalesce(jsonb_object_agg(kind, n), '{}'::jsonb) from (
                  select s.kind, count(*) as n from public.safety_events s
                  where s.created_at > now() - interval '30 days' group by s.kind) x),
    'care', jsonb_build_object(
      'professional_links', (select count(*) from public.care_links where status = 'active' and role = 'professional'),
      'supporter_links', (select count(*) from public.care_links where status = 'active' and role = 'supporter'),
      'pending_professionals', (select count(*) from public.care_profiles where role = 'professional' and review_status = 'pending'),
      'verified_professionals', (select count(*) from public.care_profiles where role = 'professional' and review_status = 'verified'))
  ) into res;
  return res;
end $$;

revoke all on function public.admin_list_professionals() from public, anon;
revoke all on function public.admin_review_professional(uuid, text, text) from public, anon;
revoke all on function public.admin_list_admins() from public, anon;
revoke all on function public.admin_add(text, text, text) from public, anon;
revoke all on function public.admin_remove(uuid) from public, anon;
revoke all on function public.admin_impact() from public, anon;
grant execute on function public.admin_list_professionals() to authenticated;
grant execute on function public.admin_review_professional(uuid, text, text) to authenticated;
grant execute on function public.admin_list_admins() to authenticated;
grant execute on function public.admin_add(text, text, text) to authenticated;
grant execute on function public.admin_remove(uuid) to authenticated;
grant execute on function public.admin_impact() to authenticated;
