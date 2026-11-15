// Content edited in the admin dashboard (stored in Supabase table content_items).
// The app ships with built-in content; edits from the dashboard REPLACE an item, ADD a new one,
// or HIDE a built-in one. Pure functions only (no React, no network) so they can be tested and
// shared with the admin website.
//
// Safety: anything that arrives from the server is checked and cleaned. A broken item is
// ignored rather than crashing the app.
import type { GuidedActivity, ActivityCat } from './activities.ts';
import type { Recipe } from './recipes.ts';
import type { Resource, ResourceGroup } from '../lib/resources.ts';

export type ContentType = 'recipe' | 'activity' | 'quote' | 'resource' | 'guide' | 'step' | 'prompt';
export const CONTENT_TYPES: ContentType[] = ['recipe', 'activity', 'quote', 'resource', 'guide', 'step', 'prompt'];
export type ContentStatus = 'published' | 'draft' | 'hidden';

/** One row of content_items as the app receives it. */
export type RemoteItem = { type: ContentType; item_key: string; data: unknown; status: ContentStatus; sort_order?: number | null };

export type RecipeSet = 'botswana' | 'global';
export type RemoteRecipe = Recipe & { set: RecipeSet };
export type RemoteResource = Resource & { group: ResourceGroup['id'] };
export type GuideArticle = { id: string; en: { t: string; body: string[] }; tn: { t: string; body: string[] } };
export type StepReflection = { n: number; en: { text: string; qs: string[] }; tn: { text: string; qs: string[] } };
export type JournalIdea = { id: string; en: string; tn: string };
export type QuoteDay = { day: number; en: string; tn: string };

export const RECIPE_TAGS: Recipe['tag'][] = ['breakfast', 'lunch', 'dinner', 'snack', 'drink'];
export const ACTIVITY_CATS: ActivityCat[] = ['calm', 'move', 'connect', 'spirit', 'nourish', 'create'];
export const RESOURCE_GROUPS: ResourceGroup['id'][] = ['online', 'botswana', 'helplines', 'family'];

// ---------------------------------------------------------------- cleaning

const str = (v: unknown, max = 2000) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const strList = (v: unknown, maxItems = 40, max = 600) =>
  Array.isArray(v) ? v.map((x) => str(x, max)).filter(Boolean).slice(0, maxItems) : [];
const num = (v: unknown, lo: number, hi: number, dflt: number) => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, Math.round(n))) : dflt;
};
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const oneOf = <T extends string>(v: unknown, list: readonly T[], dflt: T): T => (list.includes(v as T) ? (v as T) : dflt);
/** Only web links and in-app routes; never javascript: or other schemes. */
const safeUrl = (v: unknown) => {
  const s = str(v, 500);
  return /^https:\/\/[^\s]+$/i.test(s) ? s : undefined;
};
const safeRoute = (v: unknown) => {
  const s = str(v, 120);
  return /^\/[a-zA-Z0-9/_\-?=&]*$/.test(s) ? s : undefined;
};
const lang = (v: unknown, keys: string[]) => {
  const o = obj(v);
  const out: Record<string, unknown> = {};
  for (const k of keys) out[k] = Array.isArray(o[k]) ? strList(o[k]) : str(o[k]);
  return out;
};

export function cleanRecipe(key: string, d: unknown): RemoteRecipe | null {
  const o = obj(d);
  const en = lang(o.en, ['title', 'why', 'ingredients', 'steps']) as Recipe['en'];
  const set = oneOf(o.set, ['botswana', 'global'] as const, 'global');
  const tnRaw = obj(o.tn);
  const tn = tnRaw.title ? (lang(o.tn, ['title', 'why', 'ingredients', 'steps']) as Recipe['en']) : undefined;
  if (!en.title || !en.steps.length) return null;
  if (set === 'botswana' && (!tn?.title || !tn.steps.length)) return null; // shown in the Setswana app: must be in Setswana
  return { id: key, set, emoji: str(o.emoji, 8) || '🍽️', mins: num(o.mins, 1, 600, 20), serves: num(o.serves, 1, 50, 2), tag: oneOf(o.tag, RECIPE_TAGS, 'lunch'), en, tn };
}

