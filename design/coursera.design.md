---
version: alpha
name: Coursera
website: "https://www.coursera.org"
description: >-
  A learning-marketplace system anchored on a white canvas, a single saturated voltage blue ("#0056d2") that carries every primary "Enroll now" CTA and link, a navy deep-blue ("#002761") that owns the hero-callout band and the testimonial stat panel, and one typeface — Source Sans Pro — running every display, body, action, and label role at 14–28px across the captured marketing surface. The radius scale climbs from a 2px chip border up to a 50px capsule, but action buttons stay rectangular at 8px ("--cds-border-radius-100"), and the structural gray ladder runs from "#0f1114" ink through "#5b6780" muted body, "#dae1ed" hairline, and "#e8eef7" surface tint — a five-step neutral spine that holds the colorful category-pill row from drifting into noise.

seo:
  title: "Coursera Design System for React — Voltage Blue #0056d2, Source Sans Pro, 18 components"
  metaDescription: "Coursera's design system as a DESIGN.md file. Voltage Blue #0056d2 CTA, navy #002761 callout, Source Sans Pro, 18 components. For React, Next.js, and AI tools."
  highlights:
    - "Voltage blue anchor — #0056d2 carries every primary CTA and link, paired with #0048b0 for the pressed state"
    - "Navy callout band — #002761 owns the hero card and the 91% testimonial stat panel, never used on body text"
    - "Single-typeface dialect — Source Sans Pro spans display, body, and action at weight 400 / 600 / 700, no second family"
    - "Rectangular 8px primary CTA — Coursera holds buttons at --cds-border-radius-100 while running 50px pill chips for category filters"
    - "Five-step neutral spine — #0f1114, #5b6780, #dae1ed, #e8eef7, #ffffff carry every structural surface and hairline"
  tags:
    - "Education & Learning"
  lastUpdated: "2026-05-13"
  author:
    name: "Dov Azencot"
    url: "https://x.com/dovazencot"
  opening: |
    Coursera's marketing surface reads as a course catalog rendered with enterprise-SaaS rigor. The canvas is white edge-to-edge; the hero is a side-by-side pair — a deep navy ("#002761") personal-pitch card on the left carrying "Start, switch, or advance your career" in Source Sans Pro at 28px / weight 600 / -0.28px tracking, and a white card on the right with three "Top courses" tiles. Every primary CTA — "Enroll now", "Join for Free" — fills with voltage blue ("#0056d2") at 8px radius, 36px height, and an uppercase-tracked label at 14px / weight 600 / 0.14px letter-spacing. The body voice drops to mid-gray ("#5b6780") for category descriptions and to near-black ("#0f1114") for course titles and the dense legal copy at the page foot.
    
    This page packages the captured surface into one DESIGN.md file built on the Google Labs spec. Inside: 19 color tokens covering voltage blue and its pressed step, the navy callout family, white canvas plus a four-step neutral ladder, the pastel category-pill tint, three callout-band accents (purple, yellow, pink), and the success / warning / error feedback trio drawn from the 381 :root custom properties; 11 typography tokens splitting Source Sans Pro into display, h2, h3, body, action-primary, action-secondary, body-tertiary, nav, label, caption, and input roles; 6 corner radii anchored at 8px button-radius, 2px chip border, 16px card, and the 50px "max" capsule from "--cds-border-radius-max"; 9 spacing values built on the brand's 8px / 12px / 16px / 24px / 32px / 48px / 64px / 80px / 112px scale ("--cds-spacing-*"); and 18 components covering the voltage CTA, secondary button, top nav, search input, course-tile card, category-pill row, navy callout band, pastel skill chip, testimonial stat panel, and the FAQ accordion row.
    
    A working React developer feeds this file to Claude, Cursor, or Copilot and reproduces Coursera's specific dialect — rectangular voltage-blue CTA on white, navy callout cards flanking a course-tile column, 50px pill chips for skill filters, Source Sans Pro at weight 600 for every display — instead of a generic shadcn theme. Reference the tokens inside Tailwind config or as CSS variables. Where most education brands hedge between approachable pastels and corporate-LMS gravitas, Coursera commits to a single saturated mid-blue and a navy callout band — confidence by chromatic discipline rather than illustration warmth.
  related:
    - href: "/design"
      title: "Browse all design systems"
      description: "The full directory of DESIGN.md files on shadcn.io, with live mockups for each."
    - href: "https://www.coursera.org"
      title: "Coursera — official site"
      description: "The online learning marketplace whose marketing surface this DESIGN.md captures."
    - href: "https://github.com/google-labs-code/design.md"
      title: "The DESIGN.md specification"
      description: "Google Labs' open spec for machine-readable design system files — the format this page is built on."
  questions:
    - id: "primary-color"
      title: "What is Coursera's primary brand color?"
      answer: "Coursera's primary is voltage blue at #0056d2 — the exact hex declared by --cds-color-interactive-primary, --cds-color-blue-700, and --cds-color-callouts-background-primary. It carries the wordmark, every 'Enroll now' / 'Join for Free' primary CTA, link text in body copy, and the small enrollment-count icons under each course tile. The pressed state drops to #0048b0 (--cds-color-blue-800, --cds-color-interactive-primary-hover), and the navy callout family extends from #002761 (--cds-color-blue-950) through #003b8f (--cds-color-blue-900). The voltage blue is held back from large background fills and body text — the rest of the system runs on white canvas, a four-step gray ladder, and the pastel callout-band tints."
    - id: "typography"
      title: "What typography does Coursera use, and what's the substitute?"
      answer: "Coursera runs a single typeface — Source Sans Pro — declared as 'Source Sans Pro, Arial, sans-serif' on --cds-font-family-body, --cds-font-family-title, and --cds-font-family-display. The hero h2 sits at 28px / weight 600 / -0.28px letter-spacing on the navy callout card; section h2s drop to 20px / weight 600 / -0.06px tracking; body runs 14px / weight 400 / 20px line-height; the primary CTA label is 14px / weight 600 / 0.14px tracking. There is a second declared family — --cds-font-family-boutros-coursera (Boutros Coursera, Tahoma) — reserved for Arabic locales. Source Sans Pro is Adobe's open-source SIL face, so it ships free on Google Fonts — no substitute is needed."
    - id: "callout-band"
      title: "Why does Coursera use a navy hero card instead of a full-bleed band?"
      answer: "The hero splits a white canvas in half — a navy ('#002761') 'Start, switch, or advance your career' card on the left and a white 'Top courses' tile-stack on the right, both at 16px radius (--cds-border-radius-200). The split lets the brand show two value propositions in parallel: career pitch (navy with voltage-blue CTA inside) and discovery pitch (white with course tiles). A full-bleed navy band would dominate the page and force the course tiles below the fold; the side-by-side card composition keeps both visible at viewport-top and uses the navy color only for the action-prompt half. The same navy returns at the bottom of the page as a 91% testimonial stat panel — bracketing the marketing flow with two navy moments."
    - id: "geometry"
      title: "Why does Coursera use 8px rectangle buttons but 50px pill chips?"
      answer: "The radius vocabulary is role-split. Primary and secondary action buttons render at 8px (--cds-border-radius-100) — the rectangular silhouette reads as a workspace control, not a consumer pill. Skill and category filter chips, by contrast, render at 50px (--cds-border-radius-max) — fully capsule. The split makes the action class instantly legible: rectangles commit you to a course, capsules filter the catalog. Cards sit at 16px (--cds-border-radius-200), small input chevrons at 2px (--cds-border-radius-25), feature blocks at 24px (--cds-border-radius-300). The 8px / 50px button-vs-chip dichotomy is the geometric move that separates Coursera from pill-everywhere brands like Stripe and Linear."
    - id: "neutral-ladder"
      title: "What are Coursera's structural gray tones?"
      answer: "The neutral spine runs five steps: #0f1114 (--cds-color-grey-975, --cds-color-emphasis-neutral-background-xxstrong) for ink at frequency 2157 — the most-common color in the extraction; #5b6780 (--cds-color-grey-600, --cds-color-emphasis-neutral-content-default) for muted body and inactive nav at frequency 186; #dae1ed (--cds-color-grey-100, --cds-color-neutral-stroke-primary-weak) for the 1px hairline divider at frequency 47; #e8eef7 (--cds-color-grey-50) for surface tint and chip backgrounds at frequency 74; and #ffffff (--cds-color-neutral-background-primary) for the dominant canvas at frequency 508. The ladder is gentle — each step jumps roughly one OKLCH lightness band — so the gray surfaces never compete with the voltage blue."
    - id: "use-in-project"
      title: "Can I use this DESIGN.md to build a React learning marketplace?"
      answer: "Yes — the file feeds Claude, Cursor, or Copilot and the agent reproduces Coursera's specific dialect (voltage-blue rectangular CTA on white, navy callout card with inline secondary action, 50px-pill skill-chip rows, Source Sans Pro across every text role) rather than a generic shadcn theme of subdued grays and Inter headings. Every hex (#0056d2, #002761, #0f1114, #5b6780, the pastel callout tints) and every radius / spacing / typography value is a quoted token you can paste into Tailwind config, CSS variables, or your own component library. The course-tile card geometry and the side-by-side hero composition transfer directly to any catalog-driven marketplace, learning or otherwise."

