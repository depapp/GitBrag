# Contributing to GitBrag

Thanks for helping out. Keep it simple:

1. Open an issue first for anything bigger than a small fix so we can agree on the approach.
2. Fork, branch from `main`, and keep pull requests focused on one change.
3. Before pushing run:

   ```bash
   npm run lint
   npm run typecheck
   npm test
   npm run build
   ```

4. Match the existing style (Prettier is configured; `npm run format`).
5. The product name is written **GitBrag** in anything user-facing. Lowercase `gitbrag` is only for package, repository and URL identifiers.

## Project layout

```
src/app                 routes (landing, /u/[login], API card endpoints, OG image)
src/components          UI: site chrome, landing sections, profile widgets, search
src/lib/github          GitHub GraphQL client, queries, contribution fetching, stats
src/lib/cards           share card (Satori JSX) and SVG badge renderers
src/assets/fonts        bundled fonts used by the image renderer
```

## Reporting bugs

Include the GitHub username you searched for, the URL, and what you expected. Do not paste your `GITHUB_TOKEN` anywhere.