export function cleanActivity(key: string, d: unknown): GuidedActivity | null {
  const o = obj(d);
  const en = lang(o.en, ['title', 'why', 'steps']) as GuidedActivity['en'];
  const tn = lang(o.tn, ['title', 'why', 'steps']) as GuidedActivity['tn'];
  if (!en.title || !tn.title || !en.steps.length || !tn.steps.length) return null;
  const breathe = Array.isArray(o.breathe) && o.breathe.length === 4 ? o.breathe.map((x) => num(x, 0, 12, 4)) : undefined;
  return { id: key, icon: str(o.icon, 40) || 'leaf-outline', cat: oneOf(o.cat, ACTIVITY_CATS, 'calm'), mins: num(o.mins, 1, 120, 10), link: safeRoute(o.link), breathe, en, tn };
}

export function cleanResource(key: string, d: unknown): RemoteResource | null {
  const o = obj(d);
  const name = str(o.name, 160);
  const en = str(o.en, 600);
  const tn = str(o.tn, 600);
  if (!name || !en || !tn) return null;
  const phones = strList(o.phones, 6, 30).filter((p) => /^[+0-9 ()-]{3,30}$/.test(p));
  return { id: key, group: oneOf(o.group, RESOURCE_GROUPS, 'online'), name, en, tn, url: safeUrl(o.url), phones: phones.length ? phones : undefined };
}

export function cleanGuide(key: string, d: unknown): GuideArticle | null {
  const o = obj(d);
  const en = { t: str(obj(o.en).t, 160), body: strList(obj(o.en).body, 20, 1200) };
  const tn = { t: str(obj(o.tn).t, 160), body: strList(obj(o.tn).body, 20, 1200) };
  if (!en.t || !tn.t || !en.body.length || !tn.body.length) return null;
  return { id: key, en, tn };
}

export function cleanStep(key: string, d: unknown): StepReflection | null {
  const n = num(key, 0, 99, 0);
  if (n < 1 || n > 12) return null;
  const o = obj(d);
  const en = { text: str(obj(o.en).text, 1200), qs: strList(obj(o.en).qs, 6, 300) };
  const tn = { text: str(obj(o.tn).text, 1200), qs: strList(obj(o.tn).qs, 6, 300) };
  if (!en.text || !tn.text) return null;
  return { n, en, tn };
}

export function cleanPrompt(key: string, d: unknown): JournalIdea | null {
  const o = obj(d);
  const en = str(o.en, 300);
  const tn = str(o.tn, 300);
  return en && tn ? { id: key, en, tn } : null;
}

export function cleanQuote(key: string, d: unknown): QuoteDay | null {
  const day = num(key, 0, 999, 0);
  const o = obj(d);
  const en = str(o.en, 300);
  const tn = str(o.tn, 300);
  return day >= 1 && day <= 366 && en && tn ? { day, en, tn } : null;
}

// ---------------------------------------------------------------- merging

/**
 * Built-in list + dashboard edits. "published" replaces or adds; "hidden" removes; "draft" is
 * ignored (only visible in the dashboard). New items go at the end unless sort_order is set.
 */
export function mergeList<T>(builtIn: T[], keyOf: (x: T) => string, remote: RemoteItem[], type: ContentType, clean: (key: string, d: unknown) => T | null): T[] {
  const mine = remote.filter((r) => r.type === type);
  const hidden = new Set(mine.filter((r) => r.status === 'hidden').map((r) => r.item_key));
  const pub = new Map<string, { item: T; order?: number | null }>();
  for (const r of mine) {
    if (r.status !== 'published') continue;
    const item = clean(r.item_key, r.data);
    if (item) pub.set(r.item_key, { item, order: r.sort_order });
  }
  const out: { item: T; order: number }[] = [];
  builtIn.forEach((b, i) => {
    const k = keyOf(b);
    if (hidden.has(k)) return;
    const p = pub.get(k);
    out.push({ item: p ? p.item : b, order: p?.order ?? i });
    pub.delete(k);
  });
  let next = builtIn.length;
  for (const [, p] of pub) out.push({ item: p.item, order: p.order ?? next++ });
  return out.sort((a, b) => a.order - b.order).map((x) => x.item);
}

