import en from '../locales/en';
import tn from '../locales/tn';

export type Lang = 'en' | 'tn';
const tables: Record<Lang, any> = { en, tn };

function lookup(table: any, key: string): any {
  return key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), table);
}

/** Translate a dotted key. Falls back to English, then to the key itself. */
export function translate(lang: Lang, key: string, vars?: Record<string, string | number>): any {
  let v = lookup(tables[lang], key);
  if (v === undefined) v = lookup(en, key);
  if (v === undefined) return key;
  if (typeof v === 'string' && vars) {
    return v.replace(/\{\{(\w+)\}\}/g, (_, k) => (vars[k] !== undefined ? String(vars[k]) : ''));
  }
  return v;
}