colors:
  primary: "#0056d2"
  primary-pressed: "#0048b0"
  primary-soft: "#e3eeff"
  primary-xsoft: "#f0f6ff"
  callout-navy: "#002761"
  callout-navy-mid: "#003b8f"
  callout-blue-bright: "#3587fc"
  ink: "#0f1114"
  ink-soft: "#1e2229"
  body-muted: "#5b6780"
  body-mid: "#8495b0"
  hairline: "#dae1ed"
  surface-tint: "#e8eef7"
  canvas: "#ffffff"
  warning-soft: "#fff4e8"
  accent-purple: "#a678f5"
  accent-pink-soft: "#ffe0f9"
  accent-blue-info: "#b0e5fb"
  black: "#000000"

typography:
  display-md:
    fontFamily: "Source Sans Pro, Arial, sans-serif"
    fontSize: 28px
    fontWeight: 600
    lineHeight: 1.14
    letterSpacing: "-0.28px"
  heading-md:
    fontFamily: "Source Sans Pro, Arial, sans-serif"
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.1px"
  heading-sm:
    fontFamily: "Source Sans Pro, Arial, sans-serif"
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.048px"
  subtitle-md:
    fontFamily: "Source Sans Pro, Arial, sans-serif"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.29
    letterSpacing: "-0.042px"
  body-md:
    fontFamily: "Source Sans Pro, Arial, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  body-sm:
    fontFamily: "Source Sans Pro, Arial, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.43
    letterSpacing: 0
  body-xs:
    fontFamily: "Source Sans Pro, Arial, sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  action-primary:
    fontFamily: "Source Sans Pro, Arial, sans-serif"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.43
    letterSpacing: "0.14px"
  action-strong:
    fontFamily: "Source Sans Pro, Arial, sans-serif"
    fontSize: 14px
    fontWeight: 700
    lineHeight: 1.43
    letterSpacing: "0.14px"
  nav-link:
    fontFamily: "Source Sans Pro, Arial, sans-serif"
    fontSize: 16px
    fontWeight: 600
    lineHeight: 2.5
    letterSpacing: 0
  caption:
    fontFamily: "Source Sans Pro, Arial, sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1
    letterSpacing: 0

