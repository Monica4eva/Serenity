// Serenity Session Assistant (AI agent for counsellors): calls the session-assistant Edge
// Function. The model never sees the client's name or journal (see supabase/functions/
// session-assistant/core.ts), and its answer is only a draft for the counsellor.
import { supabase } from './supabase';
import type { LinkedPerson } from './store';
import type { Draft } from '../../supabase/functions/session-assistant/core.ts';

export type { Draft };
export type AssistantResult = { draft: Draft; safety?: string; model: string; demo: boolean; at: string };
export type AssistantError = 'offline' | 'not_configured' | 'disabled' | 'rate' | 'not_enough_data' | 'forbidden' | 'signed_out' | 'model_unavailable' | 'unknown';

export class AssistantFailure extends Error {
  constructor(public code: AssistantError) {
    super(code);
  }
}

export async function prepareSession(person: LinkedPerson, lang: 'en' | 'tn'): Promise<AssistantResult> {
  if (!supabase) throw new AssistantFailure('offline');
  // Sample people ("Try the demo") send their built-in sample summary; real clients send only
  // the link id, and the server loads the summary the counsellor is allowed to see.
  const { name: _name, ...demoSummary } = person.summary ?? ({} as Record<string, unknown>);
  const body = person.demo ? { demoSummary, lang } : { linkId: person.linkId, lang };
  const { data, error } = await supabase.functions.invoke('session-assistant', { body });
  if (error) {
    let code: AssistantError = 'unknown';
    try {
      const ctx = (error as { context?: Response }).context;
      if (ctx?.status === 404) code = 'not_configured'; // function not deployed yet
      else {
        const j = ctx ? await ctx.json() : null;
        if (j?.error) code = j.error;
        else if (!ctx) code = 'offline';
      }
    } catch {
      if (/fetch|network/i.test(String(error.message))) code = 'offline';
    }
    throw new AssistantFailure(code);
  }
  if (!data?.draft) throw new AssistantFailure('model_unavailable');
  return data as AssistantResult;
}
