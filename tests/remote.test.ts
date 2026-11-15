import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BUILT_IN } from '../src/content/builtin.ts';
import { cleanActivity, cleanRecipe, cleanResource, mergeContent, type RemoteItem } from '../src/content/remote.ts';

const base = mergeContent(BUILT_IN, []);

test('with no edits the app shows exactly the built-in content', () => {
  assert.equal(base.recipesBotswana.length, BUILT_IN.recipesBotswana.length);
  assert.equal(base.recipesGlobal.length, BUILT_IN.recipesGlobal.length);
  assert.equal(base.activities.length, BUILT_IN.activities.length);
  assert.equal(base.steps.length, 12);
  assert.equal(base.prompts.length, 4);
  assert.equal(base.guide.length, BUILT_IN.guideEn.length);
  assert.equal(base.resources.flatMap((g) => g.items).length, BUILT_IN.resources.flatMap((g) => g.items).length);
  // every built-in item has Setswana where the Setswana app shows it
  for (const a of base.activities) assert.ok(a.tn.title && a.tn.steps.length, a.id);
  for (const r of base.recipesBotswana) assert.ok(r.tn?.title, r.id);
  for (const s of base.steps) assert.ok(s.tn.text, String(s.n));
  for (const g of base.guide) assert.ok(g.tn.t && g.tn.body.length, g.id);
});

const act = BUILT_IN.activities[0];
const edits: RemoteItem[] = [
  { type: 'activity', item_key: act.id, status: 'published', data: { ...act, en: { ...act.en, title: 'Edited title' } } },
  { type: 'activity', item_key: BUILT_IN.activities[1].id, status: 'hidden', data: {} },
  { type: 'activity', item_key: 'newone', status: 'published', data: { icon: 'leaf-outline', cat: 'move', mins: 5, en: { title: 'New', why: 'w', steps: ['a'] }, tn: { title: 'Ntšhwa', why: 'w', steps: ['a'] } } },
  { type: 'activity', item_key: 'draftone', status: 'draft', data: { en: { title: 'Draft', steps: ['a'] }, tn: { title: 'D', steps: ['a'] } } },
  { type: 'quote', item_key: '1', status: 'published', data: { en: 'New year quote', tn: 'Lefoko la ngwaga o mošwa' } },
  { type: 'step', item_key: '3', status: 'published', data: { en: { text: 'Step three, edited', qs: ['Q1'] }, tn: { text: 'Kgato ya boraro', qs: ['P1'] } } },
  { type: 'recipe', item_key: 'seswaa', status: 'published', data: { set: 'botswana', emoji: '🍖', mins: 120, serves: 6, tag: 'dinner', en: { title: 'Seswaa', why: 'w', ingredients: ['beef'], steps: ['boil'] }, tn: { title: 'Seswaa', why: 'w', ingredients: ['nama'], steps: ['bela'] } } },
];

test('edits replace, add, hide, and drafts stay out of the app', () => {
  const m = mergeContent(BUILT_IN, edits);
  assert.equal(m.activities[0].en.title, 'Edited title');
  assert.ok(!m.activities.some((a) => a.id === BUILT_IN.activities[1].id), 'hidden item removed');
  assert.ok(m.activities.some((a) => a.id === 'newone'), 'new item added');
  assert.ok(!m.activities.some((a) => a.id === 'draftone'), 'draft not shown');
  assert.equal(m.quotes[1].tn, 'Lefoko la ngwaga o mošwa');
  assert.equal(m.steps[2].en.text, 'Step three, edited');
  assert.equal(m.steps.length, 12);
  assert.ok(m.recipesBotswana.some((r) => r.id === 'seswaa'));
  assert.ok(!m.recipesGlobal.some((r) => r.id === 'seswaa'));
});

test('broken or unsafe items are ignored, not shown', () => {
  assert.equal(cleanActivity('x', { en: { title: 'Only English', steps: ['a'] } }), null, 'Setswana is required');
  assert.equal(cleanRecipe('x', { set: 'botswana', en: { title: 'T', steps: ['s'] } }), null, 'Botswana recipes need Setswana');
  assert.ok(cleanRecipe('x', { set: 'global', en: { title: 'T', steps: ['s'] } }), 'global recipes can be English only');
  const bad = cleanActivity('x', { link: 'javascript:alert(1)', en: { title: 'a', steps: ['b'] }, tn: { title: 'a', steps: ['b'] } });
  assert.equal(bad?.link, undefined, 'unsafe links are dropped');
  const r = cleanResource('x', { name: 'N', en: 'e', tn: 't', url: 'http://not-secure.example', phones: ['+267 71 234', 'call me'] });
  assert.equal(r?.url, undefined, 'only https links');
  assert.deepEqual(r?.phones, ['+267 71 234']);
  const m = mergeContent(BUILT_IN, [{ type: 'activity', item_key: act.id, status: 'published', data: 'garbage' }]);
  assert.equal(m.activities[0].en.title, act.en.title, 'a broken edit falls back to the built-in item');
});
