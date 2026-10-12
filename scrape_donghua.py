#!/usr/bin/env python3
"""
Scrape public Lucifer Donghua listing pages for:
- title
- detail_url
- image_url

Usage:
    python3 scrape_donghua.py

Install:
    python3 -m pip install requests beautifulsoup4

Notes:
- Respects robots.txt by default.
- Does not bypass access controls or scrape video streams.
- CSS selectors are configurable below and can be adjusted after inspecting page HTML.
"""

from __future__ import annotations

import csv
import json
import logging
import os
import re
import time
from collections import deque
from pathlib import Path
from urllib.parse import urljoin, urlparse, urldefrag
from urllib.robotparser import RobotFileParser

import requests
from bs4 import BeautifulSoup
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry


# -------------------- Configuration --------------------

BASE_URL = os.environ.get("SCRAPE_BASE_URL", "https://luciferdonghua.in").rstrip("/")
START_URL = os.environ.get("SCRAPE_START_URL", f"{BASE_URL}/page/2/")
OUTPUT_CSV = Path("donghua_all.csv")
CHECK_ROBOTS_TXT = True

# Keep requests polite. Increase only if the website permits it.
REQUEST_DELAY_SECONDS = max(1.5, float(os.environ.get("SCRAPE_DELAY_SECONDS", "1.5")))
TIMEOUT_SECONDS = 20
MAX_PAGES = max(1, int(os.environ.get("SCRAPE_MAX_PAGES", "500")))

# Inspectable selectors: try common WordPress/anime-theme containers.
# If no entries are found, inspect the HTML and update these selectors.
CARD_SELECTORS = [
    "article",
    ".animepost",
    ".bsx",
    ".uta",
    ".utao",
    ".post",
]
TITLE_LINK_SELECTORS = [
    "h2 a[href]",
    "h3 a[href]",
    ".tt a[href]",
    ".bsx a[href]",
    ".uta a[href]",
    "a[href][title]",
]
IMAGE_SELECTORS = ["img"]

# Pagination selectors. The URL filter below prevents crawling unrelated pages.
PAGINATION_SELECTORS = [
    ".pagination a[href]",
    ".nav-links a[href]",
    ".page-numbers[href]",
    "a.l[href]",
    "a.r[href]",
    "a.next[href]",
    "a.prev[href]",
    "a[rel='next'][href]",
    "a[rel='prev'][href]",
]


# -------------------- Logging and HTTP --------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s: %(message)s",
)
logger = logging.getLogger("donghua-scraper")


class RefusedRedirect(Exception):
    def __init__(self, location: str | None):
        self.location = location
        super().__init__(f"Refused redirect to {location or '(missing location)'}")


