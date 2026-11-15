# Serenity Admin dashboard

A separate website for the Serenity team. It connects to the **same Supabase database** as the app,
so it sees the same counsellors, emergency numbers and totals. It lives in the `admin` folder.

**What admins can do:** edit the app's content in English and Setswana (recipes, activities,
daily quotes, resources hub, family guide, 12-Step reflections, journal ideas), check and verify counsellors, edit emergency numbers and helplines, see
anonymous impact totals, manage the admin team, and read the admin activity log.

**What admins can never do:** read anyone's journal, check-ins, messages, care plans, session
notes or personal details. The database refuses it, and groups under 10 people are hidden.

## Roles

| Role | Can do |
|---|---|
| Admin | Everything, including adding admins and reading the activity log |
| Clinician | Edit app content, check counsellors, edit emergency numbers, see totals |
| Editor | Edit app content and see totals |

Every admin needs an **authenticator app** on their phone (Google Authenticator, Microsoft
Authenticator or Authy). The dashboard asks them to set it up the first time they sign in.

## 1. Try it with sample data (no setup)

In the VS Code terminal:
```
cd admin
npm install
npm run dev
```
Open the link it prints (usually http://localhost:5173). You will see sample data and a yellow note.
Press Ctrl + C to stop.

## 2. Connect it to Supabase

1. In the Supabase **SQL Editor**, run `supabase/migrations/20261117000000_admin.sql`, then
   `supabase/migrations/20261118000000_content.sql` (after the other three migration files).
2. Make yourself the first admin. You need a Serenity account first (sign up in the app). Then run
   this in the SQL Editor, with your own email and name:
   ```sql
   insert into public.admins (user_id, role, display_name)
   select id, 'admin', 'Monica' from auth.users where email = 'you@example.com';
   ```
3. In the `admin` folder, copy `.env.example` to a new file called `.env` and paste in the **same**
   Supabase URL and **anon public** key the app uses. Never use the service_role key.
4. Run `npm run dev` again and sign in. Scan the QR code with your authenticator app and type the
   6-digit code. You are in.

After that, add the rest of the team from **Admin team** in the dashboard (they need a Serenity
account with that email first).

## Editing app content

Open **App content** and pick a tab: Recipes, Activities, Daily quotes, Resources hub, Family guide,
12 Steps or Journal ideas. Click any item to edit it. English and Setswana sit side by side.

- **Publish to the app** makes the change live. Phones pick it up the next time the app is opened
  (and every 10 minutes while it is open). It also works offline after the first download.
- **Save as draft** keeps your work without showing it in the app.
- **Hide from the app** removes an item without deleting it. **Restore original** undoes your edits.
- **+ Add new** creates a new recipe, activity, resource, guide article or journal idea.
- Publishing needs both English and Setswana, so the Setswana app never shows English. The only
  exception is "global" recipes, which only appear in the English app.
- Tick **"A fluent Setswana speaker has checked the Setswana wording"** once someone has reviewed it.
  Items published without this tick are counted in pink on the tab, so nothing is forgotten.
- Activities, steps, guides and resources are recovery guidance: ask your clinical lead to read
  changes before publishing.

## 3. Put it online

```
cd admin
npm run build
```
This creates the folder `admin/dist`. The easiest way to host it:

1. Go to **app.netlify.com/drop** (free account).
2. Drag the `admin/dist` folder onto the page.
3. Netlify gives you a link such as `serenity-admin.netlify.app`. Share it only with your team.

To update it later, run `npm run build` again and drag the new `dist` folder onto your site's
**Deploys** page in Netlify.

The keys in `.env` are built into the website. That is safe: it is the public anon key, and the
database itself checks that the person is an admin with the second step before showing anything.
