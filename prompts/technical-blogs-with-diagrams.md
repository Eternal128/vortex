# Implementation prompt: Technical field notes with diagrams and cited studies

Branch: `feature/technical-blogs`, cut from `main` at `626fd59`.

## Goal

Publish two series of field notes on `/blog`:

1. **Inside Vortex** (4 posts): why it exists and what it optimizes for, the architecture,
   security, and copyright and creators. Every technical claim is checked against the code.
2. **Learning science** (6 posts): research on how people learn, each backed by peer-reviewed
   studies with a full reference list, and connected to how Vortex applies it.

Each post has at least one real diagram (architecture, data flow, trust boundaries, or a chart
of published results), rendered on the site in both themes.

## Skills and docs read

- `sanity-best-practices`, `content-modeling-best-practices` (custom Portable Text block types,
  references modelled as typed objects), `portable-text-serialization` (custom `types`
  serializers), `dataviz` (chart marks, labels and theming for the result charts).
- The code the "Inside Vortex" posts describe: `app/api/search/route.ts`, `lib/search/{ground,
  keyword,mcp,model}.ts`, `app/api/progress/route.ts`, `sanity/lib/{cas,progress,write-client}.ts`,
  `app/api/ideas/**`, `lib/ideas/*`, `proxy.ts`, `next.config.ts`, `lib/video.ts`,
  `lib/plans/{youtube,quota}.ts`, `studio/scripts/ingest/*`.

## Studies (verified by search against the publications)

| Post | Primary sources |
| --- | --- |
| Spacing | Ebbinghaus (1885/1913); Cepeda et al. (2006) *Psychol. Bull.* 132(3); Cepeda et al. (2008) *Psychol. Sci.* 19(11): optimal gap ≈ 20–40% of a 1-week delay, 5–10% of a 1-year delay |
| Retrieval practice | Roediger & Karpicke (2006) *Psychol. Sci.* 17(3): 5 min 83/78/71%, 1 week 40/56/61% (SSSS/SSST/STTT); Karpicke & Blunt (2011) *Science* 331; Adesope et al. (2017) *Rev. Educ. Res.* 87(3); Dunlosky et al. (2013) *PSPI* 14(1) |
| Short videos, quizzes between them | Guo, Kim & Rubin (2014) L@S: 6.9M sessions, median engagement ≤ ~6 min; Szpunar, Khan & Schacter (2013) *PNAS* 110(16): interpolated tests roughly halved mind wandering |
| Feeling of learning | Deslauriers et al. (2019) *PNAS* 116(39): +0.46 SD exam, −0.56 SD feeling; Kornell & Bjork (2008) *Psychol. Sci.* 19(6); Bjork, Dunlosky & Kornell (2013) *Annu. Rev. Psychol.* 64 |
| Interleaving | Rohrer & Taylor (2007) *Instr. Sci.* 35(6): 63% vs 20% one week later; Kornell & Bjork (2008) |
| Pretesting and feedback | Richland, Kornell & Kao (2009) *JEP: Applied* 15(3); Hattie & Timperley (2007) *Rev. Educ. Res.* 77(1); Butler, Karpicke & Roediger (2008) *JEP: LMC* 34(4) |

Numbers are only quoted where verified; elsewhere the direction of the effect is stated.
Illustrative curves are labelled "illustrative, not data".

## Decisions

1. **Diagrams as a safe Portable Text block, not raw SVG from the CMS.** A new `diagram` block
   (`name` from a fixed list, plus a caption) renders a React SVG component from a registry in
   `components/blog/diagrams/`. No HTML or SVG is ever stored in or injected from Sanity, so there
   is no XSS path, and the diagrams use the site tokens, so they work in light and dark.
2. **A dedicated `postContent` type** (the shared `blockContent` members plus `diagram` and a
   `callout`), so lesson notes and bios keep their current, simpler rich text.
3. **References as data.** `post.references[]` holds `{authors, year, title, venue, url}`.
   The article renders them as a numbered "References" list; in-text citations are plain text
   ("Roediger & Karpicke, 2006").
4. **Two new categories**, *Inside Vortex* and *Learning Science*, used only as blog topics. They
   have no courses, so the catalog, Explore and Roadmap (which all filter on course count) do not
   show them.
5. **Content lives in the seed** (`studio/scripts/seed/content.mjs`), like the existing notes, so
   `seed:build && seed:import` publishes it and the ids are stable. The three existing notes stay.
6. **Honest scope for copyright.** The copyright post describes what Vortex does (YouTube's own
   embedded player, no downloading or re-hosting, creator credit, transcripts used only as an
   internal search index and never shown whole) and states it is not legal advice.

## Diagrams (12)

`vortex-before-after`, `system-architecture`, `search-pipeline`, `ingestion-pipeline`,
`trust-boundaries`, `write-path-guards`, `creator-flow`, `spacing-ridgeline` (chart of the
published optimal-gap ratios), `testing-effect` (grouped bars from Roediger & Karpicke 2006),
`engagement-by-length` (bars from Guo et al. 2014), `blocked-vs-interleaved`, `pretest-loop`.

## Security

No new routes or writes. Diagrams are code, selected by a name the schema restricts to a list;
unknown names render nothing. External reference links open with `rel="noopener noreferrer"`,
and only `http(s)` URLs are accepted by the schema.

## Files expected to change

`studio/schemaTypes/objects/{diagram,callout,postContent,reference}.ts`,
`studio/schemaTypes/documents/post.ts`, `studio/schemaTypes/index.ts`,
`studio/scripts/seed/{content.mjs,build-ndjson.mjs,seed.ndjson}`, `sanity/lib/queries.ts`,
`sanity.types.ts`, `components/blog/{post-body.tsx,references.tsx}`,
`components/blog/diagrams/*`, `app/blog/[slug]/page.tsx`.

## Acceptance criteria

- 10 new posts render on `/blog` and filter by the two new topics; each has a diagram, and the
  learning posts end with a references list that links to each source.
- Diagrams are legible in light and dark, and scale down to 360px.
- No figure or claim goes beyond what the cited sources or the code support.

## Checks

`npm run typecheck`, `npm run lint`, `npm run build` against the local seed mock, Studio typegen
and `sanity build`, `seed:build` self-checks, screenshots of a post from each series.

## Manual test steps

1. `cd studio && npm run seed:build && npm run seed:import && npm run deploy`.
2. `npm run dev`, open `/blog`, filter by *Inside Vortex* and *Learning Science*.
3. Open "How Vortex is built" and "Testing is a learning event": check diagrams, the outline and
   the references, then toggle dark mode.
