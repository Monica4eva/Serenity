// Edit what the app shows, in English and Setswana side by side:
// recipes, activities, daily quotes, resources, the family guide, 12-Step reflections, journal ideas.
// Built-in items can be edited, hidden, or restored; new items can be added.
// The app picks up published changes the next time it is opened (and every 10 minutes while open).
import React, { useEffect, useMemo, useState } from 'react';
import { BUILT_IN } from '../../../src/content/builtin.ts';
import {
  ACTIVITY_CATS, RECIPE_TAGS, RESOURCE_GROUPS, builtInItems,
  cleanActivity, cleanGuide, cleanPrompt, cleanQuote, cleanRecipe, cleanResource, cleanStep, type ContentType,
} from '../../../src/content/remote.ts';
import { listContent, restoreContent, saveContent, type AdminRole, type ContentRow } from '../api';
import { Badge, Button, Card, Empty, ErrorNote, fmtDateTime } from '../ui';

type Kind = 'text' | 'long' | 'lines' | 'number' | 'select';
type Field = { path: string; label: string; kind: Kind; options?: string[]; hint?: string };
type Config = {
  label: string;
  one: string;
  shared: Field[];
  lang: Field[];
  canAdd: boolean;
  canHide: boolean;
  clean: (key: string, d: unknown) => unknown;
  title: (d: any) => string;
  titleTn: (d: any) => string;
  blank: () => any;
  tnOptional?: (d: any) => boolean;
};

const CONFIG: Record<ContentType, Config> = {
  recipe: {
    label: 'Recipes', one: 'recipe', canAdd: true, canHide: true, clean: cleanRecipe,
    shared: [
      { path: 'set', label: 'Shown in', kind: 'select', options: ['botswana', 'global'], hint: 'botswana = Setswana app (familiar dishes). global = English app (well-known dishes).' },
      { path: 'emoji', label: 'Emoji', kind: 'text' },
      { path: 'tag', label: 'Meal', kind: 'select', options: RECIPE_TAGS },
      { path: 'mins', label: 'Minutes', kind: 'number' },
      { path: 'serves', label: 'Serves', kind: 'number' },
    ],
    lang: [
      { path: 'title', label: 'Name', kind: 'text' },
      { path: 'why', label: 'Why it helps recovery', kind: 'long' },
      { path: 'ingredients', label: 'Ingredients (one per line)', kind: 'lines' },
      { path: 'steps', label: 'Steps (one per line)', kind: 'lines' },
    ],
    title: (d) => d?.en?.title ?? '', titleTn: (d) => d?.tn?.title ?? '',
    blank: () => ({ set: 'botswana', emoji: '🍲', tag: 'lunch', mins: 20, serves: 2, en: { title: '', why: '', ingredients: [], steps: [] }, tn: { title: '', why: '', ingredients: [], steps: [] } }),
    tnOptional: (d) => d?.set === 'global',
  },
  activity: {
    label: 'Activities', one: 'activity', canAdd: true, canHide: true, clean: cleanActivity,
    shared: [
      { path: 'cat', label: 'Category', kind: 'select', options: ACTIVITY_CATS },
      { path: 'mins', label: 'Minutes', kind: 'number' },
      { path: 'icon', label: 'Icon name', kind: 'text', hint: 'An Ionicons name, for example leaf-outline, walk-outline, heart-outline.' },
    ],
    lang: [
      { path: 'title', label: 'Name', kind: 'text' },
      { path: 'why', label: 'Why it helps', kind: 'long' },
      { path: 'steps', label: 'Guided steps (one per line)', kind: 'lines' },
    ],
    title: (d) => d?.en?.title ?? '', titleTn: (d) => d?.tn?.title ?? '',
    blank: () => ({ cat: 'calm', mins: 10, icon: 'leaf-outline', en: { title: '', why: '', steps: [] }, tn: { title: '', why: '', steps: [] } }),
  },
  quote: {
    label: 'Daily quotes', one: 'quote', canAdd: false, canHide: false, clean: cleanQuote,
    shared: [], lang: [{ path: '', label: 'Quote', kind: 'long' }],
    title: (d) => d?.en ?? '', titleTn: (d) => d?.tn ?? '', blank: () => ({ en: '', tn: '' }),
  },
  resource: {
    label: 'Resources hub', one: 'resource', canAdd: true, canHide: true, clean: cleanResource,
    shared: [
      { path: 'group', label: 'Section', kind: 'select', options: RESOURCE_GROUPS },
      { path: 'name', label: 'Name of the organisation', kind: 'text' },
      { path: 'url', label: 'Website (must start with https://)', kind: 'text' },
      { path: 'phones', label: 'Phone numbers (one per line)', kind: 'lines' },
    ],
    lang: [{ path: '', label: 'Description', kind: 'long' }],
    title: (d) => d?.name ?? '', titleTn: (d) => d?.tn ?? '',
    blank: () => ({ group: 'botswana', name: '', url: '', phones: [], en: '', tn: '' }),
  },
  guide: {
    label: 'Family guide', one: 'article', canAdd: true, canHide: true, clean: cleanGuide,
    shared: [],
    lang: [
      { path: 't', label: 'Title', kind: 'text' },
      { path: 'body', label: 'Paragraphs (one per line)', kind: 'lines' },
    ],
    title: (d) => d?.en?.t ?? '', titleTn: (d) => d?.tn?.t ?? '',
    blank: () => ({ en: { t: '', body: [] }, tn: { t: '', body: [] } }),
  },
  step: {
    label: '12 Steps', one: 'step', canAdd: false, canHide: false, clean: cleanStep,
    shared: [],
    lang: [
      { path: 'text', label: 'Step in our own words', kind: 'long' },
      { path: 'qs', label: 'Reflection questions (one per line)', kind: 'lines' },
    ],
    title: (d) => d?.en?.text ?? '', titleTn: (d) => d?.tn?.text ?? '', blank: () => ({ en: { text: '', qs: [] }, tn: { text: '', qs: [] } }),
  },
  prompt: {
    label: 'Journal ideas', one: 'journal idea', canAdd: true, canHide: true, clean: cleanPrompt,
    shared: [], lang: [{ path: '', label: 'Idea', kind: 'text' }],
    title: (d) => d?.en ?? '', titleTn: (d) => d?.tn ?? '', blank: () => ({ en: '', tn: '' }),
  },
};
const TYPES = Object.keys(CONFIG) as ContentType[];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const dayLabel = (day: number) => {
  const d = new Date(2027, 0, day); // a non-leap year, like the app
  return `Day ${day} · ${d.getDate()} ${MONTHS[d.getMonth()]}`;
};

