# Famille Cisse — Handover & Maintenance Guide

**The one link: https://bengalycisse.com/famille**

Written November 14, 2026, by Muse (Bengaly's assistant) with Bengaly Cisse,
for whoever keeps this family archive after us — Bengaly himself in a few
years, Django, another family keeper, or a developer hired to maintain it.

Read this document before you change anything. It has two parts:

- **Part A — For the family** (non-technical): what the app is, where
  everything lives, the rules that must never be broken, how to do everyday
  things, and what to do if something breaks.
- **Part B — For a future developer** (technical): the stack, the data
  model, the migration discipline, the tree-layout algorithm and why it is
  built the way it is, how to deploy, and how to verify your work.

A longer construction diary — every build session, every test result, every
bug and its fix — lives in `app-build-report.md`, next to the app's source
files. This guide is the distilled version; the report is the evidence.

---

# Part A — For the family

## A1. What this is

Famille Cisse is our family's shared family tree. It exists because family
knowledge dies with people: when an elder passes, the names, the places,
the marriages and the stories they carried go with them. This app is the
family writing it down together, while everyone is still here to ask.

There is exactly **one link**:

**https://bengalycisse.com/famille**

Anyone who opens that link sees the same tree and can add to it — a cousin
in Bamako, an aunt in Dakar, family in France, in the US, in Canada. There
are no accounts and no passwords for the app itself. The tree arrived
pre-filled with the first people Bengaly entered; by the afternoon of its
first day it already held 17 people, and it keeps growing by the family's
own hand.

The app speaks **French first** (a first-time visitor is greeted in
French; anyone can switch to English with one tap, and their own phone
remembers their choice). Everything is designed for the family's elders
first — big buttons, plain words, very few steps — including relatives in
Mali on inexpensive phones with slow connections.

## A2. The database is the jewel — the website is its window

If you remember one thing, remember this:

**The family data lives in a database (Supabase). The website at
bengalycisse.com/famille is only a window into it.**

- If the website ever breaks, disappears, or needs to move, **nothing is
  lost** as long as the database is intact. A developer can rebuild the
  window — the code is saved in full (see A3) — and point it at the same
  database.
- If the database were lost, the website alone would be an empty shell.
  So the database is what you protect, back up, and never experiment on.

The keeper's backup habit (do this a few times a year — it takes one
minute): open the link → **People** tab → **Export the tree**. The app
downloads a file with the whole tree in it (people, family links,
suggestions, personality qualities). Keep that file somewhere safe — email
it to yourself, keep a copy in a cloud drive. Photos and voice notes
themselves live in the database's storage (see Part B), so an export is a
backup of the family's *information*; combined with the database, the
family owns everything outright.

## A3. Where everything lives

| Thing | Where it is |
|---|---|
| The app (what the family opens) | https://bengalycisse.com/famille |
| The family data (the jewel) | Supabase project **famille-cisse**, under Bengaly's account (see A4). Region: Paris (West EU). Free plan. |
| The website's code | GitHub repository **Bengalize/bengalize.github.io**, folder **famille/** — the same repository also holds Bengaly's portfolio website at its root. The tree app is only the `famille/` folder; the rest of the repo is not part of it. |
| The working source copy + construction diary | `~/workspace/family-tree/app/` (the code) and `~/workspace/family-tree/app-build-report.md` (the diary), in Bengaly's files. |
| This guide | In the repo folder (`famille/HANDOVER.md`), in Bengaly's files (`famille-cisse-handover.md` / `.pdf`), and in his email (sent to his second mailbox the day it was written). |

Nothing about this app depends on a paid subscription. Supabase is on its
free plan (no card was ever entered) and GitHub Pages hosting is free. If
either company changes its free terms one day, the export file + the code
+ this guide are everything a developer needs to move the archive
elsewhere.

## A4. The accounts — and how to sign into each

**No passwords are written in this document, ever.** Passwords live in
Bengaly's Secure Vault / password manager. What you need to know is *which
door* each account uses:

- **GitHub — account name `Bengalize`.** This is the master key. It owns
  the website's code repository. Sign in at github.com with Bengaly's
  GitHub login (kept in his vault).
- **Supabase — sign in with GitHub.** At supabase.com, choose
  **"Continue with GitHub"** and use the same `Bengalize` account. The
  project **famille-cisse** sits in the free organization
  "Bengalize's Org". There is no separate Supabase password in real use —
  an email/password login was saved in the vault on setup day but was
  never used; the GitHub door is the real one.
- **The database password** (a separate thing Supabase asks for when a
  project is created) was auto-generated on setup day and deliberately
  never written down. The app never uses it. If a future developer ever
  needs it, reset it from inside Supabase: Project Settings → Database →
  Reset password. Nothing breaks when you reset it.
- **The domain bengalycisse.com** is registered at **Squarespace**, in
  Bengaly's own Squarespace account, and its DNS points at GitHub Pages.
  It renews in August 2027 with auto-renew on. Keep that registration
  alive — the family's link depends on it.
- **Bengaly's email** (where this guide was also sent) is
  cissebengaly02@gmail.com, with cissebengaly02@hotmail.fr as his second
  mailbox.

If you are a future keeper and Bengaly hands you this archive, the handover
you need from him is: access to the GitHub account (or the repository
transferred to yours), and the domain registration kept alive. Everything
else follows from those two.

## A5. The domain names — the full situation

The app's name is **Famille Cisse**, but the family does not own
famillecisse.com. The honest state of play, as of November 14, 2026:

- **bengalycisse.com/famille** — the live address today. It works, it is
  free, and it is the link to share until a family domain is bought.
- **famillecisse.com** — owned by someone else: registered March 20, 2026
  at GoDaddy (paid through 2031), and it hosts a real, active website with
  the same name ("Famille Cisse — Supporting Families, Building Bonds"),
  apparently another family's or association's project, in good faith. On
  November 14, 2026, Bengaly wrote to them through their own contact form
  — respectfully, explaining our archive, asking whether they would
  consider selling or transferring the name and at what price, offering no
  price first. Their site promised a reply within 48 hours. **If you are
  reading this later: check Bengaly's Gmail for their answer before doing
  anything else about domains.**