rounded:
  none: "0px"
  xs: "2px"
  sm: "4px"
  md: "8px"
  lg: "16px"
  xl: "24px"
  full: "50px"

spacing:
  xxs: "2px"
  xs: "4px"
  sm: "8px"
  md: "12px"
  base: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "48px"
  section: "64px"
  hero: "80px"

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.canvas}"
    typography: "{typography.action-primary}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
    border: "0"
  button-primary-hover:
    backgroundColor: "{colors.primary-pressed}"
    textColor: "{colors.canvas}"
    typography: "{typography.action-primary}"
    rounded: "{rounded.md}"
  button-secondary:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.action-primary}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
    border: "1px solid {colors.ink}"
  button-on-navy:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.canvas}"
    typography: "{typography.action-primary}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
    border: "0"
  link-inline:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.none}"
    padding: "0"
  top-nav:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.nav-link}"
    rounded: "{rounded.none}"
    height: "76px"
    padding: "0px 48px"
    border: "0 0 1px {colors.hairline} solid"
  nav-link:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.nav-link}"
    rounded: "{rounded.none}"
    padding: "0px 8px"
    height: "40px"
  text-input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "12px 12px 12px 12px"
    height: "48px"
    border: "1px solid {colors.ink}"
  text-input-focused:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    border: "2px solid {colors.primary}"
  callout-card-navy:
    backgroundColor: "{colors.callout-navy}"
    textColor: "{colors.canvas}"
    typography: "{typography.display-md}"
    rounded: "{rounded.lg}"
    padding: "32px"
  course-tile-card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.subtitle-md}"
    rounded: "{rounded.lg}"
    padding: "16px"
    border: "1px solid {colors.hairline}"
  category-pill:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.action-primary}"
    rounded: "{rounded.full}"
    padding: "8px 16px"
    height: "36px"
    border: "1px solid {colors.hairline}"
  category-pill-tinted:
    backgroundColor: "{colors.surface-tint}"
    textColor: "{colors.ink}"
    typography: "{typography.action-primary}"
    rounded: "{rounded.full}"
    padding: "8px 16px"
    border: "0"
  skill-chip:
    backgroundColor: "{colors.surface-tint}"
    textColor: "{colors.callout-navy}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.xs}"
    padding: "4px 8px"
    border: "0"
  testimonial-stat-band:
    backgroundColor: "{colors.callout-navy}"
    textColor: "{colors.canvas}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: "48px 32px"
  faq-row:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.none}"
    padding: "16px 0px"
    border: "0 0 1px {colors.hairline} solid"
  partner-logo-tile:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.body-muted}"
    typography: "{typography.caption}"
    rounded: "{rounded.md}"
    padding: "16px"
    border: "1px solid {colors.hairline}"
  hairline-divider:
    backgroundColor: "{colors.hairline}"
    textColor: "{colors.body-muted}"
    typography: "{typography.caption}"
    rounded: "{rounded.none}"
    height: "1px"
