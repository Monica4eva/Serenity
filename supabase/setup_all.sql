-- =====================================================================
-- Project Serenity: COMPLETE database setup (all 5 migrations, in order).
-- Paste this whole file into Supabase > SQL Editor > New query, then click Run. Run it ONCE.
-- =====================================================================

-- >>>>> 20261114000000_init.sql
-- =====================================================================
-- Project Serenity: initial database schema (Section 12 of the build prompt)
--
-- Principles
--   * Row Level Security on every table. A person can only ever read or
--     change their own rows (user_id = auth.uid()).
--   * Consents and safety events are append-only: users can add rows but
--     never edit or delete them, so the consent trail is trustworthy.
--   * Safety events cannot be read back by the app at all. Only the
--     restricted safety-review process (service role) can read them.
--   * Journal text is encrypted ON THE PHONE before upload. The server only
--     stores ciphertext, so nobody with database access can read it.
--   * Deleting the auth user deletes every row (ON DELETE CASCADE).
--   * Emergency numbers and facilities are public read-only reference data,
--     managed by admins through the dashboard / service role.
-- =====================================================================


-- ---------- helper: keep updated_at fresh ----------
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------- profiles (one row per person) ----------
create table public.profiles (
  user_id                uuid primary key references auth.users (id) on delete cascade,
  preferred_name         text not null default '',
  language               text not null default 'en' check (language in ('en', 'tn')),
  approach               text check (approach in ('12step', 'pillars', 'both', 'wellbeing', 'community', 'lifeskills')),
  recovery_start         timestamptz not null default now(),
  six_month_vision       text,
  intro_answers          jsonb not null default '{}'::jsonb,
  support_needs          text[] not null default '{}',
  accessibility_settings jsonb not null default '{}'::jsonb,
  focus_done             jsonb not null default '{}'::jsonb,
  terms_version_accepted text,
  onboarded              boolean not null default false,
  recovery_details       jsonb not null default '{}'::jsonb,  -- substance, stage, aftercare, baseline pages
  safety_plan            jsonb not null default '{}'::jsonb,
  support_agreement      jsonb,
  steps_done             smallint[] not null default '{}',
  date_of_birth          date,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- ---------- baseline ("the stable version of me") ----------
create table public.baselines (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  feeling     smallint check (feeling between 0 and 4),
  halt        text[] not null default '{}',
  craving     smallint check (craving between 0 and 2),
  sleep_hours numeric(4, 1),
  note        text,
  extended    jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

-- ---------- consents (append-only, versioned, timestamped) ----------
create table public.consents (
  user_id    uuid not null references auth.users (id) on delete cascade,
  id         text not null,
  type       text not null check (type in ('terms', 'data', 'health', 'analytics', 'research', 'emergency')),
  version    text not null,
  granted    boolean not null,
  contact_id text,
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);

-- ---------- support network ----------
create table public.support_contacts (
  user_id          uuid not null references auth.users (id) on delete cascade,
  id               text not null,
  name             text not null,
  role             text not null check (role in ('family', 'sponsor', 'counsellor', 'healthcare', 'other')),
  phone            text not null,
  email            text,
  is_emergency     boolean not null default false,
  consent_level    text not null default 'support' check (consent_level in ('none', 'support', 'alerts')),
  last_reconfirmed timestamptz,
  updated_at       timestamptz not null default now(),
  primary key (user_id, id)
);

-- ---------- goals (max 3 enforced in the app) ----------
create table public.goals (
  user_id  uuid not null references auth.users (id) on delete cascade,
  goal_id  text not null check (goal_id in ('substanceFree', 'relationships', 'wellbeing', 'lifeSkills', 'community', 'opportunities')),
  progress smallint not null default 0 check (progress between 0 and 100),
  primary key (user_id, goal_id)
);

-- ---------- eight dimensions ----------
create table public.dimension_ratings (
  user_id   uuid not null references auth.users (id) on delete cascade,
  id        text not null,
  dimension text not null check (dimension in ('physical', 'emotional', 'mental', 'social', 'spiritual', 'occupational', 'financial', 'environmental')),
  score     smallint not null check (score between 1 and 5),
  note      text,
  rated_at  timestamptz not null,
  primary key (user_id, id)
);

-- ---------- triggers map (people, places, things, internal) ----------
create table public.triggers (
  user_id  uuid not null references auth.users (id) on delete cascade,
  id       text not null,
  category text not null check (category in ('person', 'place', 'thing', 'internal')),
  label    text not null,
  primary key (user_id, id)
);

-- ---------- check-ins (HALT, balance, daily, baseline, rhythm) ----------
create table public.checkins (
  user_id    uuid not null references auth.users (id) on delete cascade,
  id         text not null,
  type       text not null check (type in ('halt', 'balance', 'daily', 'baseline', 'rhythm', 'meeting')),
  answers    jsonb not null default '{}'::jsonb,
  level      text check (level in ('green', 'amber', 'red')),
  reasons    text[] not null default '{}',
  score      smallint,
  created_at timestamptz not null,
  primary key (user_id, id)
);
create index checkins_user_time on public.checkins (user_id, created_at desc);

-- ---------- journal (END-TO-END ENCRYPTED: ciphertext only) ----------
create table public.journal_entries (
  user_id    uuid not null references auth.users (id) on delete cascade,
  id         text not null,
  ciphertext text not null,  -- base64 XSalsa20-Poly1305 box of {text, prompt}
  nonce      text not null,  -- base64 nonce
  mood       smallint check (mood between 0 and 4),  -- kept plain for trend charts
  created_at timestamptz not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

-- ---------- daily body log ----------
create table public.day_logs (
  user_id       uuid not null references auth.users (id) on delete cascade,
  day           date not null,
  sleep_hours   numeric(4, 1),
  meals         smallint,
  water         smallint,
  activity_mins smallint,
  steps         integer check (steps between 0 and 200000),
  bedtime       text check (bedtime ~ '^[0-2][0-9]:[0-5][0-9]$'),
  wake          text check (wake ~ '^[0-2][0-9]:[0-5][0-9]$'),
  primary key (user_id, day)
);

-- ---------- appointments ----------
create table public.appointments (
  user_id  uuid not null references auth.users (id) on delete cascade,
  id       text not null,
  title    text not null,
  starts   text not null,
  status   text check (status in ('attended', 'missed')),
  marked_at timestamptz,
  primary key (user_id, id)
);

-- ---------- activities completed ----------
create table public.activities_completed (
  user_id      uuid not null references auth.users (id) on delete cascade,
  id           text not null,
  activity     text not null,
  completed_at timestamptz not null,
  primary key (user_id, id)
);

-- ---------- relapses (history is kept, never punished) ----------
create table public.relapses (
  user_id     uuid not null references auth.users (id) on delete cascade,
  id          text not null,
  occurred_at timestamptz not null,
  prior_days  integer not null default 0,
  primary key (user_id, id)
);

-- ---------- "This doesn't apply to me" feedback ----------
create table public.dismissals (
  user_id    uuid not null references auth.users (id) on delete cascade,
  id         text not null,
  context    text not null,
  created_at timestamptz not null,
  primary key (user_id, id)
);

-- ---------- safety events (RESTRICTED, minimum data, write-only for users) ----------
create table public.safety_events (
  user_id     uuid not null references auth.users (id) on delete cascade,
  id          text not null,
  kind        text not null,
  created_at  timestamptz not null,
  reviewed_at timestamptz,
  reviewed_by text,
  primary key (user_id, id)
);

-- ---------- reference data: emergency numbers (admin-managed, not hard-coded) ----------
create table public.emergency_numbers (
  id         text primary key,
  country    text not null default 'BW',
  label      text not null,
  label_tn   text,
  number     text not null,
  verified   boolean not null default false,
  sort_order smallint not null default 0,
  active     boolean not null default true,
  updated_at timestamptz not null default now()
);

-- ---------- reference data: facilities and meetings ----------
create table public.facilities (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  type       text not null check (type in ('treatment', 'support_group', 'meeting', 'clinic', 'hospital', 'other')),
  district   text,
  address    text,
  phone      text,
  languages  text[] not null default '{en}',
  verified   boolean not null default false,
  active     boolean not null default true,
  updated_at timestamptz not null default now()
);

-- ---------- audit log (written by triggers, readable only by service role) ----------
create table public.audit_log (
  id         bigint generated always as identity primary key,
  user_id    uuid,
  table_name text not null,
  action     text not null,
  row_id     text,
  at         timestamptz not null default now()
);

create or replace function public.audit_row() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  rec jsonb := to_jsonb(coalesce(new, old));
begin
  insert into public.audit_log (user_id, table_name, action, row_id)
  values ((rec ->> 'user_id')::uuid, tg_table_name, tg_op, coalesce(rec ->> 'id', rec ->> 'user_id'));
  return coalesce(new, old);
end $$;

-- updated_at triggers
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger baselines_touch before update on public.baselines for each row execute function public.touch_updated_at();
create trigger contacts_touch before update on public.support_contacts for each row execute function public.touch_updated_at();
create trigger journal_touch before update on public.journal_entries for each row execute function public.touch_updated_at();

-- audit triggers on the most sensitive tables
create trigger audit_contacts after insert or update or delete on public.support_contacts for each row execute function public.audit_row();
create trigger audit_consents after insert on public.consents for each row execute function public.audit_row();
create trigger audit_safety after insert or update on public.safety_events for each row execute function public.audit_row();
create trigger audit_journal after delete on public.journal_entries for each row execute function public.audit_row();

-- create an empty profile automatically when someone signs up
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, preferred_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'preferred_name', ''))
  on conflict (user_id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
alter table public.profiles             enable row level security;
alter table public.baselines            enable row level security;
alter table public.consents             enable row level security;
alter table public.support_contacts     enable row level security;
alter table public.goals                enable row level security;
alter table public.dimension_ratings    enable row level security;
alter table public.triggers             enable row level security;
alter table public.checkins             enable row level security;
alter table public.journal_entries      enable row level security;
alter table public.day_logs             enable row level security;
alter table public.appointments         enable row level security;
alter table public.activities_completed enable row level security;
alter table public.relapses             enable row level security;
alter table public.dismissals           enable row level security;
alter table public.safety_events        enable row level security;
alter table public.emergency_numbers    enable row level security;
alter table public.facilities           enable row level security;
alter table public.audit_log            enable row level security;

-- Full own-row access for ordinary personal tables
do $$
declare t text;
begin
  foreach t in array array[
    'profiles', 'baselines', 'support_contacts', 'goals', 'dimension_ratings', 'triggers',
    'checkins', 'journal_entries', 'day_logs', 'appointments', 'activities_completed',
    'relapses', 'dismissals'
  ] loop
    execute format('create policy "own rows: select" on public.%I for select to authenticated using (user_id = (select auth.uid()))', t);
    execute format('create policy "own rows: insert" on public.%I for insert to authenticated with check (user_id = (select auth.uid()))', t);
    execute format('create policy "own rows: update" on public.%I for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
    execute format('create policy "own rows: delete" on public.%I for delete to authenticated using (user_id = (select auth.uid()))', t);
  end loop;
end $$;

-- Consents: read and add your own, never change or delete (audit trail)
create policy "consents: select own" on public.consents for select to authenticated using (user_id = (select auth.uid()));
create policy "consents: insert own" on public.consents for insert to authenticated with check (user_id = (select auth.uid()));

-- Safety events: users can only ADD. Nobody but the service role can read them.
create policy "safety: insert own" on public.safety_events for insert to authenticated with check (user_id = (select auth.uid()));

-- Reference data: everyone (even before login) can read active rows; only admins write.
create policy "emergency numbers: public read" on public.emergency_numbers for select to anon, authenticated using (active);
create policy "facilities: public read" on public.facilities for select to anon, authenticated using (active);

-- audit_log: no policies, so only the service role can read it.

-- =====================================================================
-- SEED: emergency numbers (UNVERIFIED until a local clinical partner confirms)
-- =====================================================================
insert into public.emergency_numbers (id, label, label_tn, number, verified, sort_order) values
  ('ambulance', 'Ambulance (Emergency Medical Services)', 'Ambulense (Ditirelo tsa Tshoganyetso)', '997', false, 1),
  ('police', 'Police emergency', 'Mapodise (tshoganyetso)', '999', false, 2),
  ('fire', 'Fire', 'Molelo', '998', false, 3),
  ('youth', 'BOFWA 24-hour youth helpline', 'BOFWA: mogala wa thuso wa basha (diura di le 24)', '16658', false, 4),
  ('gbv', 'Gender-based violence helpline', 'Mogala wa thuso wa tirisodikgoka mo bongweng', '14655', false, 5)
on conflict (id) do nothing;

-- >>>>> 20261115000000_security.sql
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

-- >>>>> 20261116000000_care_team.sql
-- =====================================================================
-- Project Serenity: care team (counsellors, therapists, family and friends)
-- =====================================================================
-- The person in recovery ("member") invites people with a one-time code and chooses what
-- each one can see. Nothing is shared until the invite is accepted, and the member can
-- change permissions or stop sharing at any time.
--
-- Viewers never read the member's own tables. The member's phone publishes a filtered
-- summary for each link (shared_summaries), containing only what that link may see.
--
-- Tables:
--   care_links        one row per invite / connection, with permissions
--   shared_summaries  the filtered summary a viewer may read
--   shared_items      journal entries the member chose to share with one link
--   care_messages     messages between the member and a linked person
--   care_plans        a professional's care plan for the member (both can read)
--   pro_notes         a professional's PRIVATE session notes (only the author can read)
--   push_tokens       phone notification tokens (own rows only)
--   care_profiles     a viewer's role, name and (for professionals) profession

create table public.care_profiles (
  user_id       uuid primary key references auth.users (id) on delete cascade,
  role          text not null check (role in ('member', 'professional', 'supporter')),
  display_name  text not null default '' check (length(display_name) <= 80),
  profession    text check (length(profession) <= 80),
  registration  text check (length(registration) <= 40),  -- e.g. BHPC number; checked by an administrator
  organisation  text check (length(organisation) <= 120),
  verified      boolean not null default false,           -- set only by an administrator
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table public.care_links (
  id           uuid primary key default gen_random_uuid(),
  member_id    uuid not null references auth.users (id) on delete cascade,
  viewer_id    uuid references auth.users (id) on delete cascade,
  role         text not null check (role in ('professional', 'supporter')),
  label        text not null default '' check (length(label) <= 80),   -- what the member calls them
  member_name  text not null default '' check (length(member_name) <= 80), -- what the viewer sees
  viewer_name  text not null default '' check (length(viewer_name) <= 80),
  permissions  jsonb not null default '{}'::jsonb check (pg_column_size(permissions) <= 2048),
  status       text not null default 'pending' check (status in ('pending', 'active', 'revoked')),
  code_hash    text,
  expires_at   timestamptz not null default now() + interval '7 days',
  created_at   timestamptz not null default now(),
  accepted_at  timestamptz,
  revoked_at   timestamptz
);
create index care_links_member on public.care_links (member_id);
create index care_links_viewer on public.care_links (viewer_id);
create unique index care_links_code on public.care_links (code_hash) where code_hash is not null;

create table public.shared_summaries (
  link_id     uuid primary key references public.care_links (id) on delete cascade,
  member_id   uuid not null references auth.users (id) on delete cascade,
  payload     jsonb not null check (pg_column_size(payload) <= 65536),
  updated_at  timestamptz not null default now()
);

create table public.shared_items (
  id          uuid primary key default gen_random_uuid(),
  link_id     uuid not null references public.care_links (id) on delete cascade,
  member_id   uuid not null references auth.users (id) on delete cascade,
  kind        text not null check (kind in ('journal')),
  payload     jsonb not null check (pg_column_size(payload) <= 32768),
  created_at  timestamptz not null default now()
);
create index shared_items_link on public.shared_items (link_id);

create table public.care_messages (
  id          uuid primary key default gen_random_uuid(),
  link_id     uuid not null references public.care_links (id) on delete cascade,
  sender_id   uuid not null references auth.users (id) on delete cascade,
  body        text not null check (length(body) between 1 and 1000),
  created_at  timestamptz not null default now(),
  read_at     timestamptz
);
create index care_messages_link on public.care_messages (link_id, created_at);

create table public.care_plans (
  link_id     uuid primary key references public.care_links (id) on delete cascade,
  author_id   uuid not null references auth.users (id) on delete cascade,
  plan        jsonb not null default '{}'::jsonb check (pg_column_size(plan) <= 16384),
  updated_at  timestamptz not null default now()
);

create table public.pro_notes (
  id            uuid primary key default gen_random_uuid(),
  link_id       uuid not null references public.care_links (id) on delete cascade,
  author_id     uuid not null references auth.users (id) on delete cascade,
  session_date  date not null default current_date,
  body          text not null check (length(body) between 1 and 8000),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index pro_notes_link on public.pro_notes (link_id, author_id);

create table public.push_tokens (
  user_id     uuid not null references auth.users (id) on delete cascade,
  token       text not null check (length(token) <= 200),
  platform    text not null default 'unknown' check (length(platform) <= 20),
  updated_at  timestamptz not null default now(),
  primary key (user_id, token)
);

-- ---------- helpers (security definer, empty search path) ----------
-- Is the current user the active viewer of this link (optionally with a permission)?
create or replace function public.is_link_viewer(p_link uuid, p_perm text default null) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.care_links l
    where l.id = p_link and l.viewer_id = (select auth.uid()) and l.status = 'active'
      and (p_perm is null or coalesce((l.permissions ->> p_perm)::boolean, false))
  );
$$;

create or replace function public.is_link_member(p_link uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.care_links l where l.id = p_link and l.member_id = (select auth.uid()) and l.status <> 'revoked');
$$;

create or replace function public.is_link_professional(p_link uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.care_links l
    where l.id = p_link and l.viewer_id = (select auth.uid()) and l.status = 'active' and l.role = 'professional'
  );
$$;

revoke all on function public.is_link_viewer(uuid, text) from public, anon;
revoke all on function public.is_link_member(uuid) from public, anon;
revoke all on function public.is_link_professional(uuid) from public, anon;
grant execute on function public.is_link_viewer(uuid, text) to authenticated;
grant execute on function public.is_link_member(uuid) to authenticated;
grant execute on function public.is_link_professional(uuid) to authenticated;

-- A short code people can read out or type: 10 characters, no look-alike letters (no 0/O, 1/I/L).
create or replace function private.new_invite_code() returns text
language plpgsql volatile security definer set search_path = '' as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  raw text := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  code text := '';
  i int;
begin
  for i in 0..9 loop
    code := code || substr(alphabet, (('x' || substr(raw, i * 2 + 1, 2))::bit(8)::int % 31) + 1, 1);
  end loop;
  return code;
end $$;

create or replace function private.hash_code(p_code text) returns text
language sql immutable security definer set search_path = '' as $$
  select encode(sha256(convert_to(upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g')), 'UTF8')), 'hex');
$$;

create table private.invite_attempts (
  user_id uuid not null,
  at      timestamptz not null default now()
);
create index invite_attempts_user on private.invite_attempts (user_id, at);

-- Member creates an invite. Returns the code ONCE; only its hash is stored.
create or replace function public.create_care_invite(p_role text, p_label text, p_member_name text, p_permissions jsonb)
returns table (link_id uuid, code text, expires_at timestamptz)
language plpgsql volatile security definer set search_path = '' as $$
#variable_conflict use_column
declare
  uid uuid := auth.uid();
  c text;
  l uuid;
  e timestamptz;
begin
  if uid is null then raise exception 'Not signed in'; end if;
  if p_role not in ('professional', 'supporter') then raise exception 'Unknown role'; end if;
  if (select count(*) from public.care_links where member_id = uid and status = 'pending' and expires_at > now()) >= 10 then
    raise exception 'Too many open invites. Cancel one first.';
  end if;
  loop
    c := private.new_invite_code();
    exit when not exists (select 1 from public.care_links where code_hash = private.hash_code(c));
  end loop;
  insert into public.care_links (member_id, role, label, member_name, permissions, code_hash)
  values (uid, p_role, left(coalesce(p_label, ''), 80), left(coalesce(p_member_name, ''), 80), coalesce(p_permissions, '{}'::jsonb), private.hash_code(c))
  returning care_links.id, care_links.expires_at into l, e;
  return query select l, c, e;
end $$;

-- Viewer accepts an invite with the code. At most 10 tries an hour per person.
create or replace function public.accept_care_invite(p_code text, p_viewer_name text)
returns table (link_id uuid, role text, member_name text)
language plpgsql volatile security definer set search_path = '' as $$
#variable_conflict use_column
declare
  uid uuid := auth.uid();
  rec public.care_links%rowtype;
begin
  if uid is null then raise exception 'Not signed in'; end if;
  if (select count(*) from private.invite_attempts a where a.user_id = uid and a.at > now() - interval '1 hour') >= 10 then
    raise exception 'Too many tries. Please wait an hour and try again.';
  end if;
  select * into rec from public.care_links l
  where l.code_hash = private.hash_code(p_code) and l.status = 'pending' and l.expires_at > now()
  limit 1;
  if not found then
    -- No exception here: raising would roll back the attempt record. An empty result means "not valid".
    insert into private.invite_attempts (user_id) values (uid);
    return;
  end if;
  if rec.member_id = uid then raise exception 'You cannot accept your own invite.'; end if;
  update public.care_links l
  set viewer_id = uid, status = 'active', accepted_at = now(), code_hash = null, viewer_name = left(coalesce(p_viewer_name, ''), 80)
  where l.id = rec.id;
  return query select rec.id, rec.role, rec.member_name;
end $$;

-- Member stops sharing: the link is revoked and everything shared through it is removed.
create or replace function public.revoke_care_link(p_link uuid) returns void
language plpgsql volatile security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.care_links where id = p_link and member_id = auth.uid()) then
    raise exception 'Not found';
  end if;
  update public.care_links set status = 'revoked', revoked_at = now(), code_hash = null where id = p_link;
  delete from public.shared_summaries where link_id = p_link;
  delete from public.shared_items where link_id = p_link;
end $$;

-- A viewer can also leave a link (for example a counsellor who no longer works with someone).
create or replace function public.leave_care_link(p_link uuid) returns void
language plpgsql volatile security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.care_links where id = p_link and viewer_id = auth.uid()) then
    raise exception 'Not found';
  end if;
  update public.care_links set status = 'revoked', revoked_at = now() where id = p_link;
  delete from public.shared_summaries where link_id = p_link;
  delete from public.shared_items where link_id = p_link;
end $$;

revoke all on function private.new_invite_code() from public, anon, authenticated;
revoke all on function private.hash_code(text) from public, anon, authenticated;
revoke all on function public.create_care_invite(text, text, text, jsonb) from public, anon;
revoke all on function public.accept_care_invite(text, text) from public, anon;
revoke all on function public.revoke_care_link(uuid) from public, anon;
revoke all on function public.leave_care_link(uuid) from public, anon;
grant execute on function public.create_care_invite(text, text, text, jsonb) to authenticated;
grant execute on function public.accept_care_invite(text, text) to authenticated;
grant execute on function public.revoke_care_link(uuid) to authenticated;
grant execute on function public.leave_care_link(uuid) to authenticated;

-- ---------- row level security ----------
alter table public.care_profiles    enable row level security;
alter table public.care_links       enable row level security;
alter table public.shared_summaries enable row level security;
alter table public.shared_items     enable row level security;
alter table public.care_messages    enable row level security;
alter table public.care_plans       enable row level security;
alter table public.pro_notes        enable row level security;
alter table public.push_tokens      enable row level security;
alter table public.care_profiles    force row level security;
alter table public.care_links       force row level security;
alter table public.shared_summaries force row level security;
alter table public.shared_items     force row level security;
alter table public.care_messages    force row level security;
alter table public.care_plans       force row level security;
alter table public.pro_notes        force row level security;
alter table public.push_tokens      force row level security;

do $$
declare t text;
begin
  foreach t in array array['care_profiles', 'care_links', 'shared_summaries', 'shared_items', 'care_messages', 'care_plans', 'pro_notes', 'push_tokens']
  loop
    execute format('revoke all on public.%I from anon', t);
  end loop;
end $$;

-- care_profiles: own row. "verified" can only be set by an administrator (column privilege).
create policy "care profile: own" on public.care_profiles for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
revoke insert, update on public.care_profiles from authenticated;
grant insert (user_id, role, display_name, profession, registration, organisation) on public.care_profiles to authenticated;
grant update (role, display_name, profession, registration, organisation) on public.care_profiles to authenticated;

-- care_links: both sides can read their links. Invites are created only through
-- create_care_invite; the member may change label and permissions; status changes go through the functions.
create policy "links: read own" on public.care_links for select to authenticated
  using (member_id = (select auth.uid()) or viewer_id = (select auth.uid()));
create policy "links: member edits" on public.care_links for update to authenticated
  using (member_id = (select auth.uid())) with check (member_id = (select auth.uid()));
revoke insert, delete on public.care_links from authenticated;
revoke update on public.care_links from authenticated;
grant update (label, permissions, member_name) on public.care_links to authenticated;

-- shared_summaries: member writes for own active links; viewer reads.
create policy "summaries: member writes" on public.shared_summaries for all to authenticated
  using (member_id = (select auth.uid()) and public.is_link_member(link_id))
  with check (member_id = (select auth.uid()) and public.is_link_member(link_id));
create policy "summaries: viewer reads" on public.shared_summaries for select to authenticated
  using (public.is_link_viewer(link_id));

-- shared_items: member shares and unshares; viewer reads only with the journal permission.
create policy "items: member" on public.shared_items for all to authenticated
  using (member_id = (select auth.uid()) and public.is_link_member(link_id))
  with check (member_id = (select auth.uid()) and public.is_link_member(link_id));
create policy "items: viewer reads" on public.shared_items for select to authenticated
  using (public.is_link_viewer(link_id, 'journal'));

-- care_messages: both sides of an active link; supporters need the messages permission.
create policy "messages: read" on public.care_messages for select to authenticated
  using (public.is_link_member(link_id) or public.is_link_viewer(link_id));
create policy "messages: send" on public.care_messages for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and (
      exists (select 1 from public.care_links l where l.id = link_id and l.member_id = (select auth.uid()) and l.status = 'active')
      or public.is_link_viewer(link_id, 'messages')
    )
  );
create policy "messages: mark read" on public.care_messages for update to authenticated
  using ((public.is_link_member(link_id) or public.is_link_viewer(link_id)) and sender_id <> (select auth.uid()))
  with check (sender_id <> (select auth.uid()));
revoke update on public.care_messages from authenticated;
grant update (read_at) on public.care_messages to authenticated;

-- care_plans: the linked professional writes; the member reads.
create policy "plans: professional writes" on public.care_plans for all to authenticated
  using (author_id = (select auth.uid()) and public.is_link_professional(link_id))
  with check (author_id = (select auth.uid()) and public.is_link_professional(link_id));
create policy "plans: member reads" on public.care_plans for select to authenticated
  using (public.is_link_member(link_id));

-- pro_notes: PRIVATE to the professional who wrote them, only while linked.
create policy "notes: author only" on public.pro_notes for all to authenticated
  using (author_id = (select auth.uid()) and public.is_link_professional(link_id))
  with check (author_id = (select auth.uid()) and public.is_link_professional(link_id));

-- push_tokens: own rows only.
create policy "push: own" on public.push_tokens for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ---------- write limits and audit ----------
do $$
declare t text;
begin
  foreach t in array array['care_profiles', 'shared_summaries', 'shared_items', 'care_messages', 'care_plans', 'pro_notes', 'push_tokens']
  loop
    execute format('create trigger rate_limit before insert or update on public.%I for each row execute function private.rate_limit(%L)', t, '300');
  end loop;
end $$;

create trigger audit_care_links after insert or update or delete on public.care_links for each row execute function public.audit_row();
create trigger audit_shared_items after insert or delete on public.shared_items for each row execute function public.audit_row();
create trigger audit_pro_notes after insert or update or delete on public.pro_notes for each row execute function public.audit_row();

create trigger care_profiles_touch before update on public.care_profiles for each row execute function public.touch_updated_at();
create trigger pro_notes_touch before update on public.pro_notes for each row execute function public.touch_updated_at();

-- >>>>> 20261117000000_admin.sql
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
    'by_language', (select coalesce(jsonb_agg(jsonb_build_object('language', language,
                  'members', case when members >= k then members end,
                  'retention30', case when cohort30 >= k then round(100.0 * kept30 / cohort30) end) order by language), '[]'::jsonb) from langs),
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

-- >>>>> 20261118000000_content.sql
-- =====================================================================
-- Project Serenity: editable content (recipes, activities, quotes, resources, guides,
-- 12-Step reflections, journal ideas) in English and Setswana.
-- =====================================================================
-- The app ships with built-in content. A row here REPLACES a built-in item (same key), ADDS a
-- new one, or HIDES one (status 'hidden'). Drafts are only visible in the admin dashboard.
-- Anyone can read published content (it is public, like a website). Only admins, clinicians and
-- editors can change it, and every change is logged.

create table public.content_items (
  type         text not null check (type in ('recipe', 'activity', 'quote', 'resource', 'guide', 'step', 'prompt')),
  item_key     text not null check (item_key ~ '^[A-Za-z0-9_-]{1,60}$'),
  data         jsonb not null default '{}'::jsonb check (pg_column_size(data) <= 65536),
  status       text not null default 'draft' check (status in ('published', 'draft', 'hidden')),
  tn_reviewed  boolean not null default false,  -- a fluent Setswana speaker has checked the Setswana
  sort_order   integer,
  updated_at   timestamptz not null default now(),
  updated_by   uuid,
  primary key (type, item_key)
);

alter table public.content_items enable row level security;
alter table public.content_items force row level security;

grant select on public.content_items to anon, authenticated;
revoke insert, update, delete, truncate on public.content_items from anon;
grant insert, update, delete on public.content_items to authenticated;

create policy "content: public reads published" on public.content_items for select to anon, authenticated
  using (status in ('published', 'hidden'));
create policy "content: admins read all" on public.content_items for select to authenticated
  using (public.admin_role() is not null);
create policy "content: admins add" on public.content_items for insert to authenticated
  with check (public.admin_role() in ('admin', 'clinician', 'editor'));
create policy "content: admins edit" on public.content_items for update to authenticated
  using (public.admin_role() in ('admin', 'clinician', 'editor'))
  with check (public.admin_role() in ('admin', 'clinician', 'editor'));
create policy "content: admins restore" on public.content_items for delete to authenticated
  using (public.admin_role() in ('admin', 'clinician', 'editor'));

create or replace function private.content_stamp() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end $$;
create trigger content_stamp before insert or update on public.content_items
for each row execute function private.content_stamp();

create or replace function private.log_content_change() returns trigger
language plpgsql security definer set search_path = '' as $$
declare r public.content_items := coalesce(new, old);
begin
  insert into public.admin_actions (admin_id, action, target, detail)
  values (auth.uid(),
          case when tg_op = 'DELETE' then 'content_restored' else 'content_' || r.status end,
          r.type || ':' || r.item_key,
          jsonb_build_object('title', coalesce(r.data #>> '{en,title}', r.data #>> '{en,t}', r.data ->> 'name', r.data ->> 'en', r.data #>> '{en,text}', r.item_key)));
  return coalesce(new, old);
end $$;
create trigger log_content_change after insert or update or delete on public.content_items
for each row execute function private.log_content_change();