- **famillecisse.fr** — verified **available** on November 14, 2026
  (French registry + registrar cross-check), and cheap: about $8.49 for
  the first year at OVH, $8.59/year after. One catch: French rules require
  a **.fr registrant to be based in the European Union**. Bengaly lives in
  the US, so the clean paths are a France-based relative registering it,
  or a registrar that offers a local-presence (trustee) service.
- **famille-cisse.com** and **famillecisse.org** — verified **available**
  on November 14, 2026, ordinary price (about $20/year), no residency
  rules. Bengaly's lean at the time: the Mali extension (.ml) intrigued
  him most, with .org as the fallback — but **famillecisse.ml's
  availability was never verified** (the registry never answered), so
  check it at purchase time before counting on it.

Rules for domains: any purchase is made **by Bengaly's own hand at
checkout** — nobody buys domains on his behalf. Once a family domain is
bought, attaching it is a small developer task (Part B, section B9): point
it at GitHub Pages, and the app needs no changes at all. The old
bengalycisse.com/famille link can keep working as a doorway to the new
address.

## A6. The inviolable rules

These were decided by Bengaly and Django on November 14, 2026, while the
app was being built and tested by the family itself. A future keeper or
developer may improve the app, but these rules are the family's, and they
do not change without the family:

1. **French first.** The app greets every first-time visitor in French.
   (A person's own language choice, once made, is remembered on their
   device.)
2. **Elders are the benchmark.** Every flow must be usable by Django's
   generation — including relatives in Mali on cheap phones. Big tap
   targets, plain words in both languages, the fewest possible steps. If
   a flow confuses an elder, you simplify the flow — never blame the
   elder.
3. **Open contribution.** Anyone with the link can add people and family
   links directly. No accounts, no approval queue, no gatekeeper. This
   was chosen deliberately, over fancier options.
4. **Suggest, never overwrite.** You directly edit only what you added
   yourself (or anything, if you are the keeper). For someone else's
   entry, use **Suggest an edit** — typed or as a voice note. The
   suggestion waits on the profile, with your name on it, until the
   person who added the entry (or the keeper) accepts it. Nobody's work
   is silently replaced.
5. **No PIN yet — by design.** There is deliberately no lock on the link
   today, so the whole family can walk in. The design leaves room for a
   family PIN later if the family ever wants one. Until then, permissions
   run on the honor system and on the name each person gives when they
   add something (the app asks your name once and stamps it on your
   contributions).
6. **Names are never clipped.** A person's full name always shows in
   full, everywhere — tree, lists, everywhere. In this family a long name
   is a lineage, not a label.
7. **Every parent link draws.** A mother or father connects to their
   child in the tree whether or not they are linked to the other parent.
   Divorced and separated parents each stand beside their children. No
   parent is ever left floating because a marriage ended or was never
   recorded.
8. **Best effort is fine.** An entry does not have to be complete. A name
   and just a birth year is enough — the form says so, out loud. The
   family completes each other's entries over time.
9. **Personality qualities are picked, never typed.** Each profile has a
   fixed palette of positive or funny qualities (Funny, Kind, Great cook,
   Storyteller…). Nobody can write free text about a person there — the
   palette is the protection.

## A7. Everyday things — how to do them

Open the link. The tree opens fitted to your screen, elders at the top.
The zoom buttons are labeled in words ("＋ Zoom in", "⌂ Fit tree"), and
you can also pinch. Tap any person to open their profile.

- **Add a person.** Tap **Add a person**. The form asks for little: the
  name, woman or man, a photo if you have one. While you type the name,
  watch the **"Already in the tree"** line — if the person is already
  there, tap them instead of creating a double. Right on the same form,
  **Link to family** lets you say whose child, spouse, parent or sibling
  they are, so nobody is added unconnected. Then **Save**. Everything
  else (dates, places) can be added later — see rule 8.
- **Add a photo — and crop it.** When adding or editing a person, choose
  a photo; a crop screen opens: drag the photo to position it, use the
  zoom slider, then **Use this photo**.
- **Add family to someone.** Open their profile → **Add family** → pick
  the relation (father, mother, spouse, child, sibling — more kinds are
  under "More relations") → pick the person from the list (the list shows
  parents, year and place to tell same-name cousins apart), or create
  them on the spot.
- **Fix a wrong link.** Open a profile → **Fix a family link**. Every
  link that person has is listed in plain words ("Karim — brother of
  Fatou"), each with **Change** (pick what it should have been: child of,
  parent of, spouse of…) and **Remove** (removes only the link, never a
  person). One honest subtlety: sometimes two people *appear* as siblings
  not because anyone linked them, but because they share the same parent
  in the tree. The app will tell you when that's the case — then the fix
  is the parent link, not the sibling display.
- **Mark a divorce or separation.** When adding a spouse, tick
  **Divorced / separated**. For a couple already linked, open a profile:
  the person who recorded the link (or the keeper) can toggle **Mark as
  divorced / Mark as current spouse**. A former partner is drawn with a
  dashed grey line (no heart) and labeled "Former wife / Former husband"
  on the profile.
- **Remove a person.** Open their profile → **Remove this person** (only
  visible to whoever added them, or the keeper). A confirmation names the
  person and says plainly what goes with them — their photo, voice
  notes, qualities and all their family links. The people they were
  linked to stay. If you didn't add the person, you won't see this
  button; suggest an edit instead.
- **Record a passing.** Open the profile → **Record a passing**. Date and
  place use pickers (just the year is fine). The person moves to the
  **In Memory** view, their profile gets its memorial treatment, and on
  the Globe they become a star. If a passing is reported twice, the
  second report becomes a suggested edit on the existing memorial rather
  than a second memorial.
- **Find people with filters.** Each view (Tree, People, Globe) has a
  **Filter** button. You can filter by: the family of one person (their
  parents, children, partners, brothers & sisters, ancestors, or their
  whole branch of descendants), by place (living in a country, or born
  in a country), by generation, or living / in memory. One filter at a
  time; the active filter shows as a small label with the count — tap
  its ✕ to clear it. On the Tree, filtered-out people fade but stay in
  place, so you never lose the shape of the family.
