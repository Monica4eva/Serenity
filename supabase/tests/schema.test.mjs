// Tests the Supabase schema and Row Level Security in an in-memory Postgres (PGlite).
// Supabase's auth schema and roles are stubbed. Run: npm run test:db
import { PGlite } from '@electric-sql/pglite';
import fs from 'fs';
const db = new PGlite();
const A = '11111111-1111-1111-1111-111111111111', B = '22222222-2222-2222-2222-222222222222';
await db.exec(`
create schema auth;
create table auth.users (id uuid primary key, raw_user_meta_data jsonb default '{}', email text);
create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.sub', true), '')::uuid $$;
create role anon; create role authenticated;
-- Like Supabase: new tables are granted to anon and authenticated by default; migrations then revoke.
grant usage on schema public to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated;
`);
const dir = new URL('../migrations/', import.meta.url);
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.sql')).sort()) await db.exec(fs.readFileSync(new URL(f, dir), 'utf8'));
await db.exec(`grant usage on schema auth to anon, authenticated; grant execute on function auth.uid() to anon, authenticated; grant execute on function auth.jwt() to anon, authenticated;`);
await db.exec(`insert into auth.users (id, raw_user_meta_data) values ('${A}', '{"preferred_name":"Mompati"}'), ('${B}', '{}'), ('33333333-3333-3333-3333-333333333333', '{"full_name":"Neo Molefe","name":"Neo Molefe"}');`);
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; } else { fail++; console.log('FAIL', m); } };
const as = async (uid, sql, aal = 'aal1') => {
  await db.exec(`reset role; set request.jwt.sub = '${uid ?? ''}'; set request.jwt.claims = '{"aal":"${aal}"}'; set role ${uid ? 'authenticated' : 'anon'};`);
  try { return { rows: (await db.query(sql)).rows }; } catch (e) { return { error: e.message }; }
  finally { await db.exec('reset role'); }
};
// profile auto-created
let r = await as(A, `select preferred_name from public.profiles`);
ok(r.rows?.length === 1 && r.rows[0].preferred_name === 'Mompati', 'profile auto-created from sign-up metadata');
// own writes
r = await as(A, `insert into public.checkins (user_id,id,type,answers,level,created_at) values ('${A}','c1','balance','{}','amber',now()) returning id`);
ok(!r.error, 'A can insert own checkin ' + r.error);
r = await as(A, `insert into public.checkins (user_id,id,type,created_at) values ('${B}','x','halt',now())`);
ok(!!r.error, 'A cannot insert a row for B');
r = await as(B, `select * from public.checkins`);
ok(r.rows?.length === 0, 'B cannot see A checkins');
r = await as(B, `update public.checkins set level='green' where id='c1' returning id`);
ok(r.rows?.length === 0, 'B cannot update A checkins');
r = await as(null, `select * from public.checkins`);
ok(!!r.error || r.rows?.length === 0, 'anonymous sees nothing');
// journal ciphertext only
r = await as(A, `insert into public.journal_entries (user_id,id,ciphertext,nonce,mood,created_at) values ('${A}','j1','abc','n',2,now()) returning id`);
ok(!r.error, 'A can store encrypted journal ' + r.error);
r = await as(B, `select * from public.journal_entries`);
ok(r.rows?.length === 0, 'B cannot see A journal');
// consents append-only
r = await as(A, `insert into public.consents (user_id,id,type,version,granted) values ('${A}','k1','terms','0.1',true) returning id`);
ok(!r.error, 'A can add consent ' + r.error);
r = await as(A, `update public.consents set granted=false where id='k1' returning id`);
ok(r.rows?.length === 0 || r.error, 'consent cannot be edited');
r = await as(A, `delete from public.consents where id='k1' returning id`);
ok(r.rows?.length === 0 || r.error, 'consent cannot be deleted');
// safety events write-only
r = await as(A, `insert into public.safety_events (user_id,id,kind,created_at) values ('${A}','s1','emergency_opened',now())`);
ok(!r.error, 'A can log safety event ' + r.error);
r = await as(A, `select * from public.safety_events`);
ok(!!r.error || r.rows?.length === 0, 'A cannot read safety events back');
// reference data
r = await as(null, `select number from public.emergency_numbers order by sort_order`);
ok(r.rows?.length === 5 && r.rows[0].number === '997', 'emergency numbers readable before login');
r = await as(A, `update public.emergency_numbers set number='000' returning id`);
ok(r.rows?.length === 0 || r.error, 'users cannot change emergency numbers');
r = await as(A, `select * from public.audit_log`);
ok(!!r.error || r.rows?.length === 0, 'users cannot read audit log');
// audit written
const audit = (await db.query(`select table_name, action from public.audit_log`)).rows;
ok(audit.some(a => a.table_name === 'safety_events') && audit.some(a => a.table_name === 'consents'), 'audit log records sensitive writes');
// cascade delete
await db.exec(`delete from auth.users where id='${A}'`);
const left = (await db.query(`select (select count(*) from public.checkins) c, (select count(*) from public.journal_entries) j, (select count(*) from public.profiles where user_id='${A}') p`)).rows[0];
ok(Number(left.c) === 0 && Number(left.j) === 0 && Number(left.p) === 0, 'deleting the account removes all data');
// constraints
r = await as(B, `insert into public.dimension_ratings (user_id,id,dimension,score,rated_at) values ('${B}','d','physical',9,now())`);
ok(!!r.error, 'score must be 1 to 5');
// ---------- the app's sync rows match the real columns, and survive a round trip ----------
const { stateToRecords, rowsToState, mergeIntoState } = await import('../../src/lib/syncMap.ts');
const { newKey, seal, open } = await import('../../src/lib/cryptoCore.ts');
const st = {
  language: 'tn', languageChosen: true, onboarded: true, loggedIn: true,
  consents: [{ type: 'emergency', version: '0.1', granted: true, at: '2026-11-13T10:00:00.000Z', contactId: 'c1' }],
  profile: { preferredName: 'Neo', answers: { why: 'family' }, supportNeeds: ['reminders'], sixMonthVision: 'stable' },
  baseline: { halt: ['anger'], extended: { coping: 'walks' }, sleepHours: 6.5, feeling: 1, craving: 2, note: 'n' },
  contacts: [{ id: 'c1', name: 'Dr Kgosi', role: 'counsellor', phone: '+267 71', isEmergency: true, consentLevel: 'alerts', lastReconfirmed: '2026-11-13T10:00:00.000Z' }],
  approach: 'both', goals: [{ id: 'wellbeing', progress: 40 }],
  dimensions: [{ dimension: 'financial', score: 2, note: 'debt', at: '2026-11-13T10:00:00.000Z' }],
  recoveryStart: '2026-11-01T08:00:00.000Z', relapses: [{ at: '2026-11-01T07:00:00.000Z', priorDays: 12 }],
  checkins: [{ id: 'k9', type: 'halt', answers: { hunger: 1 }, at: '2026-11-13T12:00:00.000Z' }],
  journal: [{ id: 'j9', at: '2026-11-13T13:00:00.000Z', mood: 3, text: 'better today', prompt: 'p1' }],
  focus: { '2026-11-13': ['reading'] }, dayLogs: { '2026-11-13': { sleepHours: 7.5, meals: 3 } },
  appointments: [{ id: 'a9', title: 'Clinic', when: '2026-11-20 10:00', status: 'attended' }],
  triggers: [{ id: 't9', category: 'internal', label: 'boredom' }], activitiesDone: [{ id: 'walk', at: '2026-11-13T14:00:00.000Z' }],
  safetyEvents: [{ at: '2026-11-13T15:00:00.000Z', kind: 'logo_red_opened' }], dismissals: [{ at: '2026-11-13T16:00:00.000Z', context: 'logo' }],
  settings: { fontScale: 1.5, dyslexia: true, highContrast: false, dark: false, voiceFirst: true, simplePrompts: false, discreet: true, appLock: false, blockScreenshots: false },
  emergencyNumbers: [], pendingSync: 0, journalLocked: 0,
};
const jk = newKey();
const recs = stateToRecords(st, B);
for (const r of recs) {
  const row = r.secret ? { ...r.row, ...seal(jk, r.secret) } : r.row;
  const cols = (await db.query(`select column_name from information_schema.columns where table_schema='public' and table_name=$1`, [r.table])).rows.map((c) => c.column_name);
  const unknown = Object.keys(row).filter((k) => !cols.includes(k));
  ok(unknown.length === 0, `${r.table} has no column(s): ${unknown.join(', ')}`);
  await db.exec(`reset role; set request.jwt.sub = '${B}'; set role authenticated;`);
  try {
    const keys = Object.keys(row);
    const vals = keys.map((k) => (row[k] !== null && typeof row[k] === 'object' && !Array.isArray(row[k]) ? JSON.stringify(row[k]) : row[k]));
    await db.query(`insert into public.${r.table} (${keys.join(',')}) values (${keys.map((_, i) => '$' + (i + 1)).join(',')}) on conflict (${r.pk.join(',')}) do update set ${keys.map((k) => `${k}=excluded.${k}`).join(',') || 'user_id=excluded.user_id'}`.replace(/do update set .*$/, r.table === 'consents' ? 'do nothing' : (m) => m).replace(/ on conflict .*$/, r.table === 'safety_events' ? '' : (m) => m), vals);
    ok(true, '');
  } catch (e) {
    ok(false, `upload ${r.table}: ${e.message}`);
  } finally { await db.exec('reset role'); }
}
const pulled = {};
for (const t of ['profiles', 'baselines', 'consents', 'support_contacts', 'goals', 'dimension_ratings', 'triggers', 'checkins', 'journal_entries', 'day_logs', 'appointments', 'activities_completed', 'relapses', 'dismissals']) {
  const res = await as(B, `select * from public.${t}`);
  // PostgREST returns ISO strings for timestamps and YYYY-MM-DD for dates; mimic that.
  pulled[t] = res.rows.map((row) => Object.fromEntries(Object.entries(row).map(([k, v]) => [k, v instanceof Date ? (k === 'day' ? v.toISOString().slice(0, 10) : v.toISOString()) : v])));
}
const { patch, locked } = rowsToState(pulled, (c, n) => open(jk, c, n));
const blank = { ...st, onboarded: false, profile: { preferredName: '', answers: {}, supportNeeds: [] }, consents: [], contacts: [], goals: [], dimensions: [], checkins: [], journal: [], focus: {}, dayLogs: {}, appointments: [], triggers: [], activitiesDone: [], relapses: [], dismissals: [], safetyEvents: [], settings: { ...st.settings, dyslexia: false } };
const m = mergeIntoState(blank, patch, locked);
ok(m.profile.preferredName === 'Neo' && m.language === 'tn' && m.approach === 'both', 'profile restored from Postgres');
ok(m.journal[0]?.text === 'better today' && m.journal[0]?.prompt === 'p1', 'journal decrypted after round trip');
ok(m.baseline.sleepHours === 6.5 && m.dayLogs['2026-11-13']?.sleepHours === 7.5, 'numbers restored as numbers');
ok(m.contacts[0]?.isEmergency === true && m.relapses[0]?.priorDays === 12, 'contacts and relapse history restored');
ok(m.settings.dyslexia === true && m.settings.fontScale === 1.5, 'accessibility settings restored');
const raw = (await db.query(`select ciphertext from public.journal_entries where user_id='${B}'`)).rows[0].ciphertext;
ok(!raw.includes('better'), 'database holds only ciphertext');