// ---------- built-in items per type, keyed the same way the app keys them ----------
function builtIns(): Record<ContentType, { key: string; data: any }[]> {
  const b = builtInItems(BUILT_IN);
  return {
    recipe: b.recipes.map((r) => ({ key: r.id, data: r })),
    activity: BUILT_IN.activities.map((a) => ({ key: a.id, data: a })),
    quote: BUILT_IN.quotesEn.map((en, i) => ({ key: String(i + 1), data: { en, tn: BUILT_IN.quotesTn[i] ?? '' } })),
    resource: b.resources.map((r) => ({ key: r.id, data: r })),
    guide: b.guide.map((g) => ({ key: g.id, data: { en: g.en, tn: g.tn } })),
    step: b.steps.map((s) => ({ key: String(s.n), data: { en: s.en, tn: s.tn } })),
    prompt: b.prompts.map((p) => ({ key: p.id, data: { en: p.en, tn: p.tn } })),
  };
}

const get = (o: any, path: string) => (path ? path.split('.').reduce((x, k) => (x == null ? undefined : x[k]), o) : o);
function setPath(o: any, path: string, v: any): any {
  if (!path) return v;
  const [k, ...rest] = path.split('.');
  return { ...(o ?? {}), [k]: rest.length ? setPath(o?.[k], rest.join('.'), v) : v };
}
const slug = (s: string) => (s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'item') + '-' + Math.random().toString(36).slice(2, 6);

type Entry = { key: string; builtIn?: any; row?: ContentRow };

