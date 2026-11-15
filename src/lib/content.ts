// Content from the admin dashboard, merged over the built-in content.
//  * Works offline: the last download is kept on the phone.
//  * Without a backend, or before the first download, the built-in content is used.
//  * Public content only (recipes, activities, quotes, resources, guides): no login needed.
import { useEffect, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { BUILT_IN } from '../content/builtin';
import { mergeContent, type MergedContent, type RemoteItem } from '../content/remote';
import { dayOfYear, quoteFor } from '../content/quotes';
import type { Recipe } from '../content/recipes';

const KEY = 'serenity:content:v1';
let merged: MergedContent = mergeContent(BUILT_IN, []);
let lastFetch = 0;
const listeners = new Set<() => void>();

function set(items: RemoteItem[]) {
  merged = mergeContent(BUILT_IN, items);
  listeners.forEach((l) => l());
}

export async function loadCachedContent() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) set(JSON.parse(raw));
  } catch {}
}

export async function refreshContent(force = false) {
  if (!supabase || (!force && Date.now() - lastFetch < 10 * 60000)) return;
  lastFetch = Date.now();
  const { data, error } = await supabase.from('content_items').select('type, item_key, data, status, sort_order').in('status', ['published', 'hidden']);
  if (error || !data) return;
  set(data as RemoteItem[]);
  AsyncStorage.setItem(KEY, JSON.stringify(data)).catch(() => {});
}

export function useContent(): MergedContent {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => merged,
    () => merged,
  );
}

/** Mount once: loads the saved copy, then checks for updates on start and when the app returns. */
export function ContentLoader() {
  useEffect(() => {
    loadCachedContent().then(() => refreshContent(true));
    const sub = AppState.addEventListener('change', (s) => s === 'active' && refreshContent());
    return () => sub.remove();
  }, []);
  return null;
}

// ---------- helpers used by screens ----------
export const recipesFor = (c: MergedContent, lang: 'en' | 'tn'): Recipe[] => (lang === 'tn' ? c.recipesBotswana : c.recipesGlobal);
export const findRecipe = (c: MergedContent, id: string) => c.recipesBotswana.find((r) => r.id === id) ?? c.recipesGlobal.find((r) => r.id === id);
export const todaysQuote = (c: MergedContent, lang: 'en' | 'tn', d = new Date()) => c.quotes[dayOfYear(d) + 1]?.[lang] || quoteFor(d, lang);