// ---------- security hardening ----------
const C = '33333333-3333-3333-3333-333333333333';
r = await as(C, `select preferred_name from public.profiles`);
ok(r.rows?.[0]?.preferred_name === 'Neo', 'Google sign-up fills preferred name from full name');
r = await as(null, `insert into public.checkins (user_id,id,type,created_at) values ('${A}','anon1','halt',now())`);
ok(!!r.error, 'anonymous cannot write personal tables');
r = await as(null, `select count(*) from public.profiles`);
ok(!!r.error || r.rows?.[0]?.count == 0, 'anonymous cannot read profiles');
r = await as(A, `update public.consents set granted=false`);
ok(!!r.error, 'consent update refused at privilege level');
r = await as(A, `select * from public.audit_log`);
ok(!!r.error || r.rows?.length === 0, 'audit log is not readable by users');
r = await as(B, `insert into public.checkins (user_id,id,type,answers,created_at) values ('${B}','big','daily', jsonb_build_object('x', repeat('a', 40000)), now())`);
ok(!!r.error, 'oversized check-in refused');
r = await as(B, `insert into public.safety_events (user_id,id,kind,created_at) values ('${B}','bad1','<script>',now())`);
ok(!!r.error, 'safety event kind must be a plain code');
r = await as(B, `insert into public.safety_events (user_id,id,kind,created_at) values ('${B}','s9','companion_risk',now())`);
ok(!r.error, 'chat safety event accepted ' + r.error);
r = await as(B, `update public.profiles set preferred_name = repeat('x', 200)`);
ok(!!r.error, 'over-long name refused');
r = await as(A, `insert into public.emergency_numbers (id,label,number) values ('fake','Fake','123')`);
ok(!!r.error, 'users cannot add emergency numbers');
// rate limit: 1000 writes a minute per table, then refused
r = await as(B, `insert into public.triggers (user_id,id,category,label) select '${B}', 'rl'||g, 'place', 'x' from generate_series(1,900) g`);
ok(!r.error, 'a large first sync (900 rows) is allowed ' + r.error);
r = await as(B, `insert into public.triggers (user_id,id,category,label) select '${B}', 'rm'||g, 'place', 'x' from generate_series(1,200) g`);
ok(!!r.error && /Too many/.test(r.error), 'flooding beyond the limit is refused');
r = await as(null, `select * from private.write_counts`);
ok(!!r.error, 'rate-limit counters are hidden');