---

## Overview

Coursera's marketing chrome resolves one productive tension: a learning marketplace serious enough to enroll degree-seekers but approachable enough to convert casual browsers, rendered with a single voltage blue (`{colors.primary}` — `#0056d2`) and one typeface (Source Sans Pro). The canvas is white edge-to-edge with no gradient mesh and no atmospheric photography; the hero splits horizontally into a deep navy (`{colors.callout-navy}` — `#002761`) "Start, switch, or advance your career" callout card on the left and a white "Top courses" tile-stack on the right. Display headlines sit at 28px / weight 600 / `-0.28px` letter-spacing inside the navy card; section h2s drop to 20px / weight 600 / `-0.06px` tracking on the white panels below.

**Voltage scarcity**: where most learning-platform brands recruit two or three saturated accents to differentiate course categories, Coursera holds one blue (`#0056d2`) for every primary action and one navy (`#002761`) for every brand-band moment. The pastel category-pill row at mid-page introduces low-saturation tints — `#f0f6ff` blue, `#fff4e8` warning-cream, `#ffe0f9` pink-soft, `#a678f5` purple — but these scope strictly to the filter row and the marketing illustration cards; they never carry actions or display type. The discipline keeps the page legible at scale: 14–16 course tiles, 12 category pills, 6 testimonial portraits, and three CTAs share a viewport without chromatic competition.

Unlike the convention of softening enterprise learning with serif gravitas or cartoon mascots, Coursera commits to a humanist sans (Source Sans Pro) at weights 400 and 600 across every text role — display, h2, body, action, label. There is no second typeface on the captured surface, no italic flourish, and no display-only display face. The voice reads as workspace-grade reliability rather than warmth — the brand trusts the catalog density and the partner logos (Google, IBM, Meta, Adobe) to carry credibility instead of typographic posture.

**Key Characteristics:**
- Voltage blue CTA (`{colors.primary}` — `#0056d2`) at 8px radius / 36px height — rectangular, not pill, with a 14px Source Sans Pro 600 label at 0.14px letter-spacing
- Navy callout band (`{colors.callout-navy}` — `#002761`) reserved for the hero pitch card and the bottom-of-page 91% testimonial stat panel — never used on body text
- Single-typeface dialect — Source Sans Pro across display, body, action, label; no second family on the captured surface
- White canvas (`{colors.canvas}` — `#ffffff`) edge-to-edge with a four-step gray ladder (`#0f1114`, `#5b6780`, `#dae1ed`, `#e8eef7`) — the surface tint `#e8eef7` carries category chips and form-row backgrounds
- 8px button radius (`--cds-border-radius-100`) paired with 50px capsule chips (`--cds-border-radius-max`) — the role-split between rectangle commit-actions and pill filter-actions
- 48px input height with 16px Source Sans Pro 400 / 24px line-height — generous tap targets for the dominant search-autocomplete bar
- 8px / 12px / 16px / 24px / 48px spacing scale via `--cds-spacing-*` — section gutters at 48px keep the dense course-tile grid breathing

## Colors

The palette splits into four layers: one saturated voltage blue and its pressed step, a navy callout family that owns the hero and stat bands, a four-step structural gray ladder for ink and hairlines, and a small accent set (purple, pink-soft, blue-info, warning-cream) reserved for marketing illustration cards. Every hex was extracted from the 381 `:root` custom properties on `www.coursera.org` and validated against the rendered color count from 2,369 scanned elements.

