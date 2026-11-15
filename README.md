# Project Serenity (mobile app)

A recovery and wellbeing companion for Android and iOS, built with React Native and Expo (SDK 58, Expo Router).
Initial market: Botswana. Languages: English, Setswana (draft).

> Project Serenity is a support tool and not a substitute for professional medical or mental-health care.
> Green, Amber and Red are support prompts, not diagnoses.

## Run it on your phone (fastest)

1. Install Node.js 20 or newer on your computer.
2. In this folder run:
   ```bash
   npm install --legacy-peer-deps
   npx expo start
   ```
3. Install **Expo Go** on your Android phone or iPhone and scan the QR code.

## Build an installable app (APK / iOS)

```bash
npm install -g eas-cli
eas login            # free Expo account
eas build:configure
eas build -p android --profile preview   # gives you an .apk to install directly
eas build -p ios                          # needs an Apple Developer account
```

## Without the app stores (web app and download page)

See **DOWNLOAD.md**. `npx expo export -p web` then `eas deploy --prod` publishes the installable web app (iPhone: Safari, Share, Add to Home Screen) and a download page at `/download` with the Android APK link, iPhone steps and a QR code.

## Online backup (Supabase)

See **SUPABASE_SETUP.md**. Without a `.env` file the app runs local-only, exactly as before. With your Supabase keys in `.env`, accounts, sync across phones, password reset and account deletion switch on. Journal entries are encrypted on the phone before upload.

Google, Apple and Facebook sign-in and all security settings: see **SECURITY.md**.

## Tests

```bash
npm run test:db   # 68 database checks: schema, Row Level Security, security hardening, sync round trip
npm test          # 61 unit tests: early-warning engine, Serenity Guide chat, encryption, PIN rules, content
npm run typecheck
```

## What is built (Phases A to D, plus early parts of E to G)

| Area | Status |
|---|---|
| Design system, 4-tab nav with raised centre logo button | Done |
| i18n (every string in `src/locales`), Setswana draft with English fallback | Done, Setswana needs native + clinical review |
| Accessibility: screen-reader labels, 48dp targets, text up to 200%, dyslexia mode (Atkinson Hyperlegible, cream background, spacing), high contrast, dark mode, voice-first read-aloud, text-to-speech, simpler prompts | Done |
| Onboarding: welcome carousel, language, account, consent (unticked, optional data consent, timestamped and versioned), Terms/Privacy tabs with TTS, login, 11-question "getting to know you" incl. six-month vision, baseline assessment, 16-question "stable version of me", support network + contact form (+267 default, emergency permission, message preview, 90-day re-confirm), approach, goals (max 3) | Done |
| Mock-up fixes: "You are in control" card, "Log in" button, step order, typos, day names from the real date | Done |
| Today: greeting, day counter + milestones, gentle relapse flow, journal stats, adaptive Today's Focus, goal progress | Done |
| HALT check-in with personalised tips, mood log, journal calendar, prompts, daily rhythm, 8-step daily flow, activities | Done |
| Early-warning engine (own-baseline, hard day vs pattern vs safety concern, missed check-ins never escalate, reasons stored), Balance Check | Done |
| Crisis hub (before login, while locked, offline), craving plan with 10-min urge timer, emotional pathways, emergency screen, medical-danger guidance, location sharing only on confirmation, safety-event log | Done |
| Crisis and low-mood language detection (English + draft Setswana), gentle optional follow-up, "doesn't apply" feedback | Done, word lists need clinical review |
| Triggers map (PPT + internal), Eight Dimensions, Health screen with honest score + manual logs + trends, Insight patterns + shareable summary | Done |
| App lock (PIN + biometrics, auto-lock), quick exit, screenshot blocking, consent toggles, export, delete all | Done |

## Screens matched to the UI designer's mock-ups

Every screen in the designer's first batch is rebuilt to match the mock-ups, using shared
design components in `src/components/ds.tsx` (colours, pill buttons, cards, step dots,
segmented tabs, selects, option cards).