// ---------- care team: invites, sharing, privacy ----------
const M = '44444444-4444-4444-4444-444444444444', P = '55555555-5555-5555-5555-555555555555', S = '66666666-6666-6666-6666-666666666666', X = '77777777-7777-7777-7777-777777777777';
await db.exec(`insert into auth.users (id) values ('${M}'),('${P}'),('${S}'),('${X}')`);
r = await as(M, `select * from public.create_care_invite('professional','Dr Kgosi','Neo','{"alerts":true,"trends":true,"journal":true,"messages":true}'::jsonb)`);
ok(!r.error && /^[A-HJ-NP-Z2-9]{10}$/.test(r.rows?.[0]?.code ?? ''), 'member creates a 10-character invite code ' + r.error);
const proCode = r.rows?.[0]?.code, proLink = r.rows?.[0]?.link_id;
r = await as(M, `select * from public.create_care_invite('supporter','Mum','Neo','{"status":true,"milestones":true,"alerts":true,"messages":true}'::jsonb)`);
const supCode = r.rows?.[0]?.code, supLink = r.rows?.[0]?.link_id;
r = await as(M, `select code_hash from public.care_links where id='${proLink}'`);
ok(r.rows?.[0]?.code_hash && r.rows[0].code_hash !== proCode, 'only a hash of the code is stored');
r = await as(P, `select * from public.care_links`);
ok(r.rows?.length === 0, 'nobody else can see a pending invite');
r = await as(M, `insert into public.shared_summaries (link_id, member_id, payload) values ('${proLink}','${M}','{"days":12}'::jsonb)`);
ok(!r.error, 'member publishes a summary for the link ' + r.error);
r = await as(P, `select * from public.shared_summaries`);
ok(r.rows?.length === 0, 'summary is hidden before the invite is accepted');
r = await as(X, `select * from public.accept_care_invite('WRONGCODE1','X')`);
ok(!!r.error || r.rows?.length === 0, 'a wrong code is refused');
r = await as(M, `select * from public.accept_care_invite('${proCode}','Me')`);
ok(!!r.error, 'a member cannot accept their own invite');
r = await as(P, `select * from public.accept_care_invite('${proCode.toLowerCase().slice(0,5)}-${proCode.toLowerCase().slice(5)}','Dr Kgosi')`);
ok(!r.error && r.rows?.[0]?.member_name === 'Neo', 'professional accepts (code is not case or dash sensitive) ' + r.error);
r = await as(S, `select * from public.accept_care_invite('${proCode}','Someone')`);
ok(!!r.error || r.rows?.length === 0, 'a used code cannot be used again');
r = await as(S, `select * from public.accept_care_invite('${supCode}','Mum')`);
ok(!r.error, 'supporter accepts ' + r.error);
r = await as(P, `select payload from public.shared_summaries`);
ok(r.rows?.length === 1 && r.rows[0].payload.days === 12, 'linked professional reads the summary');
r = await as(S, `select payload from public.shared_summaries`);
ok(r.rows?.length === 0, 'supporter cannot read the professional link summary');
r = await as(P, `select * from public.checkins where user_id='${M}'`);
ok(!!r.error || r.rows?.length === 0, 'viewers never read the member own tables');
// journal sharing respects the permission
r = await as(M, `insert into public.shared_items (link_id, member_id, kind, payload) values ('${proLink}','${M}','journal','{"text":"hard week"}'::jsonb), ('${supLink}','${M}','journal','{"text":"secret"}'::jsonb)`);
ok(!r.error, 'member shares journal entries ' + r.error);
r = await as(P, `select payload from public.shared_items`);
ok(r.rows?.length === 1 && r.rows[0].payload.text === 'hard week', 'professional sees only the entry shared with them');
r = await as(S, `select * from public.shared_items`);
ok(r.rows?.length === 0, 'supporter without the journal permission sees no journal');
// messages
r = await as(S, `insert into public.care_messages (link_id, sender_id, body) values ('${supLink}','${S}','Proud of you!')`);
ok(!r.error, 'supporter sends encouragement ' + r.error);
r = await as(M, `select body from public.care_messages`);
ok(r.rows?.some((x) => x.body === 'Proud of you!'), 'member receives it');
r = await as(X, `insert into public.care_messages (link_id, sender_id, body) values ('${supLink}','${X}','spam')`);
ok(!!r.error, 'outsiders cannot message');
// plans and private notes
r = await as(P, `insert into public.care_plans (link_id, author_id, plan) values ('${proLink}','${P}','{"goals":["Sleep 7h"]}'::jsonb)`);
ok(!r.error, 'professional writes a care plan ' + r.error);
r = await as(M, `select plan from public.care_plans`);
ok(r.rows?.[0]?.plan?.goals?.[0] === 'Sleep 7h', 'member reads their care plan');
r = await as(S, `insert into public.care_plans (link_id, author_id, plan) values ('${supLink}','${S}','{}'::jsonb)`);
ok(!!r.error, 'supporters cannot write care plans');
r = await as(P, `insert into public.pro_notes (link_id, author_id, body) values ('${proLink}','${P}','Private session note')`);
ok(!r.error, 'professional writes a private note ' + r.error);
r = await as(M, `select * from public.pro_notes`);
ok(r.rows?.length === 0, 'the member cannot read the professional private notes');
r = await as(S, `select * from public.pro_notes`);
ok(r.rows?.length === 0, 'supporters cannot read private notes');
// permissions, verified flag, revoke
r = await as(P, `update public.care_links set permissions='{"journal":true}'::jsonb where id='${supLink}' returning id`);
ok(!!r.error || r.rows?.length === 0, 'viewers cannot change permissions');
r = await as(P, `insert into public.care_profiles (user_id, role, display_name, verified) values ('${P}','professional','Dr K', true)`);
ok(!!r.error, 'professionals cannot mark themselves verified');
r = await as(P, `insert into public.care_profiles (user_id, role, display_name) values ('${P}','professional','Dr K')`);
ok(!r.error, 'professional saves their profile ' + r.error);
r = await as(P, `update public.care_profiles set verified=true`);
ok(!!r.error, 'and cannot set verified later either');
r = await as(M, `update public.care_links set status='active', viewer_id='${X}' where id='${supLink}' returning id`);
ok(!!r.error, 'status and viewer change only through the invite functions');
r = await as(M, `select public.revoke_care_link('${proLink}')`);
ok(!r.error, 'member stops sharing ' + r.error);
r = await as(P, `select * from public.shared_summaries`);
ok(r.rows?.length === 0, 'after stopping, the summary is gone');
r = await as(P, `select * from public.pro_notes`);
ok(r.rows?.length === 0, 'after stopping, private notes are no longer reachable');
r = await as(P, `insert into public.care_messages (link_id, sender_id, body) values ('${proLink}','${P}','hello?')`);
ok(!!r.error, 'no messages on a stopped link');
// brute force
for (let i = 0; i < 10; i++) await as(X, `select * from public.accept_care_invite('ZZZZZZZZZ${i}','x')`);
r = await as(X, `select * from public.accept_care_invite('${supCode}','x')`);
ok(!!r.error && /Too many/.test(r.error), 'guessing codes is blocked after 10 tries an hour');
r = await as(null, `select * from public.care_links`);
ok(!!r.error || r.rows?.length === 0, 'anonymous sees no care links');