export type BuiltIn = {
  recipesBotswana: Recipe[];
  recipesGlobal: Recipe[];
  activities: GuidedActivity[];
  resources: ResourceGroup[];
  guideEn: { id: string; t: string; body: string[] }[];
  guideTn: { id: string; t: string; body: string[] }[];
  stepTextsEn: string[];
  stepTextsTn: string[];
  stepQsEn: string[];
  stepQsTn: string[];
  promptsEn: string[];
  promptsTn: string[];
  quotesEn: string[];
  quotesTn: string[];
};

export type MergedContent = {
  recipesBotswana: Recipe[];
  recipesGlobal: Recipe[];
  activities: GuidedActivity[];
  resources: ResourceGroup[];
  guide: GuideArticle[];
  steps: StepReflection[];
  prompts: JournalIdea[];
  /** Quote overrides by day of year (1 to 366). */
  quotes: Record<number, { en: string; tn: string }>;
};

/** Built-in content shaped the same way the dashboard edits it. */
export function builtInItems(b: BuiltIn) {
  return {
    guide: b.guideEn.map((g, i) => ({ id: g.id, en: { t: g.t, body: g.body }, tn: { t: b.guideTn[i]?.t ?? '', body: b.guideTn[i]?.body ?? [] } })) as GuideArticle[],
    steps: b.stepTextsEn.map((text, i) => ({ n: i + 1, en: { text, qs: b.stepQsEn }, tn: { text: b.stepTextsTn[i] ?? '', qs: b.stepQsTn } })) as StepReflection[],
    prompts: b.promptsEn.map((en, i) => ({ id: `p${i + 1}`, en, tn: b.promptsTn[i] ?? '' })) as JournalIdea[],
    resources: b.resources.flatMap((g) => g.items.map((r) => ({ ...r, group: g.id }))) as RemoteResource[],
    recipes: [...b.recipesBotswana.map((r) => ({ ...r, set: 'botswana' as const })), ...b.recipesGlobal.map((r) => ({ ...r, set: 'global' as const }))] as RemoteRecipe[],
  };
}

export function mergeContent(b: BuiltIn, remote: RemoteItem[]): MergedContent {
  const base = builtInItems(b);
  const recipes = mergeList<RemoteRecipe>(base.recipes, (r) => r.id, remote, 'recipe', cleanRecipe);
  const res = mergeList<RemoteResource>(base.resources, (r) => r.id, remote, 'resource', cleanResource);
  const quotes: MergedContent['quotes'] = {};
  for (const r of remote) {
    if (r.type !== 'quote' || r.status !== 'published') continue;
    const q = cleanQuote(r.item_key, r.data);
    if (q) quotes[q.day] = { en: q.en, tn: q.tn };
  }
  return {
    recipesBotswana: recipes.filter((r) => r.set === 'botswana'),
    recipesGlobal: recipes.filter((r) => r.set === 'global'),
    activities: mergeList(b.activities, (a) => a.id, remote, 'activity', cleanActivity),
    resources: RESOURCE_GROUPS.map((id) => ({ id, items: res.filter((r) => r.group === id).map(({ group: _g, ...r }) => r) })).filter((g) => g.items.length),
    guide: mergeList(base.guide, (g) => g.id, remote, 'guide', cleanGuide),
    steps: mergeList(base.steps, (s) => String(s.n), remote, 'step', cleanStep).sort((a, b) => a.n - b.n),
    prompts: mergeList(base.prompts, (p) => p.id, remote, 'prompt', cleanPrompt),
    quotes,
  };
}