| Design | Route |
| --- | --- |
| Welcome, Choose Your Language, Create Account, Welcome Back | `/onboarding/welcome`, `language`, `account`, `login` |
| Privacy & Consent, Terms of Use & Privacy Policy, Accessibility & Appearance | `/onboarding/consent`, `terms`, `appearance` |
| Your Recovery Profile & Goals (Step 4 of 4) | `/onboarding/profile` |
| My Recovery Details, Goals, Approach, Support Network, Add a Support Contact | `/onboarding/details`, `goals`, `approach`, `network`, `contact` |
| Recovery Baseline Assessment (pages 1 to 3) | `/onboarding/baseline?page=1..3` |
| Today, Health & Well-being | tabs `/` and `/health` |
| HALT Daily Check-In, Journal, Mood editor | `/halt`, `/journal`, `/mood` |
| Sleep & Activity Tracking, Log my day | `/sleep`, `/log` |
| 12-Step Programme, one step | `/steps`, `/steps/[n]` |
| Milestones | `/milestones` |
| HELP NOW, My Safety Plan | `/help`, `/safety-plan` |
| Profile menu, My Profile, Connected Devices | `/profile`, `/my-profile`, `/devices` |
| Recovery Support Agreement | `/agreement` |
| Meetings, Notifications | `/meetings`, `/notifications` |

Deliberate differences from the mock-ups (for safety, accuracy or copyright):
- Day names always come from the real date (13 November 2026 is a Friday).
- HALT questions are worded so "Yes" always means the feeling is present.
- The 12 Steps are written in our own words; official texts need a licence.
- Help Now says "Your counsellor" rather than "24/7 support" until a verified 24/7 line exists.
- Sleep stages (Deep, Light, REM) need a wearable, so a note is shown instead of invented data.
- The emergency contact box starts unticked; the app may only contact someone with permission.
- Today's Focus has the designer's eight items and ticks them automatically from real activity.

## Serenity Guide (chat companion)

Open it from the centre logo menu, Help Now ("Talk it through with Serenity Guide") or the Support tab.
Logic: `src/lib/companion.ts` (pure, tested in `tests/companion.test.ts`). Screen: `src/app/companion.tsx`.
Words: `src/locales/en.companion.ts` and `tn.companion.ts`.

- Follows the specialist's 8 steps: check-in, validate, ground, re-assess, maintain, plan,
  safety escalation, and review after a slip. One question at a time; the person can always
  skip, pause, say "I just need to talk" (back to Step 2), or tap "Talk to a person".
- Uses the response rules ("if they say X, respond with Y, lead to Z") for cravings, a slip,
  feeling like a failure, "I can't do this anymore", "why bother", deleting a dealer's number,
  and "I'm fine".
- Rule-based, not a generative AI: every line is pre-written and reviewed, so it never
  diagnoses, gives medication advice, describes using, or makes promises. It works offline
  in English and Setswana.
- Safety first: a crisis phrase at any point, an urge of 8 or more, or a rising urge goes to
  the safety questions. A "yes" hands off to a person (call counsellor, emergency numbers,
  message a supporter, Help Now) and pauses everything until the person confirms they are safe.
  Typing alone cannot end that pause. A risk answer is logged as a safety event and a Red level,
  so the centre logo turns red.
- The chat itself is not saved. Only the check-in answers are saved (urge, plan, review, what
  is helping), and the earliest warning sign from a slip review is added to the relapse
  prevention plan.
- Needs review by the clinical lead and a Setswana-speaking counsellor before launch.

## The escalation button (centre Serenity logo)

The logo in the bottom bar is the escalation button. Rules and point weights are in `LOGO_RULES` in `src/lib/engine.ts` for the clinical lead to review.

