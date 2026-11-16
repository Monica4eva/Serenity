-- AI oversight for the Serenity Session Assistant (the AI agent for counsellors).
--  * app_settings: an on/off switch admins and clinicians control. The Edge Function checks it
--    on every request, so switching it off works instantly for everyone.
--  * ai_usage: one row per request with the outcome only. No prompts, answers, names, link ids
--    or user ids are stored, so this table holds nothing personal.
--  * admin_ai_overview() and admin_set_ai(): read the figures and flip the switch (MFA required,
--    every change written to the activity log).
-- Run after 20261118000000_content.sql. Safe to run more than once.

create table if not exists public.app_settings (
  key         text primary key check (length(key) <= 60),
  value       jsonb not null default '{}'::jsonb check (pg_column_size(value) <= 4096),
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users (id) on delete set null
);
alter table public.app_settings enable row level security;
alter table public.app_settings force row level security;
revoke all on public.app_settings from anon, authenticated;
insert into public.app_settings (key, value) values ('ai_assistant', '{"enabled": true}') on conflict (key) do nothing;

create table if not exists public.ai_usage (
  id       bigint generated always as identity primary key,
  at       timestamptz not null default now(),
  feature  text not null default 'session_assistant' check (feature in ('session_assistant')),
  demo     boolean not null default false,
  outcome  text not null check (outcome in ('ok', 'model_unavailable', 'rate', 'forbidden', 'not_enough_data', 'disabled', 'signed_out', 'bad_request')),
  model    text check (length(model) <= 80),
  lang     text check (lang in ('en', 'tn')),
  ms       integer check (ms between 0 and 600000)
);
create index if not exists ai_usage_at on public.ai_usage (at desc);
alter table public.ai_usage enable row level security;
alter table public.ai_usage force row level security;
revoke all on public.ai_usage from anon, authenticated;
-- Only the Edge Function (service role) writes here. Admins read through admin_ai_overview().

create or replace function public.admin_ai_overview() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare res jsonb;
begin
  perform private.require_admin(array['admin', 'clinician', 'editor']);
  select jsonb_build_object(
    'enabled', coalesce((select (s.value->>'enabled')::boolean from public.app_settings s where s.key = 'ai_assistant'), true),
    'changed_at', (select s.updated_at from public.app_settings s where s.key = 'ai_assistant'),
    'ok_7d', (select count(*) from public.ai_usage u where u.outcome = 'ok' and u.at > now() - interval '7 days'),
    'ok_30d', (select count(*) from public.ai_usage u where u.outcome = 'ok' and u.at > now() - interval '30 days'),
    'real_30d', (select count(*) from public.ai_usage u where u.outcome = 'ok' and not u.demo and u.at > now() - interval '30 days'),
    'demo_30d', (select count(*) from public.ai_usage u where u.outcome = 'ok' and u.demo and u.at > now() - interval '30 days'),
    'avg_ms_30d', (select round(avg(u.ms)) from public.ai_usage u where u.outcome = 'ok' and u.at > now() - interval '30 days'),
    'outcomes_30d', coalesce((select jsonb_object_agg(o.outcome, o.n) from (select u.outcome, count(*) as n from public.ai_usage u where u.at > now() - interval '30 days' group by u.outcome) o), '{}'::jsonb),
    'models_30d', coalesce((select jsonb_agg(m.model order by m.n desc) from (select u.model, count(*) as n from public.ai_usage u where u.model is not null and u.at > now() - interval '30 days' group by u.model) m), '[]'::jsonb),
    'daily_14d', coalesce((
      select jsonb_agg(jsonb_build_object('day', d.day, 'ok', d.ok, 'failed', d.failed) order by d.day)
      from (
        select g.day::date as day,
          (select count(*) from public.ai_usage u where u.at::date = g.day::date and u.outcome = 'ok') as ok,
          (select count(*) from public.ai_usage u where u.at::date = g.day::date and u.outcome in ('model_unavailable')) as failed
        from generate_series(current_date - 13, current_date, interval '1 day') as g(day)
      ) d), '[]'::jsonb)
  ) into res;
  return res;
end $$;

create or replace function public.admin_set_ai(p_enabled boolean) returns void
language plpgsql volatile security definer set search_path = '' as $$
declare me uuid;
begin
  me := private.require_admin(array['admin', 'clinician']);
  insert into public.app_settings (key, value, updated_at, updated_by)
  values ('ai_assistant', jsonb_build_object('enabled', p_enabled), now(), me)
  on conflict (key) do update set value = excluded.value, updated_at = now(), updated_by = me;
  perform private.log_admin(case when p_enabled then 'ai_assistant_on' else 'ai_assistant_off' end, 'ai_assistant', jsonb_build_object('enabled', p_enabled));
end $$;

revoke all on function public.admin_ai_overview() from public, anon;
revoke all on function public.admin_set_ai(boolean) from public, anon;
grant execute on function public.admin_ai_overview() to authenticated;
grant execute on function public.admin_set_ai(boolean) to authenticated;
