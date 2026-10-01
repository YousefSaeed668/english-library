# Spoken English Library

A calm, English–Arabic speaking notebook for an intermediate learner. Built entirely with HTML, CSS and vanilla JavaScript. There are no runtime dependencies, accounts, APIs or backend.

## Start using it

Unzip the project and open **index.html** in your browser. Everything is included: the data loads from classic JavaScript rather than a JSON fetch, so direct file opening works. For reliable local progress storage and offline caching, serve the folder:

```bash
cd spoken-english-library
python -m http.server 8000
```

Open http://localhost:8000. Python is only a convenient local preview server; it is not part of the deployed app. Any static server, including VS Code Live Server, works.

## What is included

- **1,653 vocabulary entries**, consolidated from **2,080 source rows**.
- **200 patterns** and **600 English–Arabic variations**, with original usage notes.
- **28 topics**, using the actual communication functions of the source material.
- Search across English, Arabic, source meanings, examples, notes and variations. Arabic diacritics and common alif forms are normalized for search.
- Compact or detailed browsing, topic/type/state filters, sorting and pagination.
- Item details, copy English, bookmarks, Learned/Learning/Difficult states and related patterns.
- English → Arabic, Arabic → English, exact context recall and pattern practice.
- 10/20/30-item sessions; saved, difficult, new, learning, learned or topic collections; a mixed 20-item session and random discovery.
- Reveal, previous/skip, shuffle, hide Arabic/examples and focus mode.
- Local progress, theme preference, last-opened item and resumable sessions.
- JSON progress export/import, confirmed reset, accessible dialogs and mobile navigation.
- Offline use after initial loading; on HTTPS or localhost a service worker also caches the application for later offline visits.

## Deploy to GitHub Pages

1. Create a GitHub repository, for example `english-library`.
2. Upload **the contents of this folder** to its root. `index.html` must be at the repository root, not inside an extra nested folder.
3. In the repository, open **Settings → Pages**.
4. Select **Deploy from a branch**, choose **main** and **/ (root)**, then save.
5. Open the Pages URL shown by GitHub, typically `https://YOUR-USERNAME.github.io/english-library/`.

All app assets use relative paths. Navigation uses URL hashes, so refreshing `#patterns`, `#study` or a topic does not require a server route. `.nojekyll` tells Pages to serve the files directly. A build step is not needed. See the separate upload guide for these steps in a short form.

## Structure

```text
index.html                 Application shell
css/styles.css             Responsive light/dark editorial design
js/data.js                 Generated browser-ready data (no fetch required)
js/app.js                  Routes, views, dialogs and delegated events
js/search.js               English/Arabic search and safe highlighting
js/storage.js              Validated versioned local progress
js/study.js                Session selection and recall lifecycle
data/vocabulary.json       Readable normalized vocabulary
data/patterns.json         Readable normalized patterns
data/categories.json       Shared topic definitions and speaking prompts
data/audit.json            Counts, consolidated rows and near-match candidates
sources/*.md               Unmodified copies of all four supplied resources
scripts/normalize.py       Reproducible importer (Python standard library only)
scripts/qa.cjs             Browser checks (development only; Playwright needed)
sw.js                      Offline cache
CONTENT-AUDIT.md            Preservation and deduplication decisions
QA.md                      Verification results and scope
```

## Content organization and merging

The two vocabulary files each contain 1,040 rows. Case, apostrophes, whitespace and final punctuation are normalized for matching. Exact matching entries are consolidated. Each original row remains inside `senses`, including its translation, example, type, category, source filename, source number and line number. Different translations are preserved rather than silently selecting one as universally correct. Entries with examples get the primary display position.

Five headwords retain distinct study entries because their source meanings differ: **turn down, work out, turn up, get out of, take off**. Close phrases and different grammar stay separate; for example, `used to` is not merged with `get used to`. Fifty lexical near-match pattern candidates are documented in `data/audit.json`; they were retained because they teach distinct structures or purposes. There are no exact duplicate patterns.

Original vocabulary topics map into 28 shared English topic labels. The two pattern sources do not supply category headings, so the patterns are assigned to inspected communication functions. Some patterns intentionally appear in multiple topics. Topic counts therefore overlap; the library total counts each entry once.

Grammatical types come from the rich source. For translation-only entries, multiword forms are labeled Expression, while single-word entries without a source type remain Unclassified. The app does not invent grammatical labels or examples. Related items use a full multiword expression appearing in the actual pattern/variation, with a topic constraint for the five split headwords.

Context recall only uses an exact, single, bounded occurrence in a source example (case/apostrophe differences are accepted). Placeholders and slash alternatives are excluded. No automatic inflection or approximate replacement is attempted. This produces **802 reliable context cards**; other vocabulary still works in the two translation modes.

## Learning state and backup

Progress is stored under `spoken-english-notebook-v1` in browser `localStorage`. It records status, saved flag/time, review count/time, last opened entry and the active session. Theme is stored separately under `sel-theme` and initially follows your system appearance.

**Again** marks Learning and repeats the item later in the session. **Hard** marks Difficult. **Know it** marks Learned. Manual status changes do not increment review counts. Skipping does not rate an item. Previous lets you revisit earlier cards. Each submitted rating counts as another review.

Progress is local to a browser and origin. It does not automatically sync between devices; `file://` storage behavior also varies by browser. Export before switching devices, clearing browser data or changing domain. In **Settings & backup**, Export JSON downloads the complete notebook; Import JSON validates the backup and asks before replacing current progress. Unknown item IDs are ignored. Theme remains a device preference. Reset also asks for confirmation.

If storage is unavailable or full, the app continues in memory and shows a message; export a backup before closing it. Browser private modes may discard data.

## Update the learning material

1. Keep the source table/numbered-pattern formats and edit the files in `sources/`.
2. From the project root, run:

```bash
python scripts/normalize.py
```

3. Commit the regenerated JSON files **and** `js/data.js` together.
4. Increment the `CACHE` version in `sw.js` whenever application files or data change.
5. Open the site and verify source counts, examples, translations and study modes.

The importer intentionally asserts the supplied 1,040/1,040/200/600 baseline. If you expand the dataset, update those explicit assertions and inspect the topic assignments (`SIMPLE_MAP` and `groups`) as part of the content change. Vocabulary IDs derive from normalized text and sense discriminator; pattern IDs use source numbers. Keep IDs stable to preserve existing progress. A source phrase renamed substantially gets a new ID.

## Keyboard and accessibility

- `/` or Ctrl/Cmd + K focuses search.
- Escape closes dialogs, dismisses mobile navigation or exits focus mode.
- In a study session, Space reveals; after reveal, 1 = Again, 2 = Hard, 3 = Know it.
- Native buttons, inputs, select controls and dialogs support keyboard access.
- English stays LTR; Arabic text has its own RTL direction and language metadata.
- Reduced-motion preferences are respected.

The interface uses system fonts to stay fully offline and dependency-free. There are no external font/image requests or fake AI features.
