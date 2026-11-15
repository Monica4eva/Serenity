import { test } from 'node:test';
import assert from 'node:assert/strict';
import { QUOTES_EN, QUOTES_TN, dayOfYear, quoteFor } from '../src/content/quotes.ts';
import { RECIPES, RECIPES_GLOBAL, recipesFor } from '../src/content/recipes.ts';
import { ACTIVITIES } from '../src/content/activities.ts';

test('365 daily quotes in English and Setswana, all different, no em dashes', () => {
  assert.equal(QUOTES_EN.length, 365);
  assert.equal(QUOTES_TN.length, 365);
  assert.equal(new Set(QUOTES_EN).size, 365);
  for (const q of [...QUOTES_EN, ...QUOTES_TN]) assert.ok(q.length > 5 && !q.includes('—'));
  assert.ok(!QUOTES_EN.some((q) => /\baddict\b|rock bottom/i.test(q)));
});

test('a different quote every day of the year', () => {
  assert.equal(dayOfYear(new Date(2026, 0, 1)), 0);
  assert.equal(dayOfYear(new Date(2026, 11, 31)), 364);
  assert.notEqual(quoteFor(new Date(2026, 10, 14), 'en'), quoteFor(new Date(2026, 10, 15), 'en'));
});

test('at least 20 Botswana recipes, complete in Setswana', () => {
  assert.ok(RECIPES.length >= 20);
  for (const r of RECIPES) {
    assert.ok(r.tn && r.tn.title && r.tn.why);
    assert.equal(r.en.ingredients.length, r.tn!.ingredients.length, r.id);
    assert.equal(r.en.steps.length, r.tn!.steps.length, r.id);
  }
});

test('at least 20 international recipes; Setswana shows local dishes, English shows global ones', () => {
  assert.ok(RECIPES_GLOBAL.length >= 20);
  assert.equal(recipesFor('tn'), RECIPES);
  assert.equal(recipesFor('en'), RECIPES_GLOBAL);
  const ids = new Set([...RECIPES, ...RECIPES_GLOBAL].map((r) => r.id));
  assert.equal(ids.size, RECIPES.length + RECIPES_GLOBAL.length);
  for (const r of RECIPES_GLOBAL) assert.ok(!JSON.stringify(r).includes('—'));
});

test('guided activities have steps in both languages', () => {
  assert.ok(ACTIVITIES.length >= 15);
  for (const a of ACTIVITIES) assert.equal(a.en.steps.length, a.tn.steps.length, a.id);
});

import { translate } from '../src/lib/i18n.ts';
test('counts read correctly at 1 in both languages', () => {
  assert.equal(translate('en', 'ui.inRecoveryDays', { n: 1 }), 'In Recovery - 1 Day');
  assert.equal(translate('en', 'ui.inRecoveryDays', { n: 5 }), 'In Recovery - 5 Days');
  assert.equal(translate('tn', 'ui.inRecoveryDays', { n: 1 }), 'Mo go Foleng - Letsatsi le le 1');
  assert.equal(translate('tn', 'ui.inRecoveryDays', { n: 5 }), 'Mo go Foleng - Malatsi a le 5');
  assert.equal(translate('en', 'ui.entriesN', { n: 1 }), '1 entry');
  assert.equal(translate('tn', 'health.minutes', { n: 1 }), 'Motsotso o le 1');
});