export default function Content(_props: { role: AdminRole }) {
  const [type, setType] = useState<ContentType>('recipe');
  const [rows, setRows] = useState<ContentRow[] | null>(null);
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');
  const [limit, setLimit] = useState(40);
  const [editing, setEditing] = useState<{ key: string; isNew: boolean } | null>(null);
  const BI = useMemo(builtIns, []);
  const cfg = CONFIG[type];
  const load = () => listContent().then(setRows).catch((e) => setErr(e.message));
  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    setEditing(null);
    setQ('');
    setLimit(40);
  }, [type]);

  const entries: Entry[] = useMemo(() => {
    const mine = (rows ?? []).filter((r) => r.type === type);
    const out: Entry[] = BI[type].map((b) => ({ key: b.key, builtIn: b.data, row: mine.find((r) => r.item_key === b.key) }));
    for (const r of mine) if (!out.some((e) => e.key === r.item_key)) out.push({ key: r.item_key, row: r });
    return out;
  }, [rows, type, BI]);

  if (!rows) return err ? <ErrorNote error={err} /> : <p className="loading">Loading…</p>;

  const dataOf = (e: Entry) => (e.row && e.row.status !== 'hidden' ? e.row.data : e.builtIn ?? e.row?.data);
  const needle = q.trim().toLowerCase();
  const shown = entries.filter((e) => !needle || JSON.stringify(dataOf(e)).toLowerCase().includes(needle) || (type === 'quote' && dayLabel(Number(e.key)).toLowerCase().includes(needle)));
  const counts = TYPES.reduce((acc, t) => ({ ...acc, [t]: rows.filter((r) => r.type === t && !r.tn_reviewed && r.status === 'published').length }), {} as Record<ContentType, number>);

  if (editing) {
    const e = entries.find((x) => x.key === editing.key);
    return (
      <Editor
        type={type}
        cfg={cfg}
        itemKey={editing.key}
        isNew={editing.isNew}
        builtIn={e?.builtIn}
        row={e?.row}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          load();
        }}
      />
    );
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>App content</h1>
          <p className="sub">Edit what people see in the app, in English and Setswana. Published changes reach phones the next time the app is opened.</p>
        </div>
        {cfg.canAdd ? <Button onClick={() => setEditing({ key: '__new__', isNew: true })}>+ Add new</Button> : null}
      </div>
      <div className="tabs" role="tablist">
        {TYPES.map((t) => (
          <button key={t} role="tab" aria-selected={type === t} className={`tab ${type === t ? 'on' : ''}`} onClick={() => setType(t)}>
            {CONFIG[t].label}
            {counts[t] ? <span className="count" title="Published without a Setswana check">{counts[t]}</span> : null}
          </button>
        ))}
      </div>
      <ErrorNote error={err} />
      <input className="search" placeholder={type === 'quote' ? 'Search quotes, or type a date like "25 Dec"' : `Search ${cfg.label.toLowerCase()}`} value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
      {shown.length === 0 ? <Empty>Nothing found.</Empty> : null}
      <div className="stack tight">
        {shown.slice(0, limit).map((e) => {
          const d = dataOf(e);
          const st = e.row?.status;
          return (
            <button key={e.key} className="item" onClick={() => setEditing({ key: e.key, isNew: false })}>
              <div className="item-main">
                {type === 'quote' || type === 'step' ? <div className="item-k">{type === 'quote' ? dayLabel(Number(e.key)) : `Step ${e.key}`}</div> : null}
                <div className="item-title">{(type === 'recipe' ? `${d?.emoji ?? ''} ` : '') + (cfg.title(d) || '(no English yet)')}</div>
                <div className="item-tn">{cfg.titleTn(d) || (cfg.tnOptional?.(d) ? <span className="muted">English only (shown in the English app)</span> : <span className="warn">No Setswana yet</span>)}</div>
              </div>
              <div className="badges">
                {type === 'recipe' ? <Badge tone="grey">{d?.set === 'global' ? 'English app' : 'Setswana app'}</Badge> : null}
                {!e.builtIn ? <Badge tone="navy">New</Badge> : null}
                {st === 'published' && e.builtIn ? <Badge tone="green">Edited</Badge> : null}
                {st === 'published' && !e.builtIn ? <Badge tone="green">Published</Badge> : null}
                {st === 'draft' ? <Badge tone="orange">Draft</Badge> : null}
                {st === 'hidden' ? <Badge tone="red">Hidden</Badge> : null}
                {e.row && st !== 'hidden' && !e.row.tn_reviewed && !(cfg.tnOptional?.(d)) ? <Badge tone="pink">Setswana not checked</Badge> : null}
              </div>
            </button>
          );
        })}
      </div>
      {shown.length > limit ? (
        <Button kind="outline" onClick={() => setLimit(limit + 60)}>
          Show more ({shown.length - limit} left)
        </Button>
      ) : null}
    </div>
  );
}

