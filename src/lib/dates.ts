// Date helpers. Day and month names come from the translation files (English and
// Setswana) and are always generated from the real date. (Fixes the mock-up error:
// 13 November 2026 is a Friday.)
import en from '../locales/en';
import tn from '../locales/tn';

type Lang = 'en' | 'tn';
export const dateNames = (lang: Lang = 'en') => (lang === 'tn' ? tn.dates : en.dates);

export const dayKey = (d: Date = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const daysBetween = (fromISO: string, to: Date = new Date()) => {
  const a = new Date(fromISO);
  const start = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
  return Math.max(0, Math.round((end - start) / 86400000));
};

const pad = (n: number) => String(n).padStart(2, '0');

/** e.g. "Friday, 13 November 2026" / "Labotlhano, 13 Ngwanatsele 2026" */
export const formatLong = (d: Date, lang: Lang = 'en') =>
  `${dateNames(lang).days[d.getDay()]}, ${d.getDate()} ${dateNames(lang).months[d.getMonth()]} ${d.getFullYear()}`;

/** 24-hour time, e.g. "23:33" */
export const formatTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

export const formatDateTime = (d: Date, lang: Lang = 'en') => `${d.getDate()} ${dateNames(lang).monthsShort[d.getMonth()]} ${d.getFullYear()}, ${formatTime(d)}`;

export const weekdayShort = (d: Date, lang: Lang = 'en') => dateNames(lang).daysShort[d.getDay()];
export const weekdayLong = (d: Date, lang: Lang = 'en') => dateNames(lang).days[d.getDay()];
export const monthYear = (d: Date, lang: Lang = 'en') => `${dateNames(lang).months[d.getMonth()]} ${d.getFullYear()}`;
export const dayMonthShort = (d: Date, lang: Lang = 'en') => `${d.getDate()} ${dateNames(lang).monthsShort[d.getMonth()]}`;
export const dayMonthLong = (d: Date, lang: Lang = 'en') => `${dateNames(lang).days[d.getDay()]}, ${d.getDate()} ${dateNames(lang).months[d.getMonth()]}`;

export const startOfWeek = (d: Date) => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = (x.getDay() + 6) % 7; // Monday = 0
  x.setDate(x.getDate() - diff);
  return x;
};

export const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

export const timeOfDay = (d: Date = new Date()) => {
  const h = d.getHours();
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
};

export const MILESTONES = [1, 7, 14, 30, 60, 90, 180, 365];