- **The Globe.** The Globe view shows the living family on the Earth —
  one dot per country, with its flag and how many live there; tap a dot
  to see who. People are plotted where they live now (if no current
  country is recorded, their birth country stands in). Those who have
  passed are **stars in the sky** around the globe, listed by name under
  "In the stars" — tap a star or a name to open their profile.
- **Personality qualities.** On any profile, **Add a quality** opens the
  palette: tap the qualities that fit (tap yours again to take it back).
  Each quality chip on the profile shows how many people picked it; tap
  the chip to see who picked it. You can remove your own pick; the keeper
  can remove any pick.
- **Voice notes.** On a profile, **Add a voice note** lets you record a
  message — a memory, a correction, a story — in your own voice. This is
  how elders who prefer speaking to typing contribute, and how the family
  keeps voices, not just names.
- **Suggest an edit.** On someone else's profile, **Suggest an edit**:
  type the correction, or record it as a voice note. It appears on the
  profile as pending, with your name, until the entry's creator or the
  keeper accepts or dismisses it.
- **Follow someone's lines on the tree.** Tap a person's card once:
  their family lines light up green and everything else fades, so you
  can trace exactly who they connect to. Tap the same card again to
  open their profile.
- **Phone numbers and email.** The add/edit form asks for a phone
  number or an email — and it *requires* one only for a person whose
  birth year is known and makes them 20 or older (the family needs a
  way to reach its adults; children and people without a known birth
  year are never blocked). On a profile, the number appears with
  **Call** and **WhatsApp** buttons, and the email with a **Write**
  button — visible to anyone with the link, which the family ruled is
  fine. Nobody is ever shown as "missing" a number; if there is none,
  nothing appears.
- **Share on WhatsApp.** The tree has a **Share on WhatsApp** button,
  and every profile has one too: it opens WhatsApp with a ready-made
  message (in French) carrying the link — for a profile, a link that
  opens straight at that person. This is how the tree travels through
  the family's WhatsApp groups. When the link is pasted into a chat it
  shows a proper preview card with the family's tree picture.
- **Branches waiting to be connected.** Sometimes a family gets added
  before anyone knows how they join the main tree. They are NOT left
  floating and NO line is ever invented for them: they appear as their
  own little tree in a framed area under the main tree, labeled
  **"Branches waiting to be connected."** To connect one, open any
  person in the branch → **Connect this branch** → say how they join
  (child of, parent of, spouse of, sibling of) and tap the person in
  the main family. The moment the link is saved, the branch joins the
  main tree. The app may *suggest* a likely relative (same name or
  same place) — it only ever suggests; it never draws the line itself.
- **Family news (births, marriages…) — prepared, not yet sending.**
  The app quietly keeps a record of life events (someone added, a
  birth, a marriage, a divorce, a passing) as they happen, and the
  **People** tab has a **Family notifications** switch, off by default.
  Today the switch only arms a future step: nothing is sent anywhere
  yet. When the family later wants announcements in the WhatsApp
  group, this is the foundation they will be built on.
- **Keeper mode.** At the bottom of the **People** tab there is a Keeper
  mode toggle. The keeper (in practice, Bengaly, and whoever he trusts)
  can edit or remove anything, accept any suggestion, and fix any link.
  It is a simple toggle on the honor system — see rule 5.
- **Export a backup.** People tab → **Export the tree** downloads the
  whole tree as a file. Do it a few times a year (see A2).

## A8. If something breaks

Work down this list, calmly — the data is almost certainly fine:

1. **Refresh the page**, or open the link in another browser or on
   another phone. Most scares end here.
2. **Check the big platforms' status pages**: status.supabase.com and
   githubstatus.com. If either is having an incident, wait it out.
3. **If the page loads but the tree is empty or won't save**, the likely
   cause is the database side: sign into Supabase (with GitHub — see A4),
   open the **famille-cisse** project, and check it is active. Free
   projects can be paused after long inactivity; resuming the project
   from the dashboard brings everything back — pausing does not delete
   data.
4. **If the page itself won't load at all**, the hosting side is the
   suspect: the site is served by GitHub Pages from the repository in
   A3. A developer can confirm the repo and Pages settings in minutes.
5. **The nuclear option, which should never be needed**: a developer
   takes the code (repo, `famille/` folder), the database (still in
   Supabase), and this guide, and re-deploys the window. If the database
   itself were ever lost, the most recent **export file** (A2) can be
   re-imported by a developer — one more reason the export habit matters.
6. **Who to ask**: any competent web developer, handed Part B of this
   guide and the build report, has everything required. There is no
   vendor, no support contract, and no secret knowledge — that was the
   point of building it this way.

## A9. The honest limits (what the app does not do)

- **No offline mode.** Opening and saving need a connection. The pages
  are tiny and load fast on weak connections, but a fully offline village
  visit means adding people when you're back in coverage.
- **No accounts or PIN yet** (rule 5). Anyone with the link can add;
  editing follows the honor rules in rule 4. The family PIN is the
  designed-for next step if the family ever wants the door closed.
- **No Bambara interface.** French and English only, for now. Voice notes
  are the bridge for relatives more comfortable speaking.
- **No automatic merging of duplicates.** The "Already in the tree" check
  while typing prevents most doubles; a true duplicate, when it happens,
  is removed by the keeper by hand.
- **No undo and no edit history.** Removals are final — which is why
  removing a person asks twice and names what will go.

These are accepted limits, written down so nobody mistakes them for bugs.
The future-improvements list, in the family's order of importance, is in
Part B (B11).

---

# Part B — For a future developer

You are maintaining a small, deliberately boring codebase. Keep it that
way. Everything below describes the app as shipped on November 14, 2026
(go-live + polish + single-parent/divorced fix + link-manager/filters
pass + anchoring fix — the full history is in `app-build-report.md`).

## B1. Stack