function Editor({ type, cfg, itemKey, isNew, builtIn, row, onClose, onSaved }: { type: ContentType; cfg: Config; itemKey: string; isNew: boolean; builtIn?: any; row?: ContentRow; onClose: () => void; onSaved: () => void }) {
  const start = row && row.status !== 'hidden' ? row.data : builtIn ?? cfg.blank();
  const [d, setD] = useState<any>(() => JSON.parse(JSON.stringify(start)));
  const [reviewed, setReviewed] = useState(row?.tn_reviewed ?? false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const tnOptional = cfg.tnOptional?.(d) ?? false;

  const save = async (status: 'published' | 'draft' | 'hidden') => {
    setErr('');
    if (status === 'published' && !cfg.clean(type === 'quote' || type === 'step' ? itemKey : 'check', d)) {
      setErr(
        tnOptional
          ? 'Please fill in the English name and steps before publishing.'
          : 'Please fill in both English and Setswana (at least the name or text, and the steps or paragraphs) before publishing. The Setswana app must never show English.',
      );
      return;
    }
    setBusy(true);
    try {
      // New items get a readable key from their English name, for example "seswaa-k3f9".
      const key = isNew ? slug(cfg.title(d) || cfg.one) : itemKey;
      await saveContent({ type, item_key: key, data: d, status, tn_reviewed: reviewed, sort_order: row?.sort_order ?? null });
      onSaved();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const restore = async () => {
    if (!window.confirm(builtIn ? 'Go back to the original built-in version?' : 'Delete this item?')) return;
    try {
      await restoreContent(type, itemKey);
      onSaved();
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  const input = (f: Field, path: string) => {
    const v = get(d, path);
    const set = (val: any) => setD((prev: any) => setPath(prev, path, val));
    const id = `f-${path}`;
    if (f.kind === 'select')
      return (
        <select id={id} value={v ?? ''} onChange={(e) => set(e.target.value)}>
          {f.options!.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    if (f.kind === 'number') return <input id={id} type="number" value={v ?? ''} onChange={(e) => set(Number(e.target.value))} />;
    if (f.kind === 'lines')
      return <textarea id={id} rows={Math.max(4, (v?.length ?? 0) + 1)} value={(v ?? []).join('\n')} onChange={(e) => set(e.target.value.split('\n'))} onBlur={(e) => set(e.target.value.split('\n').map((x) => x.trim()).filter(Boolean))} />;
    if (f.kind === 'long') return <textarea id={id} rows={3} value={v ?? ''} onChange={(e) => set(e.target.value)} />;
    return <input id={id} value={v ?? ''} onChange={(e) => set(e.target.value)} />;
  };
  const langPath = (lng: 'en' | 'tn', f: Field) => (f.path ? `${lng}.${f.path}` : lng);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <button className="link" onClick={onClose}>← Back to {cfg.label.toLowerCase()}</button>
          <h1>{isNew ? `New ${cfg.one}` : cfg.title(d) || cfg.one}</h1>
          <p className="sub">
            {builtIn ? 'Built-in item. ' : ''}
            {isNew ? 'New item. It reaches the app once you publish it.' : row ? `Last changed ${fmtDateTime(row.updated_at)}. Status: ${row.status}.` : 'Not changed yet: this is the version in the app.'}
          </p>
        </div>
      </div>

      {cfg.shared.length ? (
        <Card title="Details">
          <div className="form grid">
            {cfg.shared.map((f) => (
              <label key={f.path} htmlFor={`f-${f.path}`}>
                {f.label}
                {input(f, f.path)}
                {f.hint ? <span className="hint">{f.hint}</span> : null}
              </label>
            ))}
          </div>
        </Card>
      ) : null}

      <div className="bilingual">
        {(['en', 'tn'] as const).map((lng) => (
          <Card key={lng} title={lng === 'en' ? 'English' : 'Setswana'} sub={lng === 'tn' && tnOptional ? 'Optional: this recipe only shows in the English app.' : undefined}>
            <div className="form">
              {cfg.lang.map((f) => (
                <label key={f.path} htmlFor={`f-${langPath(lng, f)}`}>
                  {f.label}
                  {input(f, langPath(lng, f))}
                </label>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <label className="check big">
          <input type="checkbox" checked={reviewed} onChange={(e) => setReviewed(e.target.checked)} />
          A fluent Setswana speaker has checked the Setswana wording
        </label>
        {type === 'activity' || type === 'step' || type === 'guide' || type === 'resource' ? (
          <p className="note">This is recovery and safety guidance. Ask your clinical lead to read changes before publishing.</p>
        ) : null}
        <ErrorNote error={err} />
        <div className="row" style={{ marginTop: 12 }}>
          <Button kind="green" onClick={() => save('published')} disabled={busy}>Publish to the app</Button>
          <Button kind="outline" onClick={() => save('draft')} disabled={busy}>Save as draft</Button>
          {cfg.canHide && (builtIn || row?.status === 'published') && row?.status !== 'hidden' ? <Button kind="ghost" onClick={() => save('hidden')} disabled={busy}>Hide from the app</Button> : null}
          {row ? <Button kind="ghost" onClick={restore} disabled={busy}>{builtIn ? 'Restore original' : 'Delete'}</Button> : null}
          <Button kind="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </Card>
    </div>
  );
}
