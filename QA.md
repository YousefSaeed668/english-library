# Verification

Tested on 1 October 2026 with headless Chromium 145.0.7632.6.

**85 browser checks passed.** No uncaught browser exceptions or HTTP asset failures were observed.

- Reconciled all 2,080 vocabulary source rows, 1,040 examples, 200 patterns and 600 translated variations.
- Confirmed 1,853 distinct study IDs, populated translations and exact per-topic counts.
- Verified all 802 context exercises reconstruct their original sentences when the blank is replaced by the answer.
- Tested vocabulary and pattern browsing, pagination, type filtering, detailed examples, source variations and mixed topic collections.
- Tested English partial search, Arabic search, Arabic diacritic normalization, highlighting, empty results and empty queries.
- Tested all four study modes, reveal, previous, skip, shuffle, Again requeue, Hard/Difficult and Know it/Learned.
- Tested topic sessions, 10-item discovery, 20-item sessions, 30-item sessions, hide Arabic, hide examples and focus mode.
- Verified bookmarks, learned states, theme and current study position survive reload.
- Tested JSON export/import, confirmation before reset and rejection of incompatible imported context cards.
- Tested copy English, keyboard search, Escape, mobile navigation, all navigation destinations and browser back.
- Tested relative assets and navigation under a repository-style subpath.
- Tested direct file opening and offline reload through the service-worker cache.
- Checked home, vocabulary, patterns, study, progress and toolbox at widths of 375, 768, 1024 and 1440 pixels; no horizontal overflow.
- Visually inspected desktop, mobile, light-mode and dark-mode browser captures, including English and Arabic text.

The application uses native controls/dialogs, visible control focus styles, a skip link, language/direction metadata and reduced-motion CSS. This is a practical implementation check, not a formal WCAG certification or a test on physical iOS/Android devices. Browser compatibility beyond Chromium should be checked if targeting older browsers.

## Repeat the browser checks (development only)

The deployed website requires no packages. To run the optional QA script, make Playwright and Chromium available in your development environment, then run:

```bash
node scripts/qa.cjs
```

The script starts a temporary Python static server in the parent directory and tests the project under its folder subpath. Python 3 is required only for this QA server. Set TEST_URL to test a separately served instance. Set CHROME_PATH for a custom Chromium executable or PLAYWRIGHT_MODULE for a nonstandard Playwright package location. QA_OUTPUT selects the screenshot/results directory; by default it uses /tmp/english-qa (set a local path on Windows).

Review data/audit.json and CONTENT-AUDIT.md for the extraction and normalization audit.
