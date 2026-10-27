<p align="center"><img src="src/assets/logo.png" alt="GitBrag" width="120"></p>

# GitBrag

**Show off your open-source contributions.**

GitBrag turns any public GitHub profile into a shareable record of open-source work: merged pull requests to projects the user does not own, the repositories they shipped to, languages, activity over time, and ready-to-post share cards.

- No sign-in. GitBrag reads public data only, using a server-side token.
- Rich link previews for X, LinkedIn, Facebook, Threads, Bluesky, WhatsApp, Reddit, Telegram and Slack.
- Downloadable PNG cards in 1200×630, 1080×1080 and 1080×1920 (story) formats.
- Live SVG badge for your README.
- Deploys to Netlify with one environment variable.

## How contributions are counted

A contribution is a **pull request authored by the user in a repository they do not own**.

| Rule                                              | Behaviour                                                                          |
| ------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Own repositories                                  | excluded                                                                           |
| Forks                                             | excluded                                                                           |
| Archived repositories                             | included                                                                           |
| Repositories of organizations the user belongs to | included, with a one-click toggle to hide them                                     |
| States                                            | merged, open and closed are kept separate; merged drives the headline number       |
| Projects                                          | a repository counts (and adds its stars) only once a pull request there was merged |
| Languages, years active                           | computed from merged pull requests only                                            |

Data comes from the GitHub GraphQL API. Because GitHub search returns at most 1,000 results per query, heavy contributors are fetched year by year, in parallel.

Every GitHub response is cached for one hour, and a report is assembled in short time slices so it fits within serverless function limits (10 s on Netlify's free tier). The first visit to an active contributor's profile shows a progress state while the page polls `/api/report/<login>`; each poll fetches more pages, and once everything is cached the full profile (and its share images) render instantly for the next hour.

## URLs

| Path                                                        | Purpose                                                     |
| ----------------------------------------------------------- | ----------------------------------------------------------- |
| `/`                                                         | landing page with username search                           |
| `/u/<login>`                                                | contribution profile                                        |
| `/u/<login>?orgs=hide`                                      | profile without the user's own organizations                |
| `/u/<login>/opengraph-image`                                | link-preview image (used automatically by social platforms) |
| `/api/card/<login>.svg?theme=dark\|light`                   | README badge                                                |
| `/api/card/<login>.png?format=og\|square\|story&download=1` | share card                                                  |

Embed the badge in a README:

```markdown
[![Open-source contributions](https://gitbrag.tech/api/card/<login>.svg)](https://gitbrag.tech/u/<login>)
```

## Self-hosting

### Requirements

- Node.js 20 or newer
- A GitHub token. A fine-grained personal access token with **no** extra permissions is enough, since GitBrag only reads public data. Without a token GitHub allows 60 requests per hour, which is not enough for real use.

### Local development

```bash
git clone https://github.com/depapp/gitbrag.git
cd gitbrag
npm install
cp .env.example .env.local   # then set GITHUB_TOKEN
npm run dev
```

### Netlify

1. Import the repository in Netlify. The included `netlify.toml` uses `@netlify/plugin-nextjs`; no other build settings are needed.
2. Add the environment variable `GITHUB_TOKEN`.
3. Optionally set `NEXT_PUBLIC_SITE_URL` to your public URL (Netlify's `URL` is used otherwise).

### Environment variables

| Variable               | Required | Description                                                                 |
| ---------------------- | -------- | --------------------------------------------------------------------------- |
| `GITHUB_TOKEN`         | yes      | Server-side token for the GitHub GraphQL API. Never exposed to the browser. |
| `NEXT_PUBLIC_SITE_URL` | no       | Public origin used in share links and metadata. Auto-detected on Netlify.   |

## Scripts

| Command             | Description                        |
| ------------------- | ---------------------------------- |
| `npm run dev`       | start the development server       |
| `npm run build`     | production build                   |
| `npm run lint`      | ESLint                             |
| `npm run typecheck` | generate route types and run `tsc` |
| `npm test`          | unit tests (Vitest)                |
| `npm run format`    | format with Prettier               |

## Tech

Next.js (App Router), React, TypeScript, Tailwind CSS, Recharts, `next-themes`, `next/og` for generated images. No database.

## Contributing

Issues and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Credits

The small 3D icons on profile pages come from Microsoft's [Fluent Emoji](https://github.com/microsoft/fluentui-emoji) (MIT).

The social-network logos in the share section come from [Simple Icons](https://simpleicons.org) (CC0).

## License

[MIT](LICENSE)