// ---------- admin dashboard ----------
const AD = '88888888-8888-8888-8888-888888888888', ED = '99999999-9999-9999-9999-999999999999';
await db.exec(`insert into auth.users (id, email) values ('${AD}','boss@serenity.bw'),('${ED}','editor@serenity.bw')`);
await db.exec(`update auth.users set email='doc@clinic.bw' where id='${P}'`);
r = await as(AD, `insert into public.admins (user_id, role) values ('${AD}','admin')`, 'aal2');
ok(!!r.error, 'nobody can make themselves an admin');
await db.exec(`insert into public.admins (user_id, role, display_name) values ('${AD}','admin','Boss')`); // done by hand in the SQL editor
r = await as(AD, `select public.admin_status() s`, 'aal1');
ok(r.rows?.[0]?.s === 'needs_mfa', 'admin without the second step is asked for it');
r = await as(AD, `select public.admin_impact()`, 'aal1');
ok(!!r.error, 'admin functions refuse without MFA');
r = await as(A, `select public.admin_impact()`, 'aal2');
ok(!!r.error, 'ordinary users cannot see admin totals');
r = await as(P, `select * from public.admin_list_professionals()`, 'aal2');
ok(!!r.error, 'counsellors cannot use admin functions');
r = await as(AD, `select public.admin_impact() j`, 'aal2');
ok(!r.error && typeof r.rows?.[0]?.j?.members === 'number', 'admin sees impact totals ' + r.error);
const imp = r.rows?.[0]?.j;
ok(imp && imp.retention?.every((x) => x.pct === null), 'groups under 10 people are hidden');
ok(imp && !JSON.stringify(imp).includes(B) && !JSON.stringify(imp).includes('better today'), 'impact has no personal ids or text');
r = await as(AD, `select * from public.admin_list_professionals()`, 'aal2');
ok(!r.error && r.rows?.some((x) => x.email === 'doc@clinic.bw' && x.review_status === 'pending'), 'admin sees counsellors waiting for checks ' + r.error);
r = await as(AD, `select public.admin_review_professional('${P}','verified','BHPC checked')`, 'aal2');
ok(!r.error, 'admin verifies a counsellor ' + r.error);
r = await as(P, `select verified, review_status from public.care_profiles`, 'aal1');
ok(r.rows?.[0]?.verified === true && r.rows[0].review_status === 'verified', 'counsellor shows as verified');
r = await as(P, `update public.care_profiles set review_status='verified'`, 'aal1');
ok(!!r.error, 'counsellors cannot change their own check status');
// suspension removes access
r = await as(M, `select * from public.create_care_invite('professional','Dr K','Neo','{"alerts":true,"trends":true}'::jsonb)`);
const code2 = r.rows?.[0]?.code, link2 = r.rows?.[0]?.link_id;
r = await as(P, `select * from public.accept_care_invite('${code2}','Dr K')`);
await as(M, `insert into public.shared_summaries (link_id, member_id, payload) values ('${link2}','${M}','{"days":3}'::jsonb)`);
r = await as(P, `select * from public.shared_summaries where link_id='${link2}'`);
ok(r.rows?.length === 1, 'verified counsellor reads summary');
await as(AD, `select public.admin_review_professional('${P}','suspended','complaint')`, 'aal2');
r = await as(P, `select * from public.shared_summaries where link_id='${link2}'`);
ok(r.rows?.length === 0, 'suspended counsellor loses access straight away');
// emergency numbers
r = await as(A, `update public.emergency_numbers set number='000' where id='ambulance' returning id`, 'aal2');
ok(!!r.error || r.rows?.length === 0, 'ordinary users still cannot edit numbers');
r = await as(AD, `update public.emergency_numbers set verified=true, checked_at=now() where id='ambulance' returning id`, 'aal2');
ok(!r.error && r.rows?.length === 1, 'admin marks a number as checked ' + r.error);
r = await as(AD, `select action from public.admin_actions order by id`, 'aal2');
ok(r.rows?.some((x) => x.action === 'emergency_number_update') && r.rows?.some((x) => x.action === 'professional_verified'), 'admin actions are logged');
await as(AD, `delete from public.admin_actions`, 'aal2');
r = await as(AD, `select count(*)::int n from public.admin_actions`, 'aal2');
ok(r.rows?.[0]?.n >= 2, 'the activity log cannot be wiped');
// admins
r = await as(AD, `select public.admin_add('editor@serenity.bw','editor','Ed')`, 'aal2');
ok(!r.error, 'admin adds an editor ' + r.error);
r = await as(ED, `select * from public.admin_list_professionals()`, 'aal2');
ok(!!r.error, 'editors cannot check counsellors');
r = await as(ED, `select public.admin_impact() j`, 'aal2');
ok(!r.error, 'editors can see anonymous totals');
r = await as(ED, `update public.emergency_numbers set number='1' where id='fire' returning id`, 'aal2');
ok(!!r.error || r.rows?.length === 0, 'editors cannot change emergency numbers');
r = await as(ED, `select public.admin_add('x@y.z','admin','x')`, 'aal2');
ok(!!r.error, 'only full admins add admins');
r = await as(AD, `select public.admin_remove('${AD}')`, 'aal2');
ok(!!r.error, 'an admin cannot remove themselves');
r = await as(AD, `select * from public.journal_entries`, 'aal2');
ok(r.rows?.length === 0, 'admins cannot read journals');
r = await as(AD, `select * from public.checkins`, 'aal2');
ok(r.rows?.length === 0, 'admins cannot read check-ins');
r = await as(AD, `select * from public.care_messages`, 'aal2');
ok(r.rows?.length === 0, 'admins cannot read messages');

