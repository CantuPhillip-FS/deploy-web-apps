# phillipcantu.com

Personal portfolio and blog for **Phillip Cantu** — full-stack developer and U.S. Army veteran.

Live at [phillipcantu.com](https://phillipcantu.com), deployed on Vercel.

## Stack

- [Astro](https://astro.build) — static-first framework; every page is prerendered HTML
- TypeScript everywhere, vanilla CSS with `oklch` design tokens (no CSS framework)
- MDX blog via Astro Content Collections

## Performance choices

- Zero client-side JavaScript — no frameworks hydrate anything (the one inline script on `/hgraph` drives its scroll animations)
- Self-hosted, subset Inter variable font with preload + a metrics-adjusted fallback (no layout shift)
- Build-time image optimization via `astro:assets` / sharp
- Inlined critical CSS, static HTML from the CDN edge

## Commands

| Command           | Action                                    |
| ----------------- | ----------------------------------------- |
| `npm install`     | Install dependencies                      |
| `npm run dev`     | Dev server at `localhost:4321`            |
| `npm run check`   | Type-check (`astro check`)                |
| `npm run build`   | Production build to `.vercel/output/`     |

## Content

Blog posts live in `src/content/blog/<slug>/index.mdx` with images colocated. Frontmatter schema is defined in `src/content.config.ts`. Site-wide data (socials, projects, skills) lives in `src/data/`.
