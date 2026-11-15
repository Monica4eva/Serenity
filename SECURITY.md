# Project Serenity: sign-in and security

This guide switches on **Google, Apple and Facebook sign-in** and the security settings in
Supabase. The app code is already done; these are the steps that need your accounts.

Replace `YOUR-REF` below with your Supabase project reference (the part before
`.supabase.co` in your project URL).

The address every provider must send people back to (the "callback") is:

```
https://YOUR-REF.supabase.co/auth/v1/callback
```

---

## 1. Tell Supabase where the app lives (do this first)

Supabase dashboard → **Authentication → URL Configuration**

- **Site URL:** `serenity://auth-callback`
- **Redirect URLs** (add each one):
  - `serenity://auth-callback` (the installed app / APK)
  - `exp://**` (Expo Go while testing)
  - `http://localhost:8081/**` (the browser preview on your laptop)

---

## 2. Google

1. Go to <https://console.cloud.google.com> and create a project called **Project Serenity**.
2. **APIs & Services → OAuth consent screen** (Google Auth Platform → Branding):
   - User type **External**, app name **Project Serenity**, your support email, the app logo.
   - Scopes: `openid`, `email`, `profile` only.
   - Add your privacy policy link when you have it online.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**
   - Application type: **Web application** (yes, web, even for the phone app: Supabase does the sign-in).
   - **Authorised redirect URIs:** `https://YOUR-REF.supabase.co/auth/v1/callback`
4. Copy the **Client ID** and **Client secret**.
5. Supabase → **Authentication → Sign In / Providers → Google** → switch on, paste both, **Save**.
6. While the Google app is in "Testing", only the test users you add can sign in.
   Click **Publish app** when you are ready for everyone.

## 3. Facebook

1. Go to <https://developers.facebook.com> → **My Apps → Create App**.
   Use case: **Authenticate and request data from users with Facebook Login**.
2. **Facebook Login → Settings → Valid OAuth Redirect URIs:**
   `https://YOUR-REF.supabase.co/auth/v1/callback`
3. **Use cases → Customise → Permissions:** make sure `email` and `public_profile` are added.
4. **App settings → Basic:** copy the **App ID** and **App secret**. Fill in the privacy policy
   URL, the data deletion instructions URL and the app icon (Facebook requires these to go Live).
5. Supabase → **Authentication → Sign In / Providers → Facebook** → switch on, paste the
   App ID (as Client ID) and App secret, **Save**.
6. Switch the Facebook app from **Development** to **Live**. Until then only people with a
   role on the app can sign in.

## 4. Apple

Needs a paid **Apple Developer** account (USD 99 a year). Apple requires "Sign in with Apple"
on iPhone whenever Google or Facebook sign-in is offered, so you need this before an App Store release.

1. <https://developer.apple.com/account> → **Certificates, Identifiers & Profiles → Identifiers**
   - Open (or create) the **App ID** `bw.serenity.app` and tick **Sign in with Apple**.
   - Create a **Services ID**, for example `bw.serenity.app.signin`. Tick **Sign in with Apple** →
     **Configure**: primary App ID `bw.serenity.app`, domain `YOUR-REF.supabase.co`,
     return URL `https://YOUR-REF.supabase.co/auth/v1/callback`.
2. **Keys → +** → tick **Sign in with Apple** → download the `.p8` key file (you can only
   download it once; keep it safe, never put it in the app). Note the **Key ID** and your **Team ID**.
3. Supabase → **Authentication → Sign In / Providers → Apple** → switch on:
   - **Client IDs:** `bw.serenity.app.signin` (and `bw.serenity.app` for a future native iPhone build)
   - **Secret Key:** use the generator linked on that Supabase page with your Team ID, Key ID,
     Services ID and `.p8` file.
4. **Set a calendar reminder:** Apple secret keys expire after 6 months. Generate a new one
   before then or Apple sign-in stops working.

## 5. In the app

In your `.env` file:

```
EXPO_PUBLIC_AUTH_PROVIDERS=google,apple,facebook
```

Remove a name from that line to show "coming soon" for that button until it is set up.
Then restart with `npx expo start -c` (the `-c` clears the old settings), and make a new APK
for phones (`eas build -p android --profile preview`).

