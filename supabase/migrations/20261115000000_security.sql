-- =====================================================================
-- Project Serenity: security hardening (defence in depth on top of RLS)
-- =====================================================================
-- 1. Visitors who are not signed in can never touch personal tables, even if a policy
--    is ever written wrongly. RLS is also forced for the table owner.
-- 2. Append-only (consents) and write-only (safety events, audit log) rules are enforced
--    at the privilege level as well as by policy.
-- 3. Size limits stop oversized or abusive payloads.
-- 4. A per-person write limit stops a stolen login being used to flood the database.
-- 5. Sign-up via Google fills the preferred name; trigger functions use an empty search_path.

-- ---------- 1. no anonymous access to personal data ----------
do $$
declare t text;
begin
  foreach t in array array['profiles', 'baselines', 'consents', 'support_contacts', 'goals', 'dimension_ratings', 'triggers',
    'checkins', 'journal_entries', 'day_logs', 'appointments', 'activities_completed', 'relapses', 'dismissals',
    'safety_events', 'audit_log']
  loop
    execute format('revoke all on public.%I from anon', t);
    execute format('alter table public.%I force row level security', t);
  end loop;
end $$;

-- Reference data is read-only for everyone except administrators.
revoke insert, update, delete, truncate on public.emergency_numbers, public.facilities from anon, authenticated;

-- ---------- 2. append-only and write-only, at the privilege level ----------
revoke update, delete, truncate on public.consents from authenticated;
revoke select, update, delete, truncate on public.safety_events from authenticated;
revoke all on public.audit_log from authenticated;

-- ---------- 3. size limits ----------
alter table public.profiles
  add constraint profiles_sizes check (
    length(preferred_name) <= 80
    and coalesce(length(six_month_vision), 0) <= 4000
    and pg_column_size(intro_answers) <= 32768
    and pg_column_size(recovery_details) <= 32768
    and pg_column_size(safety_plan) <= 32768
    and coalesce(pg_column_size(support_agreement), 0) <= 8192
  );
alter table public.baselines
  add constraint baselines_sizes check (coalesce(length(note), 0) <= 4000 and pg_column_size(extended) <= 32768);
alter table public.support_contacts
  add constraint contacts_sizes check (length(name) <= 120 and length(phone) <= 32 and coalesce(length(email), 0) <= 254);
alter table public.triggers add constraint triggers_sizes check (length(label) <= 200);
alter table public.dimension_ratings add constraint dimensions_sizes check (coalesce(length(note), 0) <= 2000);
alter table public.checkins add constraint checkins_sizes check (pg_column_size(answers) <= 16384);
alter table public.journal_entries add constraint journal_sizes check (length(ciphertext) <= 200000 and length(nonce) <= 64);
alter table public.appointments add constraint appointments_sizes check (length(title) <= 200 and length(starts) <= 64);
alter table public.activities_completed add constraint activities_sizes check (length(activity) <= 80);
alter table public.dismissals add constraint dismissals_sizes check (length(context) <= 80);
alter table public.safety_events add constraint safety_kind_format check (kind ~ '^[a-z_]{1,40}$');

-- ---------- 4. per-person write limit ----------
create schema if not exists private;
revoke all on schema private from public;

create table private.write_counts (
  user_id    uuid not null,
  table_name text not null,
  bucket     timestamptz not null,
  n          integer not null,
  primary key (user_id, table_name, bucket)
);

create or replace function private.rate_limit() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  lim integer := tg_argv[0]::integer;
  uid uuid := auth.uid();
  cnt integer;
begin
  -- Administrators and the delete-account function (no signed-in user) are not limited.
  if uid is null then
    return new;
  end if;
  insert into private.write_counts as w (user_id, table_name, bucket, n)
  values (uid, tg_table_name, date_trunc('minute', now()), 1)
  on conflict (user_id, table_name, bucket) do update set n = w.n + 1
  returning n into cnt;
  if cnt > lim then
    raise exception 'Too many changes in a short time. Please wait a minute and try again.' using errcode = 'P0001';
  end if;
  -- Light clean-up of old counters.
  if random() < 0.02 then
    delete from private.write_counts where bucket < now() - interval '1 hour';
  end if;
  return new;
end $$;

revoke all on function private.rate_limit() from public, anon, authenticated;

-- Generous limits: a first sync can upload a lot of history in one go.
do $$
declare t text;
begin
  foreach t in array array['profiles', 'baselines', 'consents', 'support_contacts', 'goals', 'dimension_ratings', 'triggers',
    'checkins', 'journal_entries', 'day_logs', 'appointments', 'activities_completed', 'relapses', 'dismissals']
  loop
    execute format('create trigger rate_limit before insert or update on public.%I for each row execute function private.rate_limit(%L)', t, '1000');
  end loop;
end $$;
create trigger rate_limit before insert on public.safety_events for each row execute function private.rate_limit('300');

-- ---------- 5. functions: empty search_path, Google names ----------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  full_name text := coalesce(meta ->> 'full_name', meta ->> 'name', '');
begin
  insert into public.profiles (user_id, preferred_name)
  values (new.id, left(coalesce(nullif(meta ->> 'preferred_name', ''), split_part(full_name, ' ', 1), ''), 80))
  on conflict (user_id) do nothing;
  return new;
end $$;

create or replace function public.audit_row() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  rec jsonb := to_jsonb(coalesce(new, old));
begin
  insert into public.audit_log (user_id, table_name, action, row_id)
  values ((rec ->> 'user_id')::uuid, tg_table_name, tg_op, coalesce(rec ->> 'id', rec ->> 'user_id'));
  return coalesce(new, old);
end $$;

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.audit_row() from public, anon, authenticated;