// ---------- editable content ----------
r = await as(ED, `insert into public.content_items (type, item_key, data, status) values ('recipe','seswaa','{"set":"botswana","en":{"title":"Seswaa"},"tn":{"title":"Seswaa"}}','draft')`, 'aal2');
ok(!r.error, 'editor adds a draft recipe ' + r.error);
r = await as(null, `select * from public.content_items`);
ok(!r.error && r.rows?.length === 0, 'drafts are not public');
r = await as(ED, `update public.content_items set status='published' where item_key='seswaa' returning updated_by`, 'aal2');
ok(!r.error && r.rows?.[0]?.updated_by === ED, 'editor publishes; change is stamped with who did it ' + r.error);
r = await as(null, `select item_key from public.content_items`);
ok(r.rows?.length === 1, 'published content is readable without logging in');
r = await as(A, `insert into public.content_items (type, item_key, data, status) values ('quote','1','{"en":"x","tn":"y"}','published')`, 'aal2');
ok(!!r.error, 'ordinary users cannot change content');
r = await as(A, `update public.content_items set status='hidden' returning item_key`, 'aal2');
ok(!!r.error || r.rows?.length === 0, 'ordinary users cannot hide content');
r = await as(ED, `insert into public.content_items (type, item_key, data) values ('recipe','../etc','{}')`, 'aal2');
ok(!!r.error, 'content keys are checked');
r = await as(ED, `insert into public.content_items (type, item_key, data) values ('virus','x','{}')`, 'aal2');
ok(!!r.error, 'only known content types');
r = await as(AD, `select action, target from public.admin_actions where action like 'content_%'`, 'aal2');
ok(r.rows?.some((x) => x.action === 'content_published' && x.target === 'recipe:seswaa'), 'content changes are logged');
r = await as(ED, `delete from public.content_items where item_key='seswaa' returning item_key`, 'aal2');
ok(!r.error && r.rows?.length === 1, 'editor restores the original by removing the edit ' + r.error);

