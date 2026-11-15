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