- **Voltage blue (`#0056d2`)** — frequency 137. Used as text (61), border (61), background (8), shadow (7). The brand voltage, scoped to every primary CTA fill, every link inside body copy, the small enrollment-count icon under each course tile, and `--cds-color-interactive-primary` / `--cds-color-blue-700` / `--cds-color-callouts-background-primary`. The 8 background occurrences are the button fill itself; the 61 text + 61 border occurrences carry the link state.
- **Voltage pressed (`#0048b0`)** — derived from `--cds-color-interactive-primary-hover` and `--cds-color-blue-800`. Used as: hover and active states on every primary CTA; never sits as a standalone surface. The OKLCH step drops the lightness from 0.493 to 0.435 — a subtle press cue rather than a hue shift.
- **Voltage soft (`#e3eeff`)** — derived from `--cds-color-blue-50` and `--cds-color-emphasis-primary-background-weak`. Used as: hover-row tint on the secondary nav, the "Try Coursera Plus" callout-card-secondary background, and the language-switcher selected state.
- **Voltage xsoft (`#f0f6ff`)** — derived from `--cds-color-blue-25` and `--cds-color-interactive-background-primary-hover-weak`. Used as: the lightest blue tint, scoped to category-pill backgrounds and the focused-input invert state via `--cds-color-interactive-stroke-primary-focus-invert`.
- **Callout navy (`#002761`)** — frequency 2. Used as background (2). Reserved for the navy hero callout card and the bottom-of-page 91% testimonial stat band — the two structural navy moments that bracket the marketing flow. Carried by `--cds-color-blue-950`, `--cds-color-emphasis-primary-background-xxstrong`, and `--cds-color-callouts-background-primary-strong`.
- **Callout navy mid (`#003b8f`)** — derived from `--cds-color-blue-900` and `--cds-color-callouts-tertiary`. Used as: the mid-step in the navy ladder, scoped to the navy-card secondary heading inside the hero pitch panel.
- **Callout blue bright (`#3587fc`)** — frequency 1. Used as gradient (1). The lightest brand-layer blue, carried by `--cds-color-blue-500` and `--cds-color-emphasis-primary-background-default` — used inside the navy callout card's gradient lift on the hero card top edge.
- **Ink (`#0f1114`)** — frequency 2157. Used as text (1110), border (1046), background (1). The most-common color in the extraction, declared as `--cds-color-grey-975` and `--cds-color-emphasis-neutral-background-xxstrong`. Carries every course title, every nav link, every form label, every dense FAQ-row paragraph.
- **Ink soft (`#1e2229`)** — derived from `--cds-color-grey-950`. Used as: the slightly lifted near-black variant, scoped to elevated card text and the dark-mode invert variant.
- **Body muted (`#5b6780`)** — frequency 186. Used as text (92), border (92), background (2). The mid-gray (`--cds-color-grey-600`, `--cds-color-emphasis-neutral-content-default`) that carries every secondary paragraph, the partner-logo caption text, and the inactive nav link.
- **Body mid (`#8495b0`)** — derived from `--cds-color-grey-400` and `--cds-color-neutral-stroke-primary`. Used as: the inactive interactive stroke color and the disabled-form-row text — one step lighter than `body-muted`.
- **Hairline (`#dae1ed`)** — frequency 47. Used as border (47). The 1px structural divider (`--cds-color-grey-100`, `--cds-color-neutral-stroke-primary-weak`) — every section break, course-tile-card border, and FAQ-row separator is this color.
- **Surface tint (`#e8eef7`)** — frequency 74. Used as background (39), border (27), gradient (4), text (4). The pastel-blue chip background (`--cds-color-grey-50`, `--cds-color-interactive-background-secondary-pressed-weak`) — carries the category-pill tinted variant and the form-row hover state.
- **Canvas white (`#ffffff`)** — frequency 508. Used as text (229), border (213), background (60), gradient (6). The dominant canvas (`--cds-color-neutral-background-primary`); the 229 text occurrences are inside the navy callout card and the testimonial stat band.
- **Warning soft (`#fff4e8`)** — frequency 5. Used as background (5). The cream tint carried by `--cds-color-yellow-25` and `--cds-color-emphasis-tertiary-background-xweak` — scoped to one illustration card in the "Browse popular categories" row.
- **Accent purple (`#a678f5`)** — frequency 1. Used as gradient (1). The purple-400 step (`--cds-color-purple-400`, `--cds-color-emphasis-quaternary-background-default`) — appears as a gradient stop inside one of the brand-illustration cards mid-page.
- **Accent pink soft (`#ffe0f9`)** — frequency 1. Used as gradient (1). The pink-50 tint (`--cds-color-pink-50`) — scoped to one marketing-illustration card.
- **Accent blue info (`#b0e5fb`)** — derived from `--cds-color-callouts-tertiary-invert`. Used as: the only declared color whose value is a literal hex rather than a `light-dark()` pair — the callouts-tertiary-invert tint used inside informational chip illustrations.
- **Black (`#000000`)** — frequency 2. Used as text (1), border (1). The pure-black token (`--cds-color-white-0` in dark mode, `--cds-color-neutral-primary` in dark mode) — appears twice on the captured surface, scoped to one icon stroke.

