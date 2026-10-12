# AniFrame

AniFrame is a responsive anime catalog built with Next.js App Router, TypeScript, Tailwind CSS, Prisma, and a deployed PostgreSQL database. Public catalog metadata is collected by a Python scraper and stored in PostgreSQL; the site serves stored records through its API. The scraper never inspects, extracts, or downloads video streams. Playback only accepts sources you own or are authorized to use.

## Features

- Home, catalog, anime details, episode watch, search, local watchlist, schedule, genre, and profile pages.
- Responsive dark interface, filtering, sorting, pagination, and loading/error/empty states.
- Prisma schema/migrations, REST endpoints, protected metadata-import endpoint.
- Python scraper checks `robots.txt`, follows same-host archive pagination, and rate-limits requests.
- Weekly GitHub Actions import workflow, also manually dispatchable.

Catalog rows from `donghua_all.csv` contain public listings and may not establish accurate series grouping or full metadata. Details not present on the source page are left blank. Schedule and mock records are sample data, not live release claims.

## Requirements and setup

- Node.js 22 (20.9+ minimum for Next.js)
- Python 3.9+
- A reachable PostgreSQL 14+ database (already deployed; no Docker Compose required)

1. Copy `.env.example` to `.env` and set `DATABASE_URL` to your PostgreSQL provider's connection URL. Keep it private and never commit `.env`. Set `ADMIN_API_TOKEN` to a long random value if you will use the protected import endpoint.
2. Install packages and apply the Prisma schema:

   ```sh
   npm ci
   npm run db:generate
   npm run db:migrate:deploy
   ```

3. Scrape the permitted archive pages and import the CSV. The importer loads `.env` automatically and writes to the database configured by `DATABASE_URL`:

   ```sh
   python3 -m venv .venv
   source .venv/bin/activate
   python -m pip install -r requirements.txt
   python scrape_donghua.py
   npm run db:import-csv
   ```

4. Start the application:

   ```sh
   npm run dev
   ```

   Open <http://localhost:3000>. Check the project with `npm run typecheck`, `npm run lint`, and `npm run build`; serve a production build using `npm start`.

## Scraping and scheduled sync

The scraper defaults to `https://luciferdonghua.in/page/2/`, follows archive previous/next links on the same host, checks `robots.txt` for listing and detail pages, and enforces at least a 1.5-second pause between page requests. It does not bypass access controls or follow redirects. If it cannot verify robots rules or complete listing pagination, it exits without replacing the output CSV. Review the source site's terms and permissions before publishing collected titles, descriptions, or image URLs.

Configure `DATABASE_URL` as a GitHub Actions repository secret for `.github/workflows/catalog-sync.yml`. The workflow runs weekly and can be dispatched manually; it applies migrations, scrapes, and imports. It is not active until the secret is set and a run succeeds. The scrape maximum is a safety cap: if more archive pages remain than the cap permits, the scraper fails rather than importing partial data. A full crawl can take a long time because of the respectful request delay.

No playback URL is collected by the scraper. Only add authorized video sources separately; absent authorized sources are shown as unavailable.

## Configuration

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes for database features | Deployed PostgreSQL connection URL |
| `ADMIN_API_TOKEN` | Only for admin import API | Bearer token for metadata imports |
| `NEXT_PUBLIC_APP_NAME` | No | Site name in page metadata |
| `NEXT_PUBLIC_APP_URL` | No | Canonical site URL; defaults to localhost |
| `ANIME_API_BASE_URL` | No | Reserved external API integration |
| `ANIME_IMAGE_HOSTS` | No | Comma-separated host allowlist for optimized images |
| `CRON_SCHEDULE` | No | Informational local schedule; Actions schedule is in workflow YAML |
| `SCRAPE_BASE_URL` | No | Defaults to `https://luciferdonghua.in` |
| `SCRAPE_START_URL` | No | Defaults to `https://luciferdonghua.in/page/2/` |
| `SCRAPE_DELAY_SECONDS` | No | Delay between requests; never lower than 1.5 seconds |
| `SCRAPE_MAX_PAGES` | No | Archive page safety limit; defaults to 500 |

Development can fall back to sample records if the database is unavailable or empty. Production database failures are returned as errors.

## REST API

List endpoints return `data` and `pagination` (`page`, `limit`, `total`, `pages`).

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/anime?page=1&limit=24&q=immortal&genre=action` | Filter and paginate catalog |
| `GET` | `/api/v1/anime/latest?limit=12` | Recently updated titles |
| `GET` | `/api/v1/anime/search?q=immortal&page=1&limit=24` | Search titles |
| `GET` | `/api/v1/anime/{id-or-slug}` | Anime details |
| `GET` | `/api/v1/anime/{id-or-slug}/episodes` | Episode metadata |
| `GET` | `/api/v1/episodes/{id}` | Episode metadata |
| `GET` | `/api/v1/genres` | Available genres |
| `GET` | `/api/v1/genres/{slug}/anime?page=1&limit=24` | Browse a genre |
| `POST` | `/api/v1/admin/scrape` | Authenticated metadata import |

The import endpoint requires `Authorization: Bearer <ADMIN_API_TOKEN>`. It accepts public metadata and only permits video-source entries marked as authorized by the submitter; that declaration does not establish rights. Only submit video URLs you have permission to use.

## Data ownership and limitations

- Schema and migrations: `prisma/schema.prisma`, `prisma/migrations/`.
- Scraper: `scrape_donghua.py`.
- CSV-to-PostgreSQL importer: `scripts/import-csv.ts`.
- Database catalog/API access: `src/services/anime-repository.ts`, `src/app/api/v1/`.
- Browser watchlist and playback progress are local to that browser; authentication and cross-device sync are not configured.
- Playback supports authorized MP4/HLS sources and supplied subtitles, subject to browser/source compatibility.
