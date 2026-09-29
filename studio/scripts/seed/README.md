# Seed content

Sample content for the `production` dataset: 6 categories, 10 courses, 4 modules per course,
3 lessons per module — 120 lessons, each with its own real YouTube video. Every video is credited
to the real channel that published it; there are no invented instructors or learner counts
(learner numbers on the site are live, from progress records).

## Running it

```bash
cd studio
npm run seed:videos   # resolve a real YouTube video per lesson (cached; skip if videos.json is filled)
npm run seed:build    # expand content.mjs + videos.json into seed.ndjson
npm run seed:import   # sanity dataset import ... --replace
```

Import authenticates through the Sanity CLI, so no write token is needed anywhere.

## The files

| File | What it is |
| --- | --- |
| `content.mjs` | The hand-authored content. **Edit this** to change what gets seeded. |
| `resolve-videos.mjs` | Finds and verifies one unique YouTube video per lesson. |
| `videos.json` | Committed cache of the resolved videos. Re-runs are offline. |
| `build-ndjson.mjs` | Expands the spec into NDJSON, self-checking as it goes. |
| `seed.ndjson` | Generated output. Do not hand-edit; rebuild instead. |

## Things worth knowing

- **Ids are deterministic** (`course.<slug>`, `lesson.<slug>`, …) and the import uses `--replace`,
  so re-running is idempotent rather than duplicating the catalog.
- **Lesson slugs are prefixed with the course slug.** `LESSON_BY_SLUG_QUERY` matches on the slug
  alone, so two courses cannot both own a lesson called `intro`.
- **Lesson duration is the real video length**, so course and module durations — which GROQ derives
  with `math::sum` — add up to exactly the sum of their parts. Nothing stores an aggregate.
- **`build-ndjson.mjs` re-implements the Studio's validation rules** and refuses to write a file
  that would fail them. Studio validation does not run on import, so this is the only gate.
- **Images upload as real assets** at import time via `_sanityAsset`: each lesson's thumbnail is
  its video's own poster frame, and each course cover starts as its first video's frame. After an
  import, run the media scripts (`scripts/media/`) to finish the real images: `channels.mjs`
  (channel names and avatars, needs `YOUTUBE_API_KEY`), `thumbnails.mjs` (full-resolution frames),
  then `covers.mjs` (a filmstrip of each course's own videos). Nothing hotlinks at runtime.
- **Adding a lesson** means adding it to `content.mjs`, then running all three commands. The
  resolver only fetches what is missing from the cache.
