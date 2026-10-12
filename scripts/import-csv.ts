import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadEnvConfig } from "@next/env";
import { z } from "zod";
import { prisma } from "../src/lib/prisma";
import { importRecords, type ImportRecord } from "../src/lib/catalog-import";

loadEnvConfig(process.cwd());
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be configured in .env or the process environment before importing.");
}

const rowSchema = z.object({
  title: z.string().trim().min(1),
  detail_url: z.string().url(),
  image_url: z.string().url().or(z.literal("")),
  synopsis: z.string().optional(),
  status: z.string().optional(),
  genres: z.string().optional(),
  episodes: z.string().optional(),
  alternative_titles: z.string().optional(),
  type: z.enum(["TV", "MOVIE", "OVA", "ONA", "SPECIAL"]).optional(),
  release_year: z.string().optional(),
  season: z.enum(["Winter", "Spring", "Summer", "Fall"]).or(z.literal("")).optional(),
  studio: z.string().optional(),
});

const episodeMetadataSchema = z.array(z.object({
  episodeNumber: z.number().int().min(0).max(100000),
  title: z.string().trim().min(1).max(300),
})).max(2000);

function normalizeSeriesTitle(title: string) {
  const episodeNumbers = [...title.matchAll(/\b(?:episode|ep\.?)\s*(\d+)(?:\s*(?:and|&)\s*(\d+))?/gi)]
    .flatMap((match) => match.slice(1).filter(Boolean).map(Number));
  const seriesTitle = title
    .replace(/\s*(?:[-|–,]?\s*)(?:episode|ep\.?)\s*\d+(?:(?:\s*(?:and|&)\s*)\d+)?(?:\s*[-|–,:].*)?$/i, "")
    .replace(/\s*(?:english\s+sub|subbed|dubbed|hindi\s+dub|mandarin\s+dub|sub|dub)\s*$/i, "")
    .replace(/\s*\[(?:movie|special)\]\s*/i, " ")
    .replace(/\s*\((?:movie|special)\)\s*/i, " ")
    .replace(/\s+/g, " ")
    .trim();
  return {
    seriesTitle: seriesTitle || title,
    episodeNumbers: [...new Set(episodeNumbers)],
    type: /\bmovie\b/i.test(title) ? "MOVIE" as const : "TV" as const,
  };
}

function parseCsvLine(line: string) {
  const fields: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      fields.push(field);
      field = "";
    } else {
      field += character;
    }
  }
  if (quoted) throw new Error("CSV contains an unclosed quoted field.");
  fields.push(field);
  return fields;
}

async function main() {
  const path = resolve(process.argv[2] ?? "donghua_all.csv");
  const text = (await readFile(path, "utf8")).replace(/^\uFEFF/, "").trim();
  const [headerLine, ...lines] = text.split(/\r?\n/);
  if (!headerLine) throw new Error(`CSV file is empty: ${path}`);
  const headers = parseCsvLine(headerLine);
  const expected = ["title", "detail_url", "image_url"];
  if (expected.some((header, index) => headers[index] !== header)) {
    throw new Error(`Expected CSV columns: ${expected.join(", ")}`);
  }

  const rows = lines.filter(Boolean).map((line, index) => {
    const columns = parseCsvLine(line);
    if (columns.length !== headers.length) {
      throw new Error(`CSV row ${index + 2} has ${columns.length} fields; expected ${headers.length}.`);
    }
    const parsed = rowSchema.safeParse(Object.fromEntries(headers.map((header, column) => [header, columns[column]])));
    if (!parsed.success) throw new Error(`Invalid CSV row ${index + 2}: ${parsed.error.message}`);
    for (const value of [parsed.data.detail_url, parsed.data.image_url].filter(Boolean)) {
      const url = new URL(value);
      if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
        throw new Error(`Unsupported URL in CSV row ${index + 2}`);
      }
    }
    let episodes: z.infer<typeof episodeMetadataSchema> = [];
    if (parsed.data.episodes) {
      let value: unknown;
      try {
        value = JSON.parse(parsed.data.episodes);
      } catch {
        throw new Error(`Invalid episode metadata JSON in CSV row ${index + 2}.`);
      }
      const episodeResult = episodeMetadataSchema.safeParse(value);
      if (!episodeResult.success) {
        throw new Error(`Invalid episode metadata in CSV row ${index + 2}: ${episodeResult.error.message}`);
      }
      episodes = episodeResult.data;
    }
    return { ...parsed.data, episodes };
  });

  const grouped = new Map<string, ImportRecord>();
  for (const row of rows) {
    const normalized = normalizeSeriesTitle(row.title);
    const key = normalized.seriesTitle.toLocaleLowerCase();
    const rowEpisodes = (row.episodes.length ? row.episodes : normalized.episodeNumbers.map((episodeNumber) => ({
      episodeNumber,
      title: `Episode ${episodeNumber}`,
    }))).map((episode) => ({ ...episode, sourceUrl: row.detail_url }));
    const existing = grouped.get(key);
    if (existing) {
      existing.episodes = [...new Map([...(existing.episodes ?? []), ...rowEpisodes]
        .map((episode) => [episode.episodeNumber, episode] as const)).values()];
      existing.genres = [...new Set([...(existing.genres ?? []), ...(row.genres ?? "").split("|").map((genre) => genre.trim()).filter(Boolean)])];
      existing.alternativeTitles = [...new Set([...(existing.alternativeTitles ?? []), ...(row.alternative_titles ?? "").split("|").map((title) => title.trim()).filter(Boolean)])];
      if (!existing.synopsis && row.synopsis) existing.synopsis = row.synopsis;
      if (!existing.posterUrl && row.image_url) existing.posterUrl = row.image_url;
      if (!existing.status && row.status) existing.status = row.status;
      if (!existing.studio && row.studio) existing.studio = row.studio;
      if (!existing.releaseYear && row.release_year) existing.releaseYear = Number(row.release_year);
      if (!existing.season && row.season) existing.season = row.season as "Winter" | "Spring" | "Summer" | "Fall";
      continue;
    }
    grouped.set(key, {
      title: normalized.seriesTitle,
      sourceUrl: row.detail_url,
      posterUrl: row.image_url || null,
      synopsis: row.synopsis || null,
      status: row.status || undefined,
      alternativeTitles: (row.alternative_titles ?? "").split("|").map((title) => title.trim()).filter(Boolean),
      type: row.type ?? normalized.type,
      releaseYear: row.release_year && Number.isInteger(Number(row.release_year)) ? Number(row.release_year) : undefined,
      season: row.season || null,
      studio: row.studio || null,
      genres: (row.genres ?? "").split("|").map((genre) => genre.trim()).filter(Boolean),
      episodes: rowEpisodes,
    });
  }
  const records = [...grouped.values()].map((record) => ({
    ...record,
    episodes: [...new Map((record.episodes ?? []).map((episode) => [episode.episodeNumber, episode] as const)).values()],
  }));
  for (let offset = 0; offset < records.length; offset += 100) {
    const summary = await importRecords(records.slice(offset, offset + 100));
    console.log(`Imported batch ${Math.floor(offset / 100) + 1}: ${summary.imported} titles, ${summary.episodesImported} episode entries`);
  }
  console.log(`Imported or updated ${records.length} series from ${rows.length} listing records in ${path}`);
}

main()
  .catch((error: unknown) => {
    console.error("CSV import failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
