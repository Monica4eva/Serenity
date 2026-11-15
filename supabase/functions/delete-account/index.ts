// Edge Function: permanently delete the signed-in person's account and all their data.
// Every table references auth.users with ON DELETE CASCADE, so deleting the auth user
// removes all rows. Deploy: npx supabase functions deploy delete-account
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: cors });

  const url = Deno.env.get('SUPABASE_URL')!;
  const jwt = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
  if (!jwt) return new Response(JSON.stringify({ error: 'Not signed in' }), { status: 401, headers: cors });

  // Identify the caller from their own token. A person can only ever delete themselves.
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const { data: who, error: whoErr } = await admin.auth.getUser(jwt);
  if (whoErr || !who.user) return new Response(JSON.stringify({ error: 'Not signed in' }), { status: 401, headers: cors });

  const { error } = await admin.auth.admin.deleteUser(who.user.id);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: cors });

  return new Response(JSON.stringify({ deleted: true }), { headers: { ...cors, 'Content-Type': 'application/json' } });
});