| Button | Meaning | When | Tap opens |
|---|---|---|---|
| Blue (navy) circle, white logo | All okay | Fewer than 2 points | Quick actions |
| Orange, "!" badge | Attention | 2 to 3 points | Check-in, Serenity Guide, urge surfing, call or message their psychologist |
| Pink, heart badge, slow pulse | Concern: signs building up | 4 points | The same, with the psychologist first |
| Bright red, phone badge, pulse | Intervention | 5+ points, crisis language in anything they wrote or said in the chat, a Red level, or a relapse in the last 24 hours | Call the psychologist now, emergency numbers |

Points come from the last 48 hours of the person's own data: strong cravings or craving words (2), opening "I'm not safe" (3), an Amber balance check (2), Today's Focus missed 2 days (2) or 3+ days (3), and 1 each for a missed appointment, heavy HALT answers, low-mood writing (journal, check-ins or chat), repeated stressed moods, short sleep and a low wellbeing score. The same sign counts at most twice.

**"I'm alright now"** (on the screen the button opens): the person answers two safety questions ("Are you safe right now?" and "Is anyone at risk of harm?"). If both answers are safe, every sign up to that moment is cleared and the button goes back to blue. Any new sign after that counts again. The answer is logged as a safety event for the support team. Answering "not safe" opens emergency help. In the Serenity Guide chat, confirming safety after a hand-off does the same.

- Missed tasks alone never turn the button red unless `redFromMissedTasksAlone` is switched on (clinical sign-off needed).
- The badge and the screen-reader label mean the state never depends on colour alone. The pulse stops if the phone's "reduce motion" setting is on.

## New in this version

- **365 daily quotes** (original, English and Setswana) on Today: `src/content/quotes.ts`.
- **Recovery Activities**: 19 guided activities with step-by-step instructions, a reason each helps, suggestions based on today's check-ins, and a "How do you feel now?" check at the end: `src/content/activities.ts`.
- **Urge surfing timer** (`/urge`): rate the urge, choose 5, 10 or 20 minutes, a breathing wave and a new prompt each minute, then rate it again.
- **Recovery recipes**: in Setswana, 23 familiar Botswana dishes (mabele, morogo, dinawa, dikgobe...); in English, 22 well-known international dishes (overnight oats, shakshuka, lentil dal, chilli con carne, stir-fry...): `src/content/recipes.ts`.
- **Voice notes** in the journal (microphone button). Recordings stay on the phone and are never uploaded.
- **Resources hub** (`/resources`): online AA, NA, SMART Recovery, Gamblers Anonymous and Al-Anon meetings, AA Botswana, BOSASNet, Lifeline Botswana and other helplines. Checked November 2026: `src/lib/resources.ts`.
- **No question is mandatory**: every question can be skipped or answered in a few words.
- **Animated celebrations** on Today and Milestones (still when "reduce motion" is on).

## Care team: counsellors, therapists, family and friends

One app, three roles. After choosing a language, people pick **How will you use Serenity?**:
for my own recovery, I am a counsellor or therapist, or I support someone I care about.

**Linking:** the person in recovery opens *My care team* (Support tab, Profile or Today), taps
*Invite*, chooses what that person may see, and gets a one-time 10-character code (valid 7 days).
The counsellor or supporter enters it under *Connect with a code*. Only a hash of the code is
stored; guessing is blocked after 10 tries an hour. The person can change permissions or *Stop
sharing* at any time, which removes everything shared with that link.

| | Counsellor / therapist | Family and friends |
|---|---|---|
| Alerts | Button colour and reasons; phone alert on pink and red | "Needs help now" and phone alert on red only, no details |
| Status | Full 14-day trends: mood, cravings, sleep, wellbeing, goals, slips | Simple status only: doing okay / could use support |
| Journal | Only entries the person taps *Share* on | Never |
| Plans | Writes a care plan the person can read (goals, next session, homework) | |
| Notes | Private session notes, only the author can read them | |
| Messages | Two-way | Encouragement templates and own messages |
| For them | Professional details (shown as not verified) | Guidance articles (EN and TN), self-care check, Al-Anon and helplines |

