import en from '../locales/en.ts';
import tn from '../locales/tn.ts';

export type Lang = 'en' | 'tn';
const tables: Record<Lang, any> = { en, tn };

function lookup(table: any, key: string): any {
  return key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), table);
}

/** Translate a dotted key. Falls back to English, then to the key itself. */
export function translate(lang: Lang, key: string, vars?: Record<string, string | number>): any {
  // Singular wording when the count is exactly 1 ("1 day", "letsatsi le le 1").
  let v = vars && Number(vars.n) === 1 ? lookup(tables[lang], `${key}_one`) : undefined;
  if (v === undefined) v = lookup(tables[lang], key);
  if (v === undefined) v = lookup(en, key);
  if (v === undefined) return key;
  if (typeof v === 'string' && vars) {
    return v.replace(/\{\{(\w+)\}\}/g, (_, k) => (vars[k] !== undefined ? String(vars[k]) : ''));
  }
  return v;
}