- A **dependency-free static single-page app**: plain HTML, CSS and
  vanilla JavaScript. **No framework, no build step, no bundler, no CDN,
  no npm.** The files in the folder are the files served. Total ≈ 4,950
  lines.
- Hosting: **GitHub Pages**, from the GitHub repo
  `Bengalize/bengalize.github.io`, folder `famille/` (the repo root is
  Bengaly's portfolio — a different site; never touch it when working on
  this app).
- Backend: **Supabase** (Postgres + PostgREST + Storage), project
  `famille-cisse`, ref `pylobfhkefukhngrccxv`, region West EU (Paris),
  free plan.
- Design constraints that outrank your preferences: loads fast on cheap
  Android phones and weak connections (hence: no libraries, CSS-only
  animation using transforms/opacity, `prefers-reduced-motion` respected,
  photos downscaled to 480 px before storage).

## B2. File map

| File | Lines | Job |
|---|---|---|
| `index.html` | 30 | The shell. Loads the scripts in dependency order. |
| `styles.css` | 554 | All styling: warm cream/leaf/terracotta/gold palette, tree backdrop (layered canopy/parchment/soil gradients + vignette), drifting leaves, cards, modals, print stylesheet. |
| `config.js` | 19 | **The one switch** — `window.FC_CONFIG`: backend (`"local"` / `"supabase"`), Supabase project URL, anon key. Nothing else in the app knows where data lives. |
| `countries.js` | 67 | ISO country codes, emoji flags, names localized via the browser's `Intl.DisplayNames` (no downloads). Pinned five first: ML, FR, SN, US, CA. Also the lat/lon table the Globe plots (29 countries). |
| `i18n.js` | 532 | **Every** user-visible string, EN + FR, plus the trait palette (`TRAIT_KEYS`). Language state: default `fr` on first load; a saved `localStorage` preference wins. |
| `data.js` | 354 | The data model, the embedded v1 seed, the adapter interface (documented in the file's header comment), `LocalAdapter`, and the adapter factory + JSON export/import. |
| `family.js` | 305 | Pure relationship logic, no DOM: parents/children/partners, full & half siblings (derived + explicit), automatic cousins, generations with cycle hardening, duplicate-name detection, picker context lines. Unit-testable in plain Node. |
| `supabase-adapter.js` | 379 | `SupabaseAdapter`: the same interface over Supabase REST + Storage. snake_case ↔ camelCase mapping, partial-patch-safe updates, defensive writes (see B5). |
| `app.js` | 2,708 | The whole UI: views (Tree, People, Globe, In Memory, Recent), the tree layout engine, link manager, filters, forms, photo crop, traits UI, suggestions, voice notes, keeper mode. |
| `supabase/schema.sql` | — | **FROZEN.** The initial database: tables, buckets, RLS, seed. Already ran live. Never edit (see B5). |
| `supabase/traits-migration.sql` | — | Adds `person_traits`. Ran live 2026-11-14. |
| `supabase/partner-status-migration.sql` | — | Adds `relationships.status`. Ran live 2026-11-14. |
| `README.md` | — | Run-locally + go-live steps + house rules, in brief. |
| `HANDOVER.md` | — | This document. |

## B3. The data-adapter seam

The UI never talks to storage directly. It talks to one small async
interface (documented at the top of `data.js`):

```
loadTree()                    -> { people, relationships, suggestions, traits }
addPerson(person)             -> saved person (with id)
updatePerson(id, patch)       -> saved person
deletePerson(id)
addRelationship(rel)          -> saved relationship
updateRelationship(id, patch) -> saved relationship
deleteRelationship(id)
addSuggestion(suggestion)     -> saved suggestion
addTrait(trait)               -> saved trait (one pick)
removeTrait(id)
listTraits(personId)
replaceAll(data)              -> JSON import (local mode only — see below)
```

Two implementations exist behind the seam, selected once at boot from
`config.js`:

- **`LocalAdapter`** ("practice mode"): everything in the browser's
  localStorage (key `famillecisse.local.v1`), seeded from the embedded
  seed on first run. Per-device, nothing syncs. Photos are 480 px data
  URLs; voice notes are data URLs stored on the person record. This mode
  is for trying flows and for tests — **it is not the family's data**.
- **`SupabaseAdapter`** ("live mode", what production runs): PostgREST
  for rows, Storage for files. Photos go to the `photos` bucket and the
  person row keeps the public URL (`people.photo_url`); voice notes go
  to the `voice` bucket with a row in the `media` table.

Rules of the seam:

- **Import/replaceAll is deliberately disabled against the shared DB.**
  An open link + wipe-and-replace is too destructive. The app's Export
  button works in both modes (it's a read); if a practice-mode copy ever
  holds real data, hand its JSON to the project owner — it maps 1:1 onto
  the tables.
- **Keys.** The **anon key is public by design**: it ships inside
  `config.js`, in a public repo, on a public page. That is safe *because*
  the database's row-level-security policies are the actual boundary, and
  v1's boundary is intentionally open (see B4). The **`service_role` key
  must never appear** in the app, the repo, or any document — it bypasses
  RLS entirely. It was never used in this project. The Supabase database
  password is likewise unused by the app (see A4).
- Updates are **partial-patch-safe**: adapters merge patches instead of
  replacing rows, because several flows (accepting a suggestion, marking
  a passing) write one field at a time from stale screens.

## B4. Data model

Postgres tables (initial DDL in `supabase/schema.sql`, plus the two
migrations):

**people** — `id` uuid PK; `full_name`; `nickname`; `gender`
(`female`/`male`/`unknown`); `birth_date`, `death_date` — **jsonb partial
dates** `{"y":1977}` or `{"y":1977,"m":5,"d":4}` (a bare year is a
first-class value; the UI's date pickers produce exactly this shape and
never require a full date); `birth_place` (free text, city/village);
`birth_country`, `residence_country`, `death_country` — ISO alpha-2;
`memorial_note`; `notes`; `photo_url`; `passing_recorded_at`; `is_self`;
`created_by` (contributor name string — attribution is by name, honor
system); `created_at`/`updated_at` (an `updated_at` trigger maintains the
latter). From the contact-events migration (#3, below): `phone`,
`email` (contact, visible on the profile to anyone with the link — the
family's ruling), and the structured place fields `birth_city`,
`birth_quartier`, `residence_city`, `residence_quartier` (the form's
country → city → neighborhood pickers; `birth_place` free text still
exists for the village/place name itself).

**relationships** — `id` uuid PK; `person_a`, `person_b` (FK → people,
`on delete cascade`); `type`, one of:

| type | meaning | directed? |
|---|---|---|
| `parent` | a is a parent of b | yes |
| `step-parent` | a is a step-parent of b | yes |
| `raised-by` | a raised b | yes |
| `partner` | spouses/partners | symmetric |
| `sibling` | full siblings (explicit link) | symmetric |
| `half-sibling` | half-siblings (explicit link) | symmetric |
| `cousin` | manual cousin link | symmetric |

plus `status` (from the partner-status migration: `null`/`'current'` vs
`'former'`, meaningful **only** for `partner` links; CHECK constraint),
`created_by`, `created_at`. A unique index on
`(type, least(a,b), greatest(a,b))` enforces **one link per pair per
type**, direction-free; the app adapters also reject exact duplicates.
Deleting a person cascades their links.

Derived relations (computed in `family.js`, **never stored**): full
siblings (shared parents, or an explicit `sibling` link), half-siblings
(exactly one shared parent, or explicit link), cousins (children of a
parent's siblings, or a manual `cousin` link). This distinction is
user-visible in the link manager (B8).

**suggestions** — `id`; `person_id` FK cascade; `suggester_name`; `kind`
(`edit`/`passing`); `text`; `voice_url`; `proposed` (jsonb — partial
person fields applied on acceptance); `status`
(`pending`/`accepted`/`dismissed`); `created_at`. A second passing report
for the same person is created as a `passing` suggestion rather than a
second memorial — that rule lives in the app logic, not the schema.

**person_traits** (traits migration) — `id`; `person_id` FK cascade;
`trait_key` with a CHECK constraint pinning it to the 16 palette keys;
`contributor_name` `NOT NULL DEFAULT ''` (so the unique constraint below
actually bites — Postgres treats NULLs as distinct);
`unique(person_id, trait_key, contributor_name)` — one pick per quality
per person per contributor, which is what makes picking idempotent.

**media** — `id`; `person_id` FK cascade; `kind` (`voice-note`/`photo`);
`file_url`; `author_name`; `note`; `created_at`. Voice notes on profiles
in live mode.

**life_events** (contact-events migration) — `id`; `event_type`
(`addition`/`birth`/`marriage`/`divorce`/`death`, CHECK); `person_id`,
`related_person_id`, `relationship_id` (FKs, all `on delete set null` —
the event outlives the person it was about); `detail` (jsonb, reserved);
`created_by`; `created_at`. The app records an event inside the normal
flows (adding a person, linking a child or spouse, marking a partner
former, recording a passing) — fire-and-forget, never blocking the flow.
This is the substrate for family notifications; **nothing reads it for
sending yet**.

**app_settings** (contact-events migration) — `key` PK; `value` jsonb;
`updated_at`. One row today: `notifications_enabled`, seeded `false`.
The People-tab switch writes it; delivery does not exist yet.

**Storage buckets** — `photos` and `voice`, both public-read.

**Row-level security** — every table and both buckets carry policies
named **"open v1"**: the `anon` role can read and write everything. This
is the locked product decision (Part A, rule 3/5), not an oversight.
**When the family PIN / accounts land, these policies are the seam to
tighten** (authenticated-only writes) — the schema comments say so at the
policy definitions.

## B5. Migration discipline — read this before touching the database

1. **`supabase/schema.sql` already ran live. It is frozen. Never edit
   it.** It documents the initial state; nothing about the live database
   is changed by editing that file, and a future runner re-running an
   edited schema against the live DB is how archives get hurt.
2. **Every database change is a new file** in `supabase/`, named
   `<thing>-migration.sql`, written **idempotently** (`create table if
   not exists`, `add column if not exists`, `drop policy if exists`…),
   so it is safe if run twice.
3. A human runs it **once**, by hand, in the Supabase dashboard
   (SQL Editor → New query → paste → Run). There is no migration runner
   and no CI — by design.
4. **App code must degrade gracefully before the migration runs.** The
   partner-status feature is the template (in `supabase-adapter.js`):
   reads map a missing column to the default (`r.status || null` —
   everyone reads as a current partner); `addRelationship` **retries
   without the new field** if the write fails, so links always save;
   status-only patches fail cleanly with a toast instead of a fake
   success. Copy that pattern for any future column.
5. **Record every migration** in the log below (and in
   `app-build-report.md`) the day it runs.

**Migration log (all run live, by hand, in the SQL editor):**

| # | File | Change | Ran |
|---|---|---|---|
| 0 | `schema.sql` | All tables, buckets, RLS, seed (9 people, 8 links) | 2026-11-14 |
| 1 | `traits-migration.sql` | `person_traits` table + RLS | 2026-11-14 |
| 2 | `partner-status-migration.sql` | `relationships.status` + CHECK | 2026-11-14 |
| 3 | `contact-events-migration.sql` | `people.phone/email/birth_city/birth_quartier/residence_city/residence_quartier`; `life_events` + `app_settings` tables + RLS | **PENDING — written 2026-11-15, awaiting one paste-run in the SQL editor. The app already runs correctly without it (B5 rule 4 pattern); contact fields simply don't persist server-side until it runs.** |

## B6. The tree layout — algorithm and the bugs that taught it

`layoutTree` in `app.js` positions people in generation rows. Its current
shape is scar tissue from four real bugs the family hit on day one. Each
rule below names the bug that taught it; **do not simplify these away**.

**Units and claiming.** The layout builds "units" (a head person + their
partners) top-down, roots ordered by descendant count. Each child is
claimed by exactly one unit — the first to reach it.

**Co-parent attachment.** *Bug: Bengaly's mother (Adiaratou Tall), linked
only as his mother with no partner link to his father (they are
divorced), rendered as a lone island at the top with no line to her son —
the old layout drew branches only for children a unit claimed, and her
unit claimed none.* Fix: when a unit claims a child, the child's other
parent joins the unit's parent row as an **attached member** — drawn
beside the partners, with **no couple line** (the absent partner link is
respected) — provided they are unplaced and everything they connect to
is in this unit or already placed. A fixpoint loop then claims attached
parents' other children too. The same rescue attaches a lone explicit
sibling to a row member's unit.

**Universal connector pass.** After placement, **every** `parent`
relationship that still lacks a drawn branch gets one (parent's bottom →
child's top). Cross-unit parents (e.g. a remarried parent heading their
own household) are therefore always connected. Invariant: *the drawing
must never contradict the data — if a parent link exists, a line
exists.*

**Per-child anchoring.** *Bug (Django's review): branch anchors used the
unit's center; with the row seated [Django][Salimata][Adiaratou],
Bengaly's anchor landed at x=314 — inside Salimata's card — reading as
if his mother connected to him through his father's other wife.* Fix:
each child's branch anchors at the **midpoint of that child's own two
placed parents**; at the single placed parent's own drop point when only
one is placed; the fallback is the unit head's own drop point — a person,
never a shared center. Children of different mothers anchor separately,
by construction.

**Row seating for adjacency.** Row-mates (partners + attached co-parents)
are seated by a deterministic preference — co-parents of the unit's
claimed children first (ordered by eldest shared child's birth year,
then name, then id) — dealt alternately right and left of the head, so
the first two co-parents sit **adjacent to the head, one on each side**,
and their children's anchors fall in the gap between their own two
parents. *Known limit:* only two seats touch the head. A third co-parent's
anchor is her true midpoint and may cross another card on its way down;
the paint-order rule below keeps that line visible, and the anchor is at
least honest. No single-row arrangement can give three mothers adjacency
to one father — this is a geometry fact, not a TODO.

**Connector paint order.** *Bug: branch lines passed underneath person
cards and appeared broken/hidden.* Fix: the SVG connector layer paints
**above** the cards (DOM order + z-index 3 over the nodes' 1,
`pointer-events: none` so taps still land on cards). The dashed
former-partner line is drawn at full presence (stroke-width 3, opacity
0.9) — equal to solid lines, per the family's ruling that if a line
exists, you see it.

**Card sizing and names.** *Bug: long names were clipped by a line-clamp
on tree cards.* Fix: no truncation anywhere. The layout measures each
card's height from its content — name length (three stepped font sizes:
default, >32 chars, >46 chars), year lines, flag lines — and reserves
per-generation row heights from the tallest card, so cards grow without
overlapping. Branch anchors use each card's **real measured bottom**.
The no-clipping rule was audited onto every name surface: people rows,
profile chips, globe lists, remembered cards, recent feed.

**Fit-on-load.** `computeFit(vpW, vpH, contentW, contentH)` (pure,
exported as `window.FC_FIT` for tests) scales the whole layout into the
viewport, centered, capped at k=1, floored at 0.08 (the same floor as
manual zoom). Applied on first load and on entering the Tree tab;
resizes re-fit **until** the visitor pans or zooms by hand (the
`userMoved` flag), after which their framing is respected. Zoom controls
are labeled buttons (the "Fit tree" button *is* the reset) plus
pinch-to-zoom via Pointer Events (two-pointer tracking, zoom around the
pinch center, click suppression after a pinch) and wheel zoom.

**Bloom.** Nodes animate in generation by generation (CSS keyframes,
staggered by generation). Cosmetic only — note `generations()` still
assigns an attached co-parent her own longest-path generation for the
stats bar and bloom delay; her *drawn* row is the correct parent row.

**Fix pass 2026-11-15 (Django's rulings, via two screenshots).** Five
layout rules landed on top of everything above; they extend, never
replace, the earlier scar tissue:

- **Current partners sit closest.** Row seating gained a first sort
  key: a *former* partner (status `'former'`) always seats after
  *current* partners. *Bug (screenshot): the row read
  [Salimata][Django][Adiaratou][Sadio] — the former wife held the seat
  beside Django while a current wife sat at the end, and Bintou's drop
  could be misread against the wrong mother.* Now the row reads
  [Sadio][Django][Salimata][Adiaratou]: both current wives adjacent,
  the former wife at the end, and Bintou anchors at Django+Sadio's
  midpoint (x=232 in the acceptance render).
- **Lines land ON cards.** Every branch and couple bar now terminates
  exactly on a card edge with a visible **anchor dot** at both ends,
  and couple bars run edge-to-edge across the gap between two cards —
  never across a card or through an avatar. *Bug (screenshot): a
  couple bar crossed Adiaratou's initials circle; Fatoumata + Bouba's
  child lines hung from a floating point.*
- **Unavoidable crossings hop.** When a branch's curve genuinely
  crosses a foreign card (a third co-parent's honest midpoint can sit
  under a taller neighbour's card), the line is not rerouted and never
  silently passes: the renderer samples the curve, cuts a gap where it
  crosses the card's edge (top on entry, bottom on exit) and draws a
  small bridge arc — the hop says "passing over, not joining." Bengaly's
  own line is the live example: it hops Salimata's bottom edge.
- **Trunk weight.** Parent→child branches render at stroke-width 4.5
  (class `trunk`) against 3 for couple bars — descent is the spine.
- **Unconnected components.** The layout splits the tree into
  connected components (`F.components`). The largest renders as the
  main tree; every other component renders as its own mini-tree in a
  dashed, labeled zone below it ("Branches waiting to be connected").
  The universal connector pass still never invents a line: branches
  join only through a stored relationship (profile → Connect this
  branch). Tap-to-highlight (`state.highlightId`) also landed here:
  first tap on a card lights that person's edges (class `branch-hl`)
  and dims the rest (`hl-dim`); second tap opens the profile.

## B7. Generations and the cycle hardening

`generations(data)` in `family.js` assigns each person a generation
(longest path from a root over parent links, with partner/sibling
equalization). It feeds the stats strip, the generation-distribution
bar, the bloom stagger, and the generation filter.

**The "102 generations" incident.** During the family's first session, a
wrong link (someone recorded, through a chain of links, as their own
ancestor) created a **directed cycle in the parent links**. The old
computation relaxed parent links in a loop capped at 100 iterations with
no visited set, so the count inflated ~1 per iteration and the stats
strip announced 102 generations. Bengaly found and fixed the bad link
himself; the code was then hardened so no future bad link can do this:

- `cyclicParentLinks(data)` detects parent links that lie on a directed
  cycle (a link a→b is cyclic iff b is an ancestor of a).
- `generations()` **ignores cyclic links** — the remaining graph is a
  DAG, so generation is bounded by the number of people — and keeps the
  iteration cap as belt-and-braces.
- The link manager **warns on the exact looped row** ("⚠ This link
  creates a loop in the family tree — someone ends up as their own
  ancestor…", EN + FR) so a human can fix the data.

Rule for future work: **never compute generations (or ancestors, or
descendants) without the cycle guard.** Family data entered by many hands
*will* contain another loop one day.

## B8. Features — where they live and their rules

- **Link manager** ("Fix a family link", on every profile). Lists every
  *stored* relationship involving the person, in plain sentences, with
  Change / Remove. `LINK_OPTS` in `app.js` is the **single place** that
  translates a human sentence ("X is the son of Y") into the stored
  `{a, b, type}` form — direction handling exists only there. A partner
  link keeps its `status` when it stays a partner link and drops it
  cleanly otherwise. If the target link already exists as its own row,
  the edited row is deleted and hands its status to the existing row
  (the unique index forbids duplicates anyway). **Permissions:** the
  link's creator (`relationships.created_by` === the visitor's
  contributor name) or the keeper may change/remove; anyone else sees
  the row, a one-line explanation, and a Suggest-an-edit button instead.
  **Derived relations** (siblings/half-siblings/cousins that are only
  computed) appear as *explanation rows with no delete* — "They appear
  as brother/sister because they share the same parent in the tree — to
  change that, fix the parent link." Do not offer a delete that would do
  nothing.
- **Filters** (Tree / People / Globe). One filter at a time; session-only
  UI state — **never** written to the DB or export/import. Kinds: family
  of a person (parents / children / partners / siblings / ancestors /
  descendants, computed in `family.js`), by place (Living in = residence
  country with birth-country fallback — the Globe's rule; Born in), by
  generation, living / in memory. Per view: Tree **dims** non-matches in
  place (nodes are never removed by a filter; a connector stays strong
  only when both ends match); People hard-filters (the name search
  stacks on top); Globe dims dots/stars, its country lists respect the
  filter, its stars list hard-filters.
- **Traits.** The palette is `TRAIT_KEYS` in `i18n.js` — 16 fixed keys
  with EN/FR labels. The database CHECK constraint **mirrors the palette
  exactly**: if the palette ever changes, change both, via a new
  migration, and remember existing picks reference keys by name. Picks
  are idempotent per (person, key, contributor) by the unique
  constraint. Chips sort by count (palette order breaks ties), top 6
  shown, the rest behind one tap. Removal: your own pick, or the keeper
  removes any. Trait picks deliberately do not appear in the
  Recently-added feed.
- **Globe.** A hand-drawn SVG orthographic globe (graticule + stylized
  continent shapes — *suggestions, not geography*; do not "fix" them
  into a map library). Country coordinates are in `countries.js`. Living
  people plot by `residence_country`, **falling back to
  `birth_country`** when no residence is recorded — a deliberate
  day-one decision (the starting data had no residences; a strict rule
  would have shown an empty planet). The departed are stars at
  deterministic positions derived from the name (stable across renders),
  plus the named "In the stars" list. Gentle sway animation, CSS only.
- **Photo crop.** Picking a photo opens one crop layer: square frame,
  drag to reposition, one zoom slider; "Use this photo" bakes the crop
  through the existing 480 px JPEG pipeline. The crop math
  (`cropSourceRect`) is a pure function — keep it that way and tested.
- **Duplicate defense, in three layers:** (1) while typing a name in the
  add-person form, live "Already in the tree" matches (substring/prefix
  + the similarity engine in `family.js`) — tapping one opens/links that
  person instead of creating; (2) a save-time proposal panel ("did you
  mean…?", with an explicit "different person" override); (3) the
  similarity engine itself requires real evidence (two shared tokens, or
  near-identical given names) — a surname alone never proposes, because
  in this family half the tree shares one. Twins with matching birth
  dates get a note, not a block.
- **i18n discipline.** Every user-visible string goes through `i18n.js`.
  New UI ships with **both** EN and FR strings in the same change — no
  exceptions, and remember French is the default and the family's first
  language here. Entered content (names, notes, memorial text) is never
  translated.
- **Keeper mode & moderation.** One honor-system toggle (People tab,
  footer; `localStorage` flag per device). `canModerate(person)` =
  keeper, or visitor's contributor name === the entry's `created_by`.
  The same rule gates person edits, person removal, link changes, the
  divorced toggle, suggestion acceptance, and trait-pick removal.
  **Remove a person** is a labeled profile action (creator/keeper only)
  with a two-step confirm naming the person and what cascades (photo,
  voice notes, traits, links — via `deletePerson` in both adapters).
- **Attribution.** The app asks the visitor's name once per device
  (localStorage `fc.name`) and stamps it as `created_by` /
  `contributor_name` / `suggester_name` everywhere. It is a name string,
  not an identity — that is the v1 design, and the PIN is what will one
  day replace it.

## B9. Deploying

Source of truth: `~/workspace/family-tree/app/`. Production is a snapshot
of it in the repo. The exact procedure used for every deploy so far:

1. Make and verify your change locally (B10).
2. Copy the changed **runtime** files into the staging folder
   `~/workspace/family-tree/deploy-stage/famille/` (staging mirrors the
   repo layout: repo path = `famille/<file>`). Docs (`README.md`,
   `HANDOVER.md`) deploy the same way but are not loaded by the app.
3. Before pushing, note the current Supabase counts (B10) and check the
   branch head: `github list-commits` on `Bengalize/bengalize.github.io`
   `main` should match the newest entry in the sync record (below).
4. Push with the GitHub connector's snapshot tool:
   `github push-files --owner Bengalize --repo bengalize.github.io
   --branch main --message "<what changed>" --source-dir
   ~/workspace/family-tree/deploy-stage --paths-file <manifest>`, where
   the manifest is a NUL-delimited list of the repo-relative paths being
   pushed, written **outside** the source dir.
5. On confirmed success, **append** to the sync record
   `~/workspace/family-tree/deploy-stage.muse-github-snapshot-sync.json`
   an entry `{owner, repo, branch, source_dir, commit_sha, paths}` with
   the full SHA from the push result. Never push the sync record itself;
   never advance it for a failed or unconfirmed push.
6. GitHub Pages propagates in about a minute. Then verify live (B10)
   before telling the family anything.

Deploy history (all on `main`): `1ef73de` go-live (2026-11-14) ·
`eee9c0d8` polish pass · `97edb016` single-parent fix + divorced status ·
`7f87a7d1` link manager + filters + names + connectors + remove-a-person
· `d2dfdcba` per-child anchoring + row seating · plus this documentation
commit.

Notes: there is no local git clone with credentials in Bengaly's
environment (`gh`/SSH are unauthenticated there) — the connector's
`push-files` is the deploy path; don't invent another. The app folder
also contains `supabase/` (SQL) which is **not** deployed to Pages; it
lives in the repo only if someone chooses to copy it there — the
canonical copy is with the source.

## B10. Verification discipline

This app was built test-first in spirit: every feature shipped with a
harness, and every deploy was verified against the live system. Keep
that standard.

**The harnesses were session files** (in `/tmp/domtest/` and `/tmp/`) —
they did not survive VM restarts, and they are gone. What they covered,
so you can rebuild equivalents:

- **Node unit harness** (data layer + `family.js`): 59 checks — seed
  shape, partial dates, parent/sibling/half-sibling derivation on the
  real seed, automatic cousins, generations with partner/sibling
  equalization, duplicate detection (including the surname-only
  false-positive case), adapter round-trips, import/replaceAll.
- **Traits harness**: 73 checks — palette integrity (16 keys, labels in
  both languages), both adapters (Supabase against a stubbed `fetch`).
- **jsdom DOM smoke**: 28 checks — boot, tree renders the seed (node
  count, branches, couple links, deceased styling), EN⇄FR, search,
  profile contents, add-person and add-family flows, duplicate proposal,
  suggestion lifecycle, passing → memorial, recent feed.
- **Traits DOM**: 22 checks. **Polish harness**: 37 (fit math, crop
  math, FR default, labeled zoom, live duplicates while typing,
  create-with-link stored connected, globe dots/stars from data).
  **Single-parent harness**: 22 (the Adiaratou fixture replicated from
  live rows). **Link-manager**: 27. **Filters**: 22. **Surface-fixes**:
  23 (paint order, branch geometry sampled along the curve, long names
  on every surface, remove-person cascade). **Cycle harness**: 6
  (synthetic 2- and 3-person loops; max generation stays ≤ people count;
  manager warning). **Live-verify**: 7 (against the real URL + backend).

**How to rebuild them:** serve the app folder (`python3 -m http.server
8765`), load it in jsdom (`resources: "usable"`, `runScripts:
"dangerously"`, `pretendToBeVisual: true`; polyfill `window.fetch` from
Node — jsdom has none; stub `confirm`, `scrollTo`,
`URL.createObjectURL`), drive the real UI by clicking `[data-action]`
elements, and assert against the stored data (localStorage key
`famillecisse.local.v1` in local mode), not just the screen. Syntax-check
every JS file with `node --check` before anything else.

**Regression contracts** (numbers a future change must not silently
break): the elder tap counts — add a person: **3 taps** first run ever
(includes the one-time name prompt), **2** returning; link an existing
relative: **4**; add a new relative: **5**. If your change adds a tap to
a core flow, that is a product decision, not a refactor — it goes back
to the family.

**Live verification, after every deploy** (this exact ritual caught real
problems; skipping it is how bad deploys ship):

1. `GET https://bengalycisse.com/famille/` → 200.
2. Fetch the **served** `app.js` (and `config.js`) and byte-compare with
   the local files you pushed.
3. Count rows via Supabase REST with the anon key
   (`GET /rest/v1/people?select=id`, `…/relationships?select=id`,
   header `apikey` + `Authorization: Bearer <anon key>`): counts must be
   **unchanged by the deploy itself** — compare against the counts you
   took in step B9.3. (At this guide's writing: 17 people, 28
   relationships — the tree grows by the family's hand, so expect more,
   never fewer.)
4. Headless-render the live URL (jsdom recipe above, pointed at the live
   site) and assert the tree node count equals the REST people count.

## B11. Known limits and the v2 backlog

Accepted limits (also in Part A9, in family language): no offline mode;
no accounts/PIN; no Bambara UI; no duplicate-merge tool; no undo/edit
history; honor-system moderation; practice-mode localStorage quota
(~5 MB — the 480 px photo downscale is what stretches it).

Backlog, roughly in the family's order:

1. **Family PIN / real accounts.** The designed-for next step. Tighten
   the "open v1" RLS policies to authenticated writes; keep the
   suggest-don't-overwrite model. The adapter seam and the schema were
   left ready for this.
2. **Bambara UI.** A third language in `i18n.js`; voice notes bridge
   until then.
3. **Offline mode.** Service worker + queued writes through the adapter
   seam. The seam is why this is feasible at all.
4. **Duplicate-merge tool** for the keeper (today: delete by hand).
5. Small honest items: the globe's continents are stylized; the
   third-co-parent adjacency limit (B6) is geometric, not a bug; the
   stats/bloom generation of an attached co-parent is her own
   longest-path value (cosmetic).

---

*End of the guide. Written November 14, 2026 — the day the tree went
live, the day the family started growing it themselves. Keep it growing.*
