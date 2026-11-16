// Edge Function: Serenity Session Assistant (AI agent for counsellors).
//
// A counsellor taps "Prepare my session". This function:
//  1. checks the caller is an active, non-suspended counsellor on that link,
//  2. loads the client's shared summary (the same filtered data the counsellor already sees),
//  3. strips it down to numbers and fixed codes (core.ts: no name, no journal, no free text),
//  4. asks Gemini for a draft, validates it, and adds fixed safety lines,
//     (only if the admin team has not switched the assistant off; every request's outcome is counted),
//  5. returns a DRAFT the counsellor reviews and edits. Nothing is sent to the client.
//
// Demo mode ("Try the demo", no account): accepts the built-in sample summary instead of a
// link, with the same stripping, so judges can see the real model working.
//
// Setup (once):
//   npx supabase secrets set GEMINI_API_KEY=your-key-from-google-ai-studio
//   npx supabase functions deploy session-assistant
// Optional: npx supabase secrets set GEMINI_MODEL=model-name
import { createClient } from 'npm:@supabase/supabase-js@2';
import { buildPrompt, hasEnoughData, parseDraft, safetyNote, sanitize } from './core.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: cors });

// Small in-memory rate limit per caller: 20 drafts an hour (demo: 6 an hour per address).
const calls = new Map<string, number[]>();
function allowed(key: string, max: number) {
  const now = Date.now();
  const recent = (calls.get(key) ?? []).filter((t) => now - t < 3600_000);
  if (recent.length >= max) return false;
  recent.push(now);
  calls.set(key, recent);
  return true;
}

// Newest first; the first that answers is used. GEMINI_MODEL overrides.
const MODELS = [Deno.env.get('GEMINI_MODEL'), 'gemini-3.8-flash', 'gemini-flash-latest', 'gemini-2.5-flash'].filter(Boolean) as string[];

async function askGemini(prompt: string, key: string): Promise<{ text: string; model: string } | null> {
  for (const model of MODELS) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 1200, responseMimeType: 'application/json' },
      }),
    }).catch(() => null);
    if (!res) continue;
    if (res.status === 404 || res.status === 400) continue; // model name not available: try the next
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text ?? '').join('') ?? '';
    if (text) return { text, model };
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);

  const key = Deno.env.get('GEMINI_API_KEY');
  if (!key) return json({ error: 'not_configured' }, 503);

  const started = Date.now();
  const body = await req.json().catch(() => ({}));
  const lang = body?.lang === 'tn' ? 'tn' : 'en';
  let summary: unknown;
  const demo = !body?.linkId;
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

  // Oversight: one row per request with the outcome only (nothing personal), shown on the
  // admin site's AI oversight page.
  const log = (outcome: string, model: string | null = null) =>
    admin.from('ai_usage').insert({ demo, outcome, model, lang, ms: Math.min(600000, Date.now() - started) }).then(() => {}, () => {});
  const fail = async (error: string, status: number) => {
    await log(error);
    return json({ error }, status);
  };

  // Admins and clinicians can switch the assistant off instantly from the admin site.
  const { data: setting } = await admin.from('app_settings').select('value').eq('key', 'ai_assistant').maybeSingle();
  if (setting?.value?.enabled === false) return fail('disabled', 503);

  if (typeof body?.linkId === 'string') {
    const jwt = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
    const { data: who } = await admin.auth.getUser(jwt);
    if (!who?.user) return fail('signed_out', 401);
    if (!allowed(who.user.id, 20)) return fail('rate', 429);

    const { data: link } = await admin.from('care_links').select('id, role, viewer_id, status').eq('id', body.linkId).maybeSingle();
    if (!link || link.viewer_id !== who.user.id || link.role !== 'professional' || link.status !== 'active') return fail('forbidden', 403);
    const { data: prof } = await admin.from('care_profiles').select('review_status').eq('user_id', who.user.id).maybeSingle();
    if (prof?.review_status === 'suspended') return fail('forbidden', 403);

    const { data: shared } = await admin.from('shared_summaries').select('payload').eq('link_id', link.id).maybeSingle();
    summary = shared?.payload;
  } else if (body?.demoSummary && typeof body.demoSummary === 'object') {
    const ip = (req.headers.get('x-forwarded-for') ?? 'unknown').split(',')[0].trim();
    if (!allowed(`demo:${ip}`, 6)) return fail('rate', 429);
    summary = body.demoSummary;
  } else {
    return fail('bad_request', 400);
  }

  const input = sanitize(summary, lang);
  if (!hasEnoughData(input)) return fail('not_enough_data', 422);

  const answer = await askGemini(buildPrompt(input), key);
  const draft = answer ? parseDraft(answer.text) : null;
  if (!draft) return fail('model_unavailable', 502);
  await log('ok', answer!.model);

  return json({ draft, safety: safetyNote(input), model: answer!.model, demo, at: new Date().toISOString() });
});
