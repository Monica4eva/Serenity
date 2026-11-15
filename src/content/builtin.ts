// All content that ships inside the app, gathered in one place. The admin dashboard shows this
// as the starting point; edits made there are merged on top (see remote.ts).
import en from '../locales/en.ts';
import tn from '../locales/tn.ts';
import { ACTIVITIES } from './activities.ts';
import { QUOTES_EN, QUOTES_TN } from './quotes.ts';
import { RECIPES, RECIPES_GLOBAL } from './recipes.ts';
import { RESOURCES } from '../lib/resources.ts';
import type { BuiltIn } from './remote.ts';

export const BUILT_IN: BuiltIn = {
  recipesBotswana: RECIPES,
  recipesGlobal: RECIPES_GLOBAL,
  activities: ACTIVITIES,
  resources: RESOURCES,
  guideEn: en.care.guide,
  guideTn: tn.care.guide,
  stepTextsEn: en.ui.stepTexts,
  stepTextsTn: tn.ui.stepTexts,
  stepQsEn: en.ui.stepQs,
  stepQsTn: tn.ui.stepQs,
  promptsEn: [en.journal.p1, en.journal.p2, en.journal.p3, en.journal.p4],
  promptsTn: [tn.journal.p1, tn.journal.p2, tn.journal.p3, tn.journal.p4],
  quotesEn: QUOTES_EN,
  quotesTn: QUOTES_TN,
};
