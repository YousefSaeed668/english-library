# Content audit

All four supplied Markdown files were read in full by the importer. Both vocabulary tables, all numbered pattern blocks, their translations, variations and inline explanatory notes were extracted. Unmodified copies remain in `sources/`, preserving introductions, source references and daily speaking guidance as well as the imported learning entries.

| Source | Schema | Rows |
|---|---|---:|
| spoken-english-1040(1).md | Number / English / Arabic / type / example / usage | 1,040 |
| spoken-english-vocabulary-arabic(1).md | English / Arabic | 1,040 |
| 100-everyday-english-speaking-patterns(1).md | Numbered pattern, meaning, optional note, three translated variations | 100 |
| 100-more-english-speaking-patterns-101-200(1).md | Same pattern schema; numbering continues | 100 |

## Normalization results

| Check | Result |
|---|---:|
| Original vocabulary rows retained in sense records | 2,080 |
| Vocabulary study entries after merging and sense separation | 1,653 |
| Repeated rows consolidated | 427 |
| Patterns retained | 200 |
| Translated variations retained | 600 |
| Vocabulary source examples retained | 1,040 |
| Exact context recall cards | 802 |
| Shared topics | 28 |
| Lexical near-pattern candidates retained after inspection | 50 |
| Lexical near-vocabulary candidates retained | 7 |
| Exact duplicate patterns | 0 |
| Blank English/Arabic learning records | 0 |
| Duplicate study IDs | 0 |

## Merging decisions

- Normalize case, straight/curly apostrophes, whitespace and trailing punctuation for exact comparison.
- Preserve different English spellings as source rows. Preserve distinct translations, usage notes and examples.
- Give entries with source examples the primary display position; keep every translation attached to its source row in the expanded details.
- Do not merge personal pronoun variants, extra particles, or related grammar frames merely because they are similar.
- Keep `on time` / `in time`, `used to` / `get used to`, `How about you?` / `How about …?`, `I should’ve …` / `I could’ve …`, and apology / sympathy patterns separate.
- Separate five exact-word overlaps by their clear source meanings: `turn down` (reject / volume), `work out` (solve / exercise), `turn up` (appear / volume), `get out of` (avoid an obligation / leave a vehicle), and `take off` (source clothing example / flight). The rich `take off` row itself mentions both uses; its complete original translation is preserved.
- Fifty lexical similarity candidates were inspected and retained. Shared scaffolding such as “I’m…” is not evidence of identical meaning. The full candidate list is in `data/audit.json`.

## Categories and type labels

The rich vocabulary file has 26 communicative parts with speaking prompts. The simple vocabulary file also has 26 categories, in Arabic, but they do not align one-for-one. These map to 28 shared English labels, with Preferences & interests and Services & bookings kept as useful additional topics. Some broad categories share entries. The simple food/leisure category and rich digital/entertainment category retain their overlapping memberships.

The pattern files have no category headings. Communication functions were assigned explicitly after inspecting the frames and examples. Multiple memberships are allowed. Original topic labels and source numbers remain available in each vocabulary sense record.

Types from the rich source are retained, including grammatical and functional labels. For simple-only entries, multiword forms receive the broad Expression label; single words remain Unclassified. No new dictionary-type claims or example sentences were invented.

## Source quality and preservation

- Both vocabulary sources contain exactly 40 rows per source category, with 26 categories each.
- Rich rows have six columns; simple rows have two. Research tables and headers are excluded from vocabulary extraction.
- All 200 numbered patterns have exactly three English–Arabic variation pairs.
- Arabic remains UTF-8; diacritics remain in displayed content. Search alone normalizes them.
- `—` in an empty usage column means “no additional usage note,” not literal learning content.
- Inline italic usage notes after pattern translations are preserved independently.
- No patterns or vocabulary rows were discarded. Material that is not displayed in the app remains in the original Markdown files.
- All JSON is generated with Unicode preserved. Text is HTML-escaped at rendering time, including imports and search highlighting.

This audit checks the supplied datasets and their preservation. It does not newly certify word frequencies or assign official CEFR ratings to every item.

Near-vocabulary detection also compares close lexical forms (at least 90% string similarity, within the same initial-letter group and similar length). These are candidates, not evidence of identical meanings. All remain separate. This preserves grammatical distinctions, word-family differences and short/long expressions. The complete list and retain decisions are in `data/audit.json`.