Privacy design: viewers never read the person's own tables. The person's phone builds one
filtered summary per link (`src/lib/summary.ts`, tested) and uploads only that.
Files: `supabase/migrations/20261116000000_care_team.sql`, `supabase/functions/notify-care-team`,
`src/lib/care.ts`, `src/lib/summary.ts`, `src/app/care/*`, `src/app/pro/*`, `src/app/supporter/*`,
`src/app/connect.tsx`, `src/app/onboarding/role.tsx`, `src/locales/en.care.ts` and `tn.care.ts`.

Without the online service the counsellor and supporter screens show clearly marked sample
people, so the team can test everything. Phone alerts need an installed build (EAS), not Expo Go
on Android and not the web version.

## Admin dashboard (separate website)

The `admin` folder is a separate website for the Serenity team, connected to the same Supabase
database: impact totals (anonymous, groups under 10 hidden), checking and verifying counsellors
(suspending one removes their access to every client straight away), emergency numbers and
helplines, editable app content in English and Setswana (recipes, activities, daily quotes,
resources hub, family guide, 12-Step reflections, journal ideas: edit, add, hide, restore; the app
merges published edits over its built-in content and keeps a copy for offline use), the admin team
(roles: admin, clinician, editor) and an activity log that cannot be
deleted. Admins must use an authenticator app. Admins can never read journals, check-ins,
messages or notes. Setup and hosting: see **ADMIN_SETUP.md**.

## Languages

English and Setswana. Every English string has a Setswana version in `src/locales/tn.ts`. The app will not build if one is missing, and `npm test` checks that names and numbers in each sentence match. Day and month names are in Setswana too. **The Setswana must be reviewed by fluent speakers and a clinician before launch, especially the crisis wording.** Read-aloud uses a Setswana voice only if the phone has one.

## Animation

Gentle motion in `src/components/Motion.tsx`: a swaying seedling on the day counter, a confetti burst on milestone days (1, 7, 14, 30, 60, 90, 180, 365; tap to replay), cards easing in on Today, progress bars and the wellbeing ring filling up, ticks popping when tasks are done, and a guided breathing circle (breathing activity, craving and emergency screens). Everything stops when the phone's Reduce motion setting is on; the breathing words and count still guide the person.

## Appearance

Settings > Appearance: Light, Dark, or Match my phone (the default).

## Logo and icons

`assets/logo-mark.png` and `assets/logo-wordmark.png` were cut from a screenshot of the logo. The app icon, Android icons and splash screen are made from them. For the sharpest result, send the original logo file (PNG or SVG) and regenerate.

## Not yet built (needs your decisions or a full device build)

- **Backend extras**: phone (SMS) login, automatic SMS alerts, clinician dashboard. (Google, Apple and Facebook sign-in are built; switch them on with SECURITY.md.)
- Voice-note recording and transcription.
- **Apple Health / Health Connect** (needs a development build, not Expo Go).
- **Push notifications** (discreet wording is already set as the default).
- Facilities directory, meeting finder, clinician portal, admin portal. (The rule-based Serenity Guide chat is built; a free-text AI is not.)
- Emergency numbers are seeded in `src/lib/store.tsx` (997, 999, 998, 16658, 14655) and flagged **unverified**. Confirm them with a local clinical partner before launch.
- Terms and Privacy text is a placeholder for a lawyer to complete.
- Alert thresholds are in `RULES` in `src/lib/engine.ts` for clinical sign-off.

## Project layout

```
src/app/            screens (Expo Router: one file per screen)
  onboarding/       welcome, language, account, consent, terms, login, intro, baseline, extended, network, contact, approach, goals
  (tabs)/           Today, Health, Support, Insight
src/components/     accessible UI kit, question flow, safety prompt, charts, logo
src/lib/            engine (alert rules), store (offline data), i18n, theme, security
src/locales/        en.ts, tn.ts
tests/              engine unit tests
```
