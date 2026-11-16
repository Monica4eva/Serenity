// Serenity Session Assistant (AI agent for counsellors): calls the session-assistant Edge
// Function. The model never sees the client's name or journal (see supabase/functions/
// session-assistant/core.ts), and its answer is only a draft for the counsellor.
//
// It always gives the counsellor something useful: if the AI or the server cannot be reached,
// a built-in draft is made on this device from the same data by fixed rules, and it is clearly
// labelled "built-in", never as AI. Only an admin switch-off or a refused access stops it.
import { supabase } from './supabase';
import type { LinkedPerson } from './store';
import { fallbackDraft, safetyNote, sanitize, type Draft } from '../../supabase/functions/session-assistant/core.ts';

export type { Draft };
export type AssistantResult = {
  draft: Draft;
  safety?: string;
  source: 'ai' | 'builtin';
  model: string | null;
  note?: string;
  demo: boolean;
  at: string;
};
export type AssistantError = 'disabled' | 'forbidden' | 'signed_out';

export class AssistantFailure extends Error {
  constructor(public code: AssistantError) {
    super(code);
  }
}

const STOP: string[] = ['disabled', 'forbidden', 'signed_out'];

function builtIn(person: LinkedPerson, lang: 'en' | 'tn', note: string): AssistantResult {
  const input = sanitize(person.summary ?? {}, lang);
  return { draft: fallbackDraft(input), safety: safetyNote(input), source: 'builtin', model: null, note, demo: !!person.demo, at: new Date().toISOString() };
}

export async function prepareSession(person: LinkedPerson, lang: 'en' | 'tn'): Promise<AssistantResult> {
  if (!supabase) return builtIn(person, lang, 'offline');
  // Sample people ("Try the demo") send their sample summary without the name; real clients send
  // only the link id, and the server loads the summary the counsellor is allowed to see.
  const { name: _name, ...demoSummary } = person.summary ?? ({} as Record<string, unknown>);
  const body = person.demo ? { demoSummary, lang } : { linkId: person.linkId, lang };
  try {
    const { data, error } = await supabase.functions.invoke('session-assistant', { body });
    if (error) {
      let code = 'unknown';
      try {
        const ctx = (error as { context?: Response }).context;
        if (ctx?.status === 404) code = 'not_deployed';
        else {
          const j = ctx ? await ctx.json() : null;
          code = j?.error ?? (ctx ? `http_${ctx.status}` : 'offline');
        }
      } catch {
        code = 'offline';
      }
      if (STOP.includes(code)) throw new AssistantFailure(code as AssistantError);
      return builtIn(person, lang, code);
    }
    if (!data?.draft) return builtIn(person, lang, 'empty');
    return { source: 'ai', model: null, ...data } as AssistantResult;
  } catch (e) {
    if (e instanceof AssistantFailure) throw e;
    return builtIn(person, lang, 'offline');
  }
}