The 381 `:root` properties extend this with full feedback (`#276a1a` success, `#a32e00` warning, `#d30a28` error) and emphasis ladders (purple, pink, yellow, green from `-25` through `-975`), but the captured marketing surface uses the nineteen tokens above as its working palette.

## Typography

Coursera runs one declared face — Source Sans Pro — across every text role on the captured surface. The CSS variable `--cds-font-family-source-sans-pro` resolves to `"Source Sans Pro, Arial, sans-serif"`, and the same string carries `--cds-font-family-body`, `--cds-font-family-title`, and `--cds-font-family-display`. A second family — `--cds-font-family-boutros-coursera: "Boutros Coursera, Tahoma, sans-serif"` — is declared for Arabic locales but not used on the English-default marketing surface this page captures.

**Display-md** sits at 28px / weight 600 / `-0.28px` letter-spacing / 32px line-height on the navy hero callout heading "Start, switch, or advance your career" (extraction count 3, observed on `<h2>`). **Heading-md** drops to 20px / weight 600 / `-0.06px` tracking on the white section h2s "What are you looking to learn?", "Browse popular categories", "Why people choose Coursera" (count 16+7, observed on `<h2>` and `<a>`). **Subtitle-md** at 14px / weight 600 / `-0.042px` tracking carries the course-tile-card title row (count 28).

**Body-md** runs at 16px / weight 400 / 24px line-height for the longest paragraphs and primary input text (count 11). **Body-sm** at 14px / weight 400 / 20px line-height is the workhorse (count 127) — the most-frequent typography signature in the extraction by a 4x margin; it carries every secondary paragraph, every category description, and every nav-row sub-label. **Body-xs** at 12px / weight 400 / 18px line-height appears on the dense legal copy and timestamp captions (count 18).

**Action-primary** at 14px / weight 600 / `0.14px` letter-spacing is the CTA label — extraction count 13, observed on `<span>` and `<p>` inside button rows. **Action-strong** lifts the weight to 700 with the same 0.14px tracking for the higher-emphasis "Get started for free" panel buttons (count 1). **Nav-link** at 16px / weight 600 / 40px line-height carries the top-nav row "For Individuals", "For Businesses", "For Universities" labels (extraction count for the `0.06px` 600-weight 16px signature: 30). **Caption** at 12px / weight 400 / 12px line-height runs the smallest UI text (count 21).

**Weight strategy**: the system runs weights 400, 600, and a single 700 emphasis state. There is no weight 300 display, no weight 500 mid-step, and no weight 800 / 900. The three-weight discipline keeps the single typeface from drifting between roles — display reads as 600, body as 400, the rare emphasis stamp as 700.

## Layout

Sections stack at `{spacing.xxl}` (48px) to `{spacing.section}` (64px) gutters with the white canvas running continuously between them. The captured 4451px scroll shows nine primary blocks: top nav row, hero (navy callout card + white course-tile column at 50/50 split), partner-logo strip, "What are you looking to learn?" search-and-category row, "Browse popular categories" pastel-card row, "New on Coursera" course-tile grid, "Master in-demand skills" 4-tile illustrated section, "Why people choose Coursera" 4-portrait testimonial row, the navy 91% stat band, and the footer-FAQ accordion.

