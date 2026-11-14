# Famille Cisse — the family tree app (hand-coded)

> **Maintaining or taking over this app? Read [`HANDOVER.md`](HANDOVER.md)
> first** — the full handover & maintenance guide (Part A for the family,
> Part B for a future developer: data model, migration discipline, the
> tree-layout rules and why they exist, deploy + verification procedure).

A self-contained static web app: no build step, no framework, no CDN.
Open it, and the family's tree is there — pre-filled with the 9 people
Bengaly entered in v1. Everything talks to the data through one small
adapter interface (`data.js`), so the same front-end runs in two modes:

- **Practice mode (default):** data lives in the visitor's own browser
  (localStorage). Good for trying the app, showing Django, testing flows.
  Each device has its own copy — entries do **not** sync between people.
- **Live mode (go-live):** data lives in one shared Supabase database.
  Everyone with the link sees and grows the same tree. This is the mode
  for the family group chats.

## Files

| File | What it is |
|---|---|
| `index.html` | The page shell. Loads everything else. |
| `styles.css` | All styling (warm palette, print rules). |
| `config.js` | **The one switch**: local vs Supabase + the Supabase keys. |
| `countries.js` | Country codes, flags (emoji), localized names via `Intl`. |
| `i18n.js` | Every interface string in English and French. |
| `data.js` | Data model, the v1 seed, `LocalAdapter`, adapter factory. |
| `family.js` | Pure relationship logic: parents/children/siblings/cousins, duplicate-name detection, generations. |
| `supabase-adapter.js` | `SupabaseAdapter` — same interface, backed by Supabase REST + Storage. |
| `app.js` | The UI: tree, people, profiles, forms, voice notes, suggestions, personality traits. |
| `supabase/schema.sql` | Everything the database needs, incl. the seed. |
| `supabase/traits-migration.sql` | The `person_traits` table — run once in the SQL editor, after `schema.sql`. |
| `supabase/partner-status-migration.sql` | Adds `relationships.status` (current/former partner) — run once in the SQL editor, after `schema.sql`. The app works without it; only the "mark as divorced" toggle needs it. |

## Run it locally (practice mode)

```bash
cd ~/workspace/family-tree/app
python3 -m http.server 8765
# open http://localhost:8765
```

## Go-live steps (one free Supabase account, ~10 minutes)

1. **Create the account/project.** Go to supabase.com → sign up (free,
   no card) → *New project*. Name it e.g. `famille-cisse`. Pick a region
   near most of the family (e.g. EU West / Paris). Set a database
   password and keep it somewhere safe (the app never uses it).
2. **Create the tables.** In the project: *SQL Editor → New query* →
   paste all of `supabase/schema.sql` → *Run*. This creates the tables,
   the `photos` and `voice` storage buckets, security policies, and the
   family's starting tree (the same 9 people — it will not duplicate if
   run twice). Then run `supabase/traits-migration.sql` the same way —
   it adds the `person_traits` table for the personality qualities.
   Finally run `supabase/partner-status-migration.sql` — it adds the
   partner status column (divorced/separated marking).
3. **Copy the keys.** *Project Settings → API*: copy the **Project URL**
   and the **anon public key** (never the `service_role` key).
4. **Flip the switch.** Edit `config.js`:
   ```js
   window.FC_CONFIG = {
     backend: "supabase",
     supabaseUrl: "https://YOUR-PROJECT.supabase.co",
     supabaseAnonKey: "YOUR-ANON-KEY"
   };
   ```
5. **Host the folder.** The app is static files — any static host works:
   - *GitHub Pages:* put this folder in a repo → Settings → Pages →
     serve from the branch. (Bengaly already uses GitHub Pages for
     bengalycisse.com.)
   - Or Netlify / Vercel drag-and-drop of the folder.
6. **Smoke-test before sharing** (first live session): open the link,
   confirm the 9 seed people are in the tree; add a test person; add a
   photo; record a voice note; open the link on a second phone and
   confirm the same tree appears; delete the test person (Keeper mode).
   Then drop the link in the family group chats.
7. **Custom domain (later).** Once `famille-cisse.com` or
   `famillecisse.org` is purchased: point it at the static host (the
   host's "custom domain" setting + the DNS records it gives you). The
   app itself needs no change.

### Moving practice-mode data to live mode

The starting tree is identical in both modes (it's in the SQL seed), so
nothing is lost by going live fresh. Anything extra added in practice
mode lives only in that browser: use **People → Export the tree** there
to keep a JSON copy. Import into the shared database is deliberately
disabled in the app (an open link + wipe-and-replace is too risky);
if a practice copy ever holds real data the family needs, hand the JSON
to whoever runs the project — it maps 1:1 onto the tables.

## How the house rules work in the app

- **Your name** is asked once (kept on the device) and stamped on
  everything you add — that's the attribution.
- **Nobody overwrites anybody.** Editing is offered only for your own
  entries and in **Keeper mode** (People tab, bottom). Everyone else
  uses **Suggest an edit** (typed or voice) — the suggestion sits on the
  profile, with the suggester's name, until the entry's creator or the
  keeper accepts it.
- **A passing reported twice** becomes a suggested edit on the existing
  memorial instead of a second memorial.
- **Personality qualities** are picked, never typed: each profile has a
  fixed palette of positive or funny traits (Funny, Calm, Kind…). One
  tap adds yours with your name; the chip shows how many people picked
  it, and tapping it shows who. You can take back your own pick; the
  keeper can remove any pick.
- **Keeper mode** is a simple toggle (honor system — there are no
  accounts in v1). The future family PIN is what closes this properly.
- **Export** (People tab) downloads the whole tree as JSON — the family
  owns the data, independent of any host or database.

## Known limitations (v1, accepted)

- No accounts / no PIN yet (designed for; the adapter and schema leave
  room — RLS policies are marked "open v1" and are the thing to tighten).
- No Bambara interface (EN/FR only); voice notes are the bridge.
- No offline mode: pages are tiny and cache-friendly, but adding needs a
  connection.
- Practice mode stores photos/voice in the browser, which has a small
  quota (~5 MB) — photos are downscaled to 480 px to stretch it; live
  mode stores them in Supabase Storage instead.
- No duplicate-merge tool: the picker + "did you mean…?" proposals
  prevent most duplicates; the keeper deletes a true duplicate manually.
- The Supabase adapter is implemented but was **not** exercised
  end-to-end before go-live (it needs the account from step 1) — that's
  what the step-6 smoke test is for.