def build_session() -> requests.Session:
    session = requests.Session()
    session.headers.update({
        "User-Agent": "DonghuaCatalogMetadataBot/1.0",
        "Accept": "text/html,application/xhtml+xml",
    })

    retry = Retry(
        total=3,
        connect=3,
        read=3,
        backoff_factor=1.0,
        status_forcelist=(429, 500, 502, 503, 504),
        allowed_methods=frozenset(["GET"]),
        respect_retry_after_header=True,
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    return session


def load_robots_parser(session: requests.Session) -> RobotFileParser | None:
    robots_url = urljoin(BASE_URL, "/robots.txt")
    parser = RobotFileParser()
    parser.set_url(robots_url)

    try:
        response = session.get(robots_url, timeout=TIMEOUT_SECONDS, allow_redirects=False)
        if response.status_code == 200:
            parser.parse(response.text.splitlines())
            logger.info("Loaded robots.txt")
            return parser
        logger.warning(
            "robots.txt returned HTTP %s; cannot verify crawl rules.",
            response.status_code,
        )
    except requests.RequestException as exc:
        logger.warning("Could not read robots.txt: %s", exc)

    # Fail closed when robots.txt cannot be checked.
    return None


def is_allowed_by_robots(
    parser: RobotFileParser | None, url: str, user_agent: str
) -> bool:
    if parser is None:
        logger.error("Skipping %s because robots.txt rules could not be verified.", url)
        return False
    return parser.can_fetch(user_agent, url)


# -------------------- URL and HTML helpers --------------------

def normalize_url(url: str) -> str:
    url, _fragment = urldefrag(url)
    parsed = urlparse(url)
    if parsed.netloc.lower() == urlparse(BASE_URL).netloc.lower() and parsed.path.rstrip("/") == "/page/1":
        return BASE_URL
    return url.rstrip("/") + "/" if parsed.path not in ("", "/") else url


def is_listing_page(url: str) -> bool:
    """Accept only same-host root archive pages and /page/N/ URLs."""
    parsed = urlparse(url)
    base = urlparse(BASE_URL)

    if parsed.scheme not in ("http", "https") or parsed.netloc.lower() != base.netloc.lower():
        return False

    path = parsed.path.rstrip("/")
    if path in ("", "/"):
        return True
    return bool(re.fullmatch(r"/page/\d+", path))


def get_soup(session: requests.Session, url: str) -> BeautifulSoup | None:
    try:
        response = session.get(url, timeout=TIMEOUT_SECONDS, allow_redirects=False)
        if 300 <= response.status_code < 400:
            logger.warning("Refusing redirect at %s (%s)", url, response.status_code)
            raise RefusedRedirect(response.headers.get("Location"))
        response.raise_for_status()

        content_type = response.headers.get("Content-Type", "")
        if content_type and "html" not in content_type.lower():
            logger.warning("Skipping non-HTML response at %s (%s)", url, content_type)
            return None

        return BeautifulSoup(response.text, "html.parser")

    except requests.HTTPError as exc:
        status = exc.response.status_code if exc.response is not None else "unknown"
        logger.error("HTTP error %s for %s", status, url)
    except requests.Timeout:
        logger.error("Request timed out for %s", url)
    except requests.RequestException as exc:
        logger.error("Request failed for %s: %s", url, exc)

    return None


def first_matching_link(card):
    for selector in TITLE_LINK_SELECTORS:
        link = card.select_one(selector)
        if link and link.get("href"):
            href = link["href"].strip()
            if href and not href.startswith(("javascript:", "mailto:", "#")):
                return link
    return None


def extract_image_url(card, page_url: str) -> str:
    image = None
    for selector in IMAGE_SELECTORS:
        image = card.select_one(selector)
        if image:
            break

    if not image:
        return ""

    # Lazy-loading themes may store the real image in data-src or srcset.
    for attr in ("data-src", "data-lazy-src", "data-original", "data-lazyload", "src"):
        value = image.get(attr)
        if value and value.strip() and not value.strip().startswith("data:"):
            return urljoin(page_url, value.strip())

    srcset = image.get("data-srcset") or image.get("srcset")
    if srcset:
        # Use the first candidate in the srcset.
        first_candidate = srcset.split(",")[0].strip().split(" ")[0]
        if first_candidate and not first_candidate.startswith("data:"):
            return urljoin(page_url, first_candidate)

    return ""


def scrape_cards(soup: BeautifulSoup, page_url: str) -> list[dict[str, str]]:
    cards = []
    seen_card_ids = set()

    for selector in CARD_SELECTORS:
        for card in soup.select(selector):
            link = first_matching_link(card)
            if not link:
                continue

            title = (
                link.get("title")
                or link.get_text(" ", strip=True)
                or card.get_text(" ", strip=True)
            ).strip()
            detail_url = urljoin(page_url, link["href"].strip())

            # Ignore links that point back to the listing itself.
            if not title or not is_allowed_detail_url(detail_url):
                continue

            detail_url = normalize_url(detail_url)
            if detail_url in seen_card_ids:
                continue
            seen_card_ids.add(detail_url)

            cards.append({
                "title": title,
                "detail_url": detail_url,
                "image_url": extract_image_url(card, page_url),
                "synopsis": "",
                "status": "",
                "genres": "",
                "episodes": "[]",
                "alternative_titles": "",
                "type": "TV",
                "release_year": "",
                "season": "",
                "studio": "",
            })

        if cards:
            # Prefer the first selector that yields results to avoid mixing
            # nested containers and duplicate cards from multiple selector types.
            break

    return cards


def scrape_detail_metadata(
    soup: BeautifulSoup, row: dict[str, str]
) -> dict[str, str]:
    """Extract visible textual metadata only; never inspect or fetch video sources."""
    description = ""
    for selector in (
        'meta[property="og:description"]',
        'meta[name="description"]',
        ".entry-content p",
        ".entry-content",
        ".synopsis",
        ".description",
    ):
        element = soup.select_one(selector)
        if not element:
            continue
        description = (
            element.get("content", "") if element.name == "meta"
            else element.get_text(" ", strip=True)
        ).strip()
        if description:
            break

    genres = []
    for selector in (".genxed a", ".genres a", ".genre a", 'a[rel="tag"]'):
        for element in soup.select(selector):
            name = element.get_text(" ", strip=True)
            if name and name not in genres:
                genres.append(name)
        if genres:
            break

    episode_metadata = {}
    for selector in (".eplister a", ".episodelist a", ".episode-list a"):
        for element in soup.select(selector):
            title = element.get_text(" ", strip=True)
            match = re.search(r"\b(?:episode|ep\.?)\s*(\d+)\b", title, re.I)
            if title and match:
                episode_number = int(match.group(1))
                episode_metadata.setdefault(episode_number, {
                    "episodeNumber": episode_number,
                    "title": title[:300],
                })
        if episode_metadata:
            break
    if not episode_metadata:
        episode_numbers = re.search(
            r"\b(?:episode|ep\.?)\s*(\d+)(?:\s*(?:and|&)\s*(\d+))?",
            row["title"],
            re.I,
        )
        if episode_numbers:
            for number in episode_numbers.groups():
                if number:
                    episode_number = int(number)
                    episode_metadata.setdefault(episode_number, {
                        "episodeNumber": episode_number,
                        "title": f"Episode {episode_number}",
                    })

    status = ""
    for element in soup.select(".spe span, .info-content, .spe"):
        text = element.get_text(" ", strip=True)
        match = re.search(
            r"\bstatus\s*:\s*(.*?)(?=\s+\b(?:type|released|season|duration|network)\s*:|$)",
            text,
            re.I,
        )
        if match:
            status = match.group(1).strip(" []|").upper()[:40]
            break

    alternative_titles = []
    for selector in (".alter", ".alternative-title", ".alternative-titles", ".alternative"):
        element = soup.select_one(selector)
        if element:
            value = element.get("content", "") if element.name == "meta" else element.get_text(" ", strip=True)
            alternative_titles.extend(
                title.strip() for title in re.split(r"[,;|/]", value) if title.strip()
            )
            if alternative_titles:
                break

    page_text = soup.get_text(" ", strip=True)
    year_match = re.search(r"\b(19\d{2}|20\d{2})\b", page_text)
    year = year_match.group(1) if year_match else ""
    season_match = re.search(r"\b(Spring|Summer|Fall|Autumn|Winter)\s*(?:19|20)\d{2}\b", page_text, re.I)
    season = season_match.group(1).title().replace("Autumn", "Fall") if season_match else ""
    studio = ""
    for selector in (".studio a", ".studios a", '[itemprop="productionCompany"]'):
        element = soup.select_one(selector)
        if element:
            studio = element.get_text(" ", strip=True)[:200]
            break
    type_match = re.search(r"\b(OVA|ONA|Movie|Special|TV)\b", page_text, re.I)
    anime_type = type_match.group(1).upper() if type_match else "TV"
    if anime_type not in ("TV", "MOVIE", "OVA", "ONA", "SPECIAL"):
        anime_type = "TV"

    row["synopsis"] = description[:10000]
    row["status"] = status[:40]
    row["genres"] = "|".join(genres[:30])
    row["alternative_titles"] = "|".join(alternative_titles[:20])
    row["type"] = anime_type
    row["release_year"] = year
    row["season"] = season
    row["studio"] = studio
    row["episodes"] = json.dumps(
        [episode_metadata[number] for number in sorted(episode_metadata)],
        ensure_ascii=False,
    )
    return row


def is_allowed_detail_url(url: str) -> bool:
    parsed = urlparse(url)
    base = urlparse(BASE_URL)
    return (
        parsed.scheme in ("http", "https")
        and parsed.netloc.lower() == base.netloc.lower()
        and not is_listing_page(url)
    )


def find_pagination_urls(soup: BeautifulSoup, current_url: str) -> set[str]:
    found = set()

    for selector in PAGINATION_SELECTORS:
        for link in soup.select(selector):
            href = link.get("href")
            if not href:
                continue

            candidate = normalize_url(urljoin(current_url, href.strip()))
            if is_listing_page(candidate):
                found.add(candidate)

    # Also discover explicit /page/N/ links in the document, but only when
    # they are inside likely pagination elements.
    return found


# -------------------- Crawl and CSV --------------------

def crawl_all_listing_pages() -> list[dict[str, str]]:
    session = build_session()
    robots = load_robots_parser(session)
    user_agent = session.headers.get("User-Agent", "*")

    if CHECK_ROBOTS_TXT and robots is None:
        logger.error(
            "Crawl stopped: robots.txt could not be verified. "
            "No pages will be requested until its rules can be checked."
        )
        return []

    start = normalize_url(START_URL)
    queue = deque([start])
    visited_pages = set()
    all_rows = []
    seen_details = set()
    consecutive_home_redirects = 0

    while queue and len(visited_pages) < MAX_PAGES:
        page_url = queue.popleft()
        page_url = normalize_url(page_url)

        if page_url in visited_pages:
            continue
        if not is_listing_page(page_url):
            continue
        if not is_allowed_by_robots(robots, page_url, user_agent):
            logger.warning("Robots.txt disallows listing page: %s", page_url)
            continue

        if visited_pages:
            time.sleep(REQUEST_DELAY_SECONDS)

        logger.info("Fetching listing page %d: %s", len(visited_pages) + 1, page_url)
        try:
            soup = get_soup(session, page_url)
        except RefusedRedirect as exc:
            location = urljoin(page_url, exc.location or "")
            current_match = re.fullmatch(r"/page/(\d+)/?", urlparse(page_url).path)
            canonical_home_redirect = (
                urlparse(location).netloc.lower() == urlparse(BASE_URL).netloc.lower()
                and urlparse(location).path.rstrip("/") in ("", "/")
            )
            if not current_match or not canonical_home_redirect:
                raise RuntimeError(
                    f"Archive page redirected to an unexpected destination; refusing an incomplete crawl: {page_url}"
                ) from exc
            visited_pages.add(page_url)
            consecutive_home_redirects += 1
            if consecutive_home_redirects == 1:
                next_number = int(current_match.group(1)) + 1
                candidate = normalize_url(f"{BASE_URL}/page/{next_number}/")
                if is_allowed_by_robots(robots, candidate, user_agent):
                    logger.info(
                        "Archive page %s redirects to the homepage; not following it. "
                        "Checking the next numbered archive URL: %s",
                        page_url,
                        candidate,
                    )
                    queue.append(candidate)
            else:
                logger.info("Consecutive archive URLs redirect to the homepage; treating this as the archive end.")
            continue
        visited_pages.add(page_url)
        consecutive_home_redirects = 0

        if soup is None:
            raise RuntimeError(f"Could not read archive page {page_url}; refusing to save a partial catalog.")

        rows = scrape_cards(soup, page_url)
        logger.info("Extracted %d entries from %s", len(rows), page_url)

        if not rows:
            logger.warning(
                "No cards found. Inspect the page HTML and update CARD_SELECTORS "
                "or TITLE_LINK_SELECTORS."
            )

        for row in rows:
            if row["detail_url"] not in seen_details:
                seen_details.add(row["detail_url"])
                all_rows.append(row)

        for next_url in find_pagination_urls(soup, page_url):
            if next_url not in visited_pages and next_url not in queue:
                queue.append(next_url)

    if queue:
        raise RuntimeError(
            f"Reached SCRAPE_MAX_PAGES={MAX_PAGES} with {len(queue)} archive pages still undiscovered; "
            "increase the safety cap and rerun to avoid importing an incomplete crawl."
        )

    for index, row in enumerate(all_rows):
        detail_url = row["detail_url"]
        if not is_allowed_detail_url(detail_url):
            continue
        if not is_allowed_by_robots(robots, detail_url, user_agent):
            logger.info("Robots.txt disallows detail page: %s", detail_url)
            continue
        time.sleep(REQUEST_DELAY_SECONDS)
        logger.info("Fetching metadata page %d/%d: %s", index + 1, len(all_rows), detail_url)
        try:
            soup = get_soup(session, detail_url)
        except RefusedRedirect:
            logger.warning("Skipping redirected detail page without following it: %s", detail_url)
            continue
        if soup is not None:
            scrape_detail_metadata(soup, row)

    logger.info("Visited %d listing pages; collected %d unique entries.",
                len(visited_pages), len(all_rows))
    return all_rows


def save_csv(rows: list[dict[str, str]], output_path: Path) -> None:
    fieldnames = [
        "title", "detail_url", "image_url", "synopsis", "status", "genres", "episodes",
        "alternative_titles", "type", "release_year", "season", "studio",
    ]
    try:
        with output_path.open("w", newline="", encoding="utf-8-sig") as file:
            writer = csv.DictWriter(file, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)
        logger.info("Saved CSV: %s", output_path.resolve())
    except OSError:
        logger.exception("Could not write CSV %s", output_path)
        raise


def main() -> None:
    rows = crawl_all_listing_pages()
    if not rows:
        raise RuntimeError(
            "No records collected. Check network access, robots.txt, and selectors. "
            "This scraper does not bypass blocks or access controls."
        )
    save_csv(rows, OUTPUT_CSV)


if __name__ == "__main__":
    main()
