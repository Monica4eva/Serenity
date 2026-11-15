// Edge Function: send a discreet phone alert to the care team when someone's button gets worse.
//  * Professionals are alerted when it turns pink or red; supporters only when it turns red.
//  * Only links that are active AND have the "alerts" permission are alerted.
//  * The text never says "relapse", "crisis" or the person's details: it only asks them to open Serenity.
//  * At most one alert per link every 3 hours, so nobody is flooded.
// Deploy: npx supabase functions deploy notify-care-team
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const RANK: Record<string, number> = { normal: 0, orange: 1, pink: 2, red: 3 };
const lastSent = new Map<string, number>();

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: cors });
  const jwt = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const { data: who } = await admin.auth.getUser(jwt);
  if (!who?.user) return new Response(JSON.stringify({ error: 'Not signed in' }), { status: 401, headers: cors });

  const { prev, next } = await req.json().catch(() => ({}));
  if (!(next in RANK) || !(prev in RANK) || RANK[next] <= RANK[prev]) return Response.json({ sent: 0 }, { headers: cors });

  const { data: links } = await admin
    .from('care_links')
    .select('id, role, viewer_id, permissions, member_name')
    .eq('member_id', who.user.id)
    .eq('status', 'active');
  const targets = (links ?? []).filter(
    (l) => l.permissions?.alerts === true && ((l.role === 'professional' && (next === 'pink' || next === 'red')) || (l.role === 'supporter' && next === 'red')),
  );
  const now = Date.now();
  const due = targets.filter((l) => now - (lastSent.get(l.id) ?? 0) > 3 * 3600_000);
  if (!due.length) return Response.json({ sent: 0 }, { headers: cors });

  const { data: tokens } = await admin.from('push_tokens').select('user_id, token').in('user_id', due.map((l) => l.viewer_id));
  const messages = (tokens ?? []).map((t) => {
    const l = due.find((x) => x.viewer_id === t.user_id)!;
    const name = l.member_name || 'Someone';
    return {
      to: t.token,
      sound: 'default',
      priority: 'high',
      title: 'Serenity',
      body: l.role === 'supporter' ? `${name} may need you today. Open Serenity.` : `Please check in with ${name}. Open Serenity.`,
      data: { route: l.role === 'supporter' ? '/supporter' : `/pro/client/${l.id}` },
    };
  });
  if (messages.length) {
    await fetch('https://exp.host/--/api/v2/push/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(messages) });
    due.forEach((l) => lastSent.set(l.id, now));
  }
  return Response.json({ sent: messages.length }, { headers: cors });
});
