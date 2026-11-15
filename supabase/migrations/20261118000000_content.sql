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