// ---------- AI oversight ----------
await db.exec(`insert into public.ai_usage (demo, outcome, model, lang, ms) values (false,'ok','gemini-x','en',1200),(true,'ok','gemini-x','en',900),(false,'model_unavailable',null,'tn',null)`);
r = await as(A, `select * from public.ai_usage`, 'aal2');
ok(!!r.error || r.rows?.length === 0, 'ordinary users cannot read AI usage');
r = await as(null, `select * from public.app_settings`);
ok(!!r.error || r.rows?.length === 0, 'the AI switch is not public');
r = await as(A, `select public.admin_set_ai(false)`, 'aal2');
ok(!!r.error, 'ordinary users cannot switch the AI off');
r = await as(ED, `select public.admin_set_ai(false)`, 'aal2');
ok(!!r.error, 'editors cannot switch the AI off');
r = await as(AD, `select public.admin_set_ai(false)`, 'aal1');
ok(!!r.error, 'switching the AI needs MFA');
r = await as(AD, `select public.admin_set_ai(false)`, 'aal2');
ok(!r.error, 'admin switches the AI off ' + r.error);
r = await as(ED, `select public.admin_ai_overview() j`, 'aal2');
ok(!r.error && r.rows?.[0]?.j?.enabled === false && r.rows[0].j.ok_30d === 2 && r.rows[0].j.real_30d === 1 && r.rows[0].j.outcomes_30d?.model_unavailable === 1 && r.rows[0].j.daily_14d?.length === 14, 'AI overview shows the switch and counts ' + r.error);
r = await as(AD, `select action from public.admin_actions where action like 'ai_assistant_%'`, 'aal2');
ok(r.rows?.some((x) => x.action === 'ai_assistant_off'), 'AI switch changes are logged');
await as(AD, `select public.admin_set_ai(true)`, 'aal2');
r = await as(AD, `select value from public.app_settings where key='ai_assistant'`, 'aal2');
ok(!!r.error || r.rows?.length === 0, 'even admins read the switch only through the overview function');
console.log(`schema tests: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