How it works: the button opens Google, Apple or Facebook's own page in a secure browser
window (Chrome Custom Tabs on Android). The app never sees the person's Google, Apple or
Facebook password. Supabase returns a one-time code to `serenity://auth-callback`, and the app
swaps it for a session using **PKCE**, so an intercepted code is useless. New people then read
and accept the Terms and Privacy & Consent screens, the same as email sign-up.

---

## 6. Database security (run once)

Supabase dashboard → **SQL Editor** → paste and run, in order:

1. `supabase/migrations/20261114000000_init.sql` (if you have not run it yet)
2. `supabase/migrations/20261115000000_security.sql` (new)

Or with the Supabase CLI: `npx supabase db push`.

What the new security migration does:

| Protection | What it means |
| --- | --- |
| No anonymous access | Someone who is not signed in cannot read or write any personal table, even if a rule is written wrongly later |
| Forced Row Level Security | Every person can only ever see and change their own rows |
| Consents are append-only | A consent record cannot be edited or deleted, only a new one added |
| Safety events are write-only | The app can log them but cannot read them back; only the restricted review team can |
| Audit log hidden | People cannot read the audit trail |
| Size limits | Oversized or abusive data is refused (names, notes, check-ins, journal) |
| Write limit | More than 1,000 changes a minute to one table (300 safety events) from one person is refused, so a stolen login cannot flood the database |
| Safer functions | Database functions run with an empty search path |
| Google names | Sign-up with Google, Apple or Facebook fills the person's first name |

Already in place from before: the journal is end-to-end encrypted (the server only stores
scrambled text), login tokens on the phone are encrypted, and the delete-account function only
lets a person delete themselves.

After running it: Supabase → **Advisors → Security Advisor** → it should show no errors.

## 7. Supabase settings to switch on (dashboard)

**Authentication → Sign In / Providers → Email**
- **Confirm email:** on
- **Secure email change:** on
- **Minimum password length:** `10`
- **Password requirements:** letters and digits (the app asks for the same)
- **Leaked password protection:** on (Pro plan: blocks passwords found in data breaches)

**Authentication → Sessions**
- **Detect and revoke compromised refresh tokens:** on
- Pro plan: consider an inactivity timeout of 30 days

**Authentication → Rate Limits:** keep the defaults.

**Edge Functions:** deploy the delete-account function:
`npx supabase functions deploy delete-account`

**Database → Backups:** on the Pro plan, switch on Point in Time Recovery.

---

## 8. On the phone (already built into the app)

- All app data saved on the phone is **encrypted**, with the key kept in the phone's secure
  hardware store (Android Keystore / iPhone Keychain).
- Android **backups are switched off** for the app, so health data cannot leave the phone in a backup.
- **App lock PIN:** salted and stretched (15,000 rounds of SHA-512). After 5 wrong tries the
  person waits 30 seconds, doubling each time up to 15 minutes. Old PINs upgrade automatically.
  Help Now still works when the app is locked.
- Passwords need at least 10 characters with letters and a number.
- Optional: block screenshots and a discreet app name (Settings → Privacy & Data).

## 9. Keys: what goes where

| Key | Where it goes | Never put it |
| --- | --- | --- |
| Supabase URL and publishable (anon) key | `.env` in the app (safe to be in the app) | |
| Supabase service_role / secret key | Nowhere you type it. Edge Functions get it automatically | In the app, `.env`, GitHub, chat |
| Google client secret, Facebook app secret, Apple `.p8` key | Only in the Supabase dashboard | In the app, `.env`, GitHub, chat |
| Expo access token | Only in the terminal when you build; delete it after | In files, GitHub, chat |

If a secret was ever shared by mistake, rotate it (make a new one and delete the old one).

## 10. Still to decide before launch

- **Privacy policy and terms online:** Google, Facebook and Apple all need a public link.
- **Data protection:** confirm with a legal adviser how the Botswana Data Protection Act applies,
  including where the Supabase servers are, and record the person's consent (the app already
  stores versioned consents).
- **Two-step sign-in (MFA)** for staff who review safety events: switch on TOTP in
  Authentication → Multi-Factor.
- **CAPTCHA** on sign-up (Authentication → Attack Protection) if you see fake sign-ups. The app
  would need a small update to show it.