Content sits in a ~1280px max-width column with `0px 48px` page-gutter padding (the second-most-frequent spacing value, count 13). The hero splits 50/50 — navy card left, course tiles right — using the 16px card radius (`--cds-border-radius-200`) on both. The course-tile grid runs 3 columns desktop at `{spacing.base}` (16px) gutter; the category-pill row wraps at `{rounded.full}` (50px capsule) with 8–12 chips per visual band. The testimonial stat band ("91% of learners report career benefits") is the only full-width navy rectangle — 100% canvas-width, ~200px tall, with the stat number left-aligned and the four testimonial portraits floating right.

## Elevation & Depth

Coursera's depth vocabulary is conservative. The site declares a three-level elevation scale via CSS variables: `--cds-elevation-level1` (`0px 0px 4px 0px rgb(15 17 20 / 10%), 0px 2px 12px 2px rgb(15 17 20 / 10%)`), `--cds-elevation-level2` (12px blur + 4px y-offset), and `--cds-elevation-level3` (12px blur + 6px y-offset). The shadow color is `rgb(15 17 20 / 10%)` — a low-opacity tint of the ink color rather than a saturated brand shadow.

Course-tile cards sit flat on the white canvas at the rendered viewport with a 1px hairline border at `{colors.hairline}` (`#dae1ed`) rather than a drop shadow — **border-as-elevation**: the system prefers the 1px stroke to a 4–12px blur, keeping the dense 3-column grid visually tight. Drop shadows appear only on floating elements (dropdown menus, hover-state tooltips) where the elevation needs to read against an arbitrary background. The navy callout card and the testimonial stat band carry no shadow at all — they sit as flat rectangles on the white canvas.

## Shapes

The radius vocabulary is anchored by `--cds-border-radius-100: 8px` (count 93 — the dominant value) and the role-split between rectangle action buttons and capsule filter chips. Primary CTAs, secondary buttons, text inputs, partner-logo tiles, and the small course-tile-card chevron icons all round at 8px. Course tiles and the navy callout card round at 16px (`--cds-border-radius-200`, count 23). Feature sections and the larger illustration cards reach 24px (`--cds-border-radius-300`, count 11).

The two extremes carry semantic weight. At the small end, 2px (`--cds-border-radius-25`, count 26) is reserved for inline skill chips and the small dropdown chevron containers — almost rectangular. At the large end, 50px (`--cds-border-radius-max`, count 22) is the capsule used for category-filter pills — fully rounded. There is no 12px option in the captured radii — the system jumps directly from 8px to 16px to 24px, mirroring the spacing scale's 8 / 16 / 24 / 32 step.

## Components

- **`button-primary`** — voltage-blue fill (`{colors.primary}`), white action-primary label (`{typography.action-primary}`), 8px radius (`{rounded.md}`), 36px height with `8px 16px` padding. The defining action element on every "Enroll now", "Join for Free", "Start 7-day free trial".
- **`button-primary-hover`** — voltage-pressed fill (`{colors.primary-pressed}`); same geometry as the base button.
- **`button-secondary`** — white fill, ink-black label, 1px ink-black border. Used for "Sign In", "Get started" alternatives, and the navy-card secondary action when paired with the primary blue.
- **`button-on-navy`** — voltage-blue fill on the navy callout card; the only place a saturated blue button sits on a saturated navy surface, by deliberate contrast.
- **`link-inline`** — voltage-blue text inside body copy, weight 400 / 14px / no underline by default but underlined via `--cds-text-decoration-link: underline` on hover.
- **`top-nav`** — white 76px-tall bar with a 1px hairline bottom border, carrying the Coursera wordmark left and the For Individuals / For Businesses / For Universities row right.
- **`nav-link`** — 16px / weight 600 / 40px line-height label, ink-black text on transparent. Hover shifts to voltage-blue.
- **`text-input`** + **`text-input-focused`** — 48px-tall white input at 8px radius with a 1px ink-black border; focus swaps to a 2px voltage-blue border via `--cds-color-interactive-stroke-primary-focus: #6923de` reskinned for the search bar to `{colors.primary}`. The dominant search-autocomplete bar carries this geometry at 394px width on desktop.
- **`callout-card-navy`** — the hero card with `{colors.callout-navy}` (`#002761`) fill, white display-md heading, white body-md paragraph, voltage-blue primary CTA inside. 16px radius, 32px padding.
- **`course-tile-card`** — white fill with 1px hairline border, 16px radius, 16px padding. Carries the course thumbnail, the partner-logo strip ("Google", "IBM", "Meta"), the course title in subtitle-md, the body-sm summary, and the small voltage-blue enrollment-count icon at footer.
- **`category-pill`** + **`category-pill-tinted`** — 50px-capsule chip at `{rounded.full}` with 8px / 16px padding. The base is white with hairline border; the tinted variant fills with `{colors.surface-tint}` (`#e8eef7`) and removes the border.
- **`skill-chip`** — the small inline chip at 2px radius (`{rounded.xs}`) with surface-tint fill and callout-navy text — used inside course-tile cards to tag specific skills ("Python", "Data Analysis").
- **`testimonial-stat-band`** — the navy bottom-of-page stat panel with `{colors.callout-navy}` fill, white body-md text, and a large "91%" numeral. 16px radius, `48px 32px` padding.
- **`faq-row`** — the bottom-of-page accordion row with 1px hairline bottom border, body-md text, 16px vertical padding. The expand-chevron sits 2px-radius on the right.
- **`partner-logo-tile`** — the white square logo container in the partner-logo strip, 8px radius, 16px padding, 1px hairline border.
- **`hairline-divider`** — 1px `{colors.hairline}` (`#dae1ed`) line; the structural separator between every section.

