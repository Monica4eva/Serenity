# Connecting Project Serenity to Supabase

About 20 minutes. You only do this once. Until you finish, the app keeps working with everything saved on the phone only.

## 1. Create the project

1. Go to **supabase.com**, sign up (free) and click **New project**.
2. Name: `project-serenity`.
3. **Database password**: create a strong one and save it in a password manager.
4. **Region**: Supabase has no African region. Pick a **Europe** region (London or Frankfurt are closest to Botswana). Note your choice: the Privacy Policy must say where data is stored (Botswana Data Protection Act, cross-border transfer).
5. Click **Create new project** and wait a minute or two.

## 2. Create the database tables

1. In the left menu open **SQL Editor** and click **New query**.
2. Open `supabase/migrations/20261114000000_init.sql` from this project in VS Code, select everything (Ctrl + A), copy, and paste it into the SQL Editor.
3. Click **Run**. You should see "Success. No rows returned".
4. Do the same with `supabase/migrations/20261115000000_security.sql` (security hardening).
5. Then the same with `supabase/migrations/20261116000000_care_team.sql` (counsellors, family and friends). Run the three files in this order.
6. Check: **Table Editor** now lists tables such as `profiles`, `checkins`, `journal_entries` and `emergency_numbers` (with 5 rows).

## 3. Sign-in settings

**Authentication > Sign In / Providers > Email**
- Keep **Email** switched on.
- **Confirm email**: keep ON for real users. For your own testing you can switch it off so you can log in straight away. Switch it back on before the pilot.

**Authentication > URL Configuration**
- Site URL: `serenity://auth-callback`, and add the redirect URLs listed in **SECURITY.md**.

Google, Apple and Facebook sign-in: follow **SECURITY.md** step by step.
Phone (SMS) login for +267 numbers needs an SMS provider such as Twilio and is not built yet.

## 4. Put the keys in the app

1. In Supabase open **Project Settings > API** (it may be called **Data API** or **API Keys**).
2. Copy the **Project URL** and the **publishable** key (older projects call it the **anon public** key).
   - Never copy the **service_role / secret** key into the app. It bypasses every security rule.
3. In VS Code, in the `serenity` folder, make a copy of `.env.example` and name it `.env`.
4. Paste your values:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
   EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxx
   ```
5. Restart the app: press **Ctrl + C** in the terminal, then run `npx expo start --clear`.

`.env` is listed in `.gitignore`, so it will not be uploaded to GitHub.

## 5. Delete-account function (needed for "Delete my account")

In the VS Code terminal, inside `serenity`:
```
npx supabase login
npx supabase link --project-ref YOUR-PROJECT-REF
npx supabase functions deploy delete-account
npx supabase functions deploy notify-care-team
```
`notify-care-team` sends the discreet phone alerts to counsellors (pink and red) and supporters (red only).
Your project ref is the part before `.supabase.co` in the Project URL.

## 6. Check it works

1. In the app, create a new account (if you were already set up locally, use **Settings > Delete my account and all data** first, or log out).
2. Do a HALT check-in.
3. In Supabase **Table Editor > checkins** you should see the row. In **journal_entries** you will only see scrambled text in `ciphertext`: that is the encryption working.
4. **Settings > Online backup** in the app should say "Backed up".

## What is protected, and how

| Data | Protection |
|---|---|
| Every personal table | Row Level Security: a person can only read and change their own rows. Tested in `supabase/tests/schema.test.mjs` (`npm run test:db`). |
| Journal text | Encrypted on the phone (XSalsa20-Poly1305) before upload. The server, and anyone with database access, sees only ciphertext. |
| Consents | Append-only: can be added, never edited or deleted. Version and time stored. |
| Safety events | Write-only from the app. Only the restricted review process (service role) can read them. |
| Login session on the phone | Encrypted, with the key held in the phone's secure store. |
| App PIN | Never leaves the phone. |
| Delete account | Removes the login and every row of data (cascade). |
| Sensitive changes | Written to `audit_log` (contacts, consents, safety events, journal deletes). |

### Journal recovery key

Because the journal is encrypted with a key that only the phone holds, a person who moves to a new phone must enter their **recovery key** (Settings > Journal recovery key) to read old entries. Everything else (check-ins, contacts, goals and so on) comes back automatically on login. Encourage pilot users to save their key. A later version can add password-based key backup.

## Managing emergency numbers and facilities

Edit them in **Table Editor > emergency_numbers** and **facilities**. The app downloads emergency numbers on start-up, even before login. Set `verified` to `true` only after a local clinical partner has confirmed each number.

## Before launch (still to do)

- Legal review of cross-border storage (Europe) under the Botswana Data Protection Act, and list Supabase as a processor in the Privacy Policy.
- Turn on **Leaked password protection** and set a strong minimum password length in Authentication settings.
- Turn on Point-in-Time Recovery / backups (paid plans).
- Automatic SMS alerts to emergency contacts and the psychologist: an Edge Function plus an SMS provider, sending only to contacts with emergency permission.
- Clinician dashboard: a separate, consent-based access table and policies.
