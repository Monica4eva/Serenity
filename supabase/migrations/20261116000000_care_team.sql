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