## Do's and Don'ts

**Do** use `#0056d2` for primary CTAs and inline links only — never for body text, large surface fills, or section backgrounds. The brand reserves the voltage blue for action signal; treating it as a generic accent dilutes the wordmark voltage.

**Do** keep button labels at `0.14px` letter-spacing — the slight positive tracking on Source Sans Pro at 14px / weight 600 is the brand's UI-confidence cue. Default zero tracking reads as a different system.

**Do** pair the navy callout card (`#002761`) with a voltage-blue CTA (`#0056d2`) inside the same surface — the two-blue layering is the brand's hero signature. A white or gray button inside the navy card breaks the chromatic rhythm.

**Do** keep primary buttons at 8px radius and skill / category chips at 50px capsule — the role-split between rectangle action and pill filter is the system's geometric move.

**Don't** use `#dae1ed` as a body fill or large surface — it's a border-only token (frequency 47, all `border`, zero `bg`, zero `text`). For light surfaces use `{colors.surface-tint}` (`#e8eef7`) at 74 occurrences or `{colors.canvas}` (`#ffffff`) at 508.

**Don't** introduce a second typeface on the English-locale surface — the system is mono-family by design. The declared `--cds-font-family-boutros-coursera` is reserved for Arabic-locale display only; pairing a serif headline with Source Sans Pro body breaks the single-family discipline.

**Don't** lean on the pastel callout-band tints (`#fff4e8`, `#ffe0f9`, `#a678f5`) for primary CTAs or body text — each appears in 1–5 occurrences total, all scoped to one illustration card or one gradient stop. Treating them as a general accent palette overstates the brand's chromatic surface area.

**Don't** add a drop shadow to course-tile cards — the system prefers a 1px hairline border (`{colors.hairline}`) as the elevation cue. Drop shadows appear only on floating menus and tooltips that need to read against an arbitrary background; flat-card-with-hairline is the marketing-surface convention.

**Don't** use weight 500 in Source Sans Pro — the system runs a strict 400 / 600 / 700 trio. Intermediate weights read as a different family and break the three-weight discipline.

## Known Gaps

- **Authenticated app chrome not captured** — the in-course player, the assignment-submission flow, the certificate dashboard, and the Coursera Plus subscription surfaces are out of scope. This document captures the marketing surface at `coursera.org` for an anonymous visitor.
- **Dark mode tokens declared but not rendered** — the 381 `:root` properties include `light-dark()` pairs for nearly every color, hinting at a dark theme that the marketing surface does not currently render. The dark variants are declared but not extracted as a coherent surface ladder.
- **Boutros Coursera Arabic family not characterized** — the second declared typeface family is acknowledged in tokens but its sizes, weights, and role mapping aren't captured because the captured locale is English.
- **Motion and transition timings out of scope** — Coursera declares `--labs-duration-fast: 150ms`, `--labs-duration-normal: 300ms`, `--labs-duration-slow: 500ms` and an `--labs-easing-standard: ease-in-out`, but the per-component animation choreography isn't extracted here.
- **Form validation states beyond focus** — the input system captured covers default and focused-border states; success, warning, and error border treatments are inferred from the feedback color tokens (`--cds-color-feedback-success`, `--cds-color-feedback-warning`, `--cds-color-feedback-error`) but not directly extracted.
- **Pastel illustration-card mapping is observation-based** — which feature card uses warning-cream versus pink-soft versus accent-blue-info is inferred from the captured screenshot rather than a documented brand library.
