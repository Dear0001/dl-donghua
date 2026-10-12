import { createHash } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

const episodeSchema = z.object({
  episodeNumber: z.number().int().min(0).max(100000),
  title: z.string().trim().min(1).max(300),
  synopsis: z.string().max(10000).optional().nullable(),
  thumbnailUrl: z.string().url().optional().nullable(),
  sourceUrl: z.string().url().optional().nullable(),
  duration: z.number().int().positive().max(1000).optional().nullable(),
  releaseDate: z.string().datetime().optional().nullable(),
  audioLanguages: z.array(z.string().trim().min(2).max(32)).max(10).optional(),
  subtitles: z.array(z.object({
    src: z.string().url().refine((value) => new URL(value).protocol === "https:"),
    lang: z.string().min(2).max(32),
    label: z.string().min(1).max(80),
    default: z.boolean().optional(),
  })).max(20).optional(),
  videoSources: z.array(z.object({
    url: z.string().url().refine((value) => new URL(value).protocol === "https:"),
    type: z.enum(["video/mp4", "application/x-mpegURL"]),
    label: z.string().min(1).max(80),
    authorized: z.literal(true),
  })).max(10).optional(),
});

const importRecordSchema = z.object({
  title: z.string().trim().min(1).max(300),
  sourceUrl: z.string().url(),
  posterUrl: z.string().url().optional().nullable(),
  synopsis: z.string().max(10000).optional().nullable(),
  status: z.string().trim().max(40).optional(),
  alternativeTitles: z.array(z.string().trim().min(1).max(300)).max(20).optional(),
  type: z.enum(["TV", "MOVIE", "OVA", "ONA", "SPECIAL"]).optional(),
  rating: z.number().min(0).max(10).optional().nullable(),
  releaseYear: z.number().int().min(1900).max(2200).optional().nullable(),
  season: z.enum(["Winter", "Spring", "Summer", "Fall"]).optional().nullable(),
  studio: z.string().trim().max(200).optional().nullable(),
  tags: z.array(z.string().trim().min(1).max(80)).max(40).optional(),
  genres: z.array(z.string().trim().min(1).max(80)).max(30).optional(),
  episodes: z.array(episodeSchema).max(2000).optional(),
});

export const recordsSchema = z.array(importRecordSchema).min(1).max(10000);
export type ImportRecord = z.infer<typeof importRecordSchema>;

function isWebUrl(value: string) {
  const url = new URL(value);
  return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password;
}

export async function importRecords(input: unknown): Promise<{ imported: number; episodesImported: number }> {
  const records = recordsSchema.parse(input);
  const urls = records.flatMap((record) => [
    record.sourceUrl,
    record.posterUrl,
    ...(record.episodes ?? []).flatMap((episode) => [
      episode.thumbnailUrl,
      episode.sourceUrl,
      ...(episode.videoSources ?? []).map((source) => source.url),
      ...(episode.subtitles ?? []).map((track) => track.src),
    ]),
  ]).filter((url): url is string => Boolean(url));
  if (urls.some((url) => !isWebUrl(url)) || records.some((record) =>
    (record.episodes ?? []).some((episode) =>
      (episode.videoSources?.length ?? 0) > 0 && !episode.videoSources?.every((source) => source.authorized),
    ),
  )) {
    throw new Error("Import rejected: only credential-free HTTP(S) URLs and explicitly authorized video sources are allowed.");
  }

  let episodesImported = 0;
  const animeIds = await prisma.$transaction(async (transaction) => {
    const imported: string[] = [];
    const genreNames = new Map<string, string>();
    const animeGenreSlugs: Array<{ animeId: string; slug: string }> = [];
    for (const record of records) {
      const suffix = createHash("sha256").update(record.sourceUrl).digest("hex").slice(0, 10);
      const anime = await transaction.anime.upsert({
        where: { sourceUrl: record.sourceUrl },
        create: {
          title: record.title,
          slug: `${slugify(record.title)}-${suffix}`,
          sourceUrl: record.sourceUrl,
          posterUrl: record.posterUrl ?? null,
          synopsis: record.synopsis ?? null,
          status: record.status || "UNKNOWN",
          alternativeTitles: record.alternativeTitles ?? [],
          type: record.type ?? "TV",
          rating: record.rating ?? null,
          releaseYear: record.releaseYear ?? null,
          season: record.season ?? null,
          studio: record.studio ?? null,
          tags: record.tags ?? [],
        },
        update: {
          title: record.title,
          posterUrl: record.posterUrl ?? null,
          synopsis: record.synopsis ?? null,
          status: record.status,
          alternativeTitles: record.alternativeTitles,
          type: record.type,
          rating: record.rating,
          releaseYear: record.releaseYear,
          season: record.season,
          studio: record.studio,
          tags: record.tags,
        },
      });
      for (const name of record.genres ?? []) {
        const slug = slugify(name);
        genreNames.set(slug, name);
        animeGenreSlugs.push({ animeId: anime.id, slug });
      }
      const episodeData = [...new Map((record.episodes ?? [])
        .map((episode) => [episode.episodeNumber, episode] as const)).values()]
        .map((episode) => ({
          animeId: anime.id,
          episodeNumber: episode.episodeNumber,
          title: episode.title,
          synopsis: episode.synopsis ?? null,
          thumbnailUrl: episode.thumbnailUrl ?? null,
          sourceUrl: episode.sourceUrl ?? null,
          duration: episode.duration ?? null,
          releaseDate: episode.releaseDate ? new Date(episode.releaseDate) : null,
          audioLanguages: episode.audioLanguages ?? [],
          subtitles: episode.subtitles ?? [],
          videoSources: episode.videoSources ?? [],
        }));

      if (episodeData.length) {
        const existingEpisodes = await transaction.episode.findMany({
          where: {
            animeId: anime.id,
            episodeNumber: { in: episodeData.map((episode) => episode.episodeNumber) },
          },
          select: {
            episodeNumber: true,
            title: true,
            synopsis: true,
            thumbnailUrl: true,
            sourceUrl: true,
            duration: true,
            releaseDate: true,
            audioLanguages: true,
            subtitles: true,
            videoSources: true,
          },
        });
        const existingByNumber = new Map(existingEpisodes.map((episode) => [episode.episodeNumber, episode]));
        const newEpisodes = episodeData.filter((episode) => !existingByNumber.has(episode.episodeNumber));
        if (newEpisodes.length) {
          await transaction.episode.createMany({ data: newEpisodes, skipDuplicates: true });
        }

        for (const episode of episodeData) {
          const existing = existingByNumber.get(episode.episodeNumber);
          if (!existing) continue;

          const unchanged =
            existing.title === episode.title
            && existing.synopsis === episode.synopsis
            && existing.thumbnailUrl === episode.thumbnailUrl
            && existing.sourceUrl === episode.sourceUrl
            && existing.duration === episode.duration
            && existing.releaseDate?.getTime() === episode.releaseDate?.getTime()
            && JSON.stringify(existing.audioLanguages) === JSON.stringify(episode.audioLanguages)
            && JSON.stringify(existing.subtitles ?? []) === JSON.stringify(episode.subtitles)
            && JSON.stringify(existing.videoSources ?? []) === JSON.stringify(episode.videoSources);
          if (unchanged) continue;

          await transaction.episode.update({
            where: { animeId_episodeNumber: { animeId: anime.id, episodeNumber: episode.episodeNumber } },
            data: episode,
          });
        }
        episodesImported += episodeData.length;
      }
      imported.push(anime.id);
    }

    if (genreNames.size) {
      await transaction.genre.createMany({
        data: [...genreNames].map(([slug, name]) => ({ slug, name })),
        skipDuplicates: true,
      });
      const genres = await transaction.genre.findMany({
        where: { slug: { in: [...genreNames.keys()] } },
        select: { id: true, name: true, slug: true },
      });
      const genreIds = new Map(genres.map((genre) => [genre.slug, genre.id]));
      for (const genre of genres) {
        const name = genreNames.get(genre.slug);
        if (name && genre.name !== name) {
          await transaction.genre.update({ where: { id: genre.id }, data: { name } });
        }
      }
      const links = new Map<string, { animeId: string; genreId: string }>();
      for (const link of animeGenreSlugs) {
        const genreId = genreIds.get(link.slug);
        if (genreId) links.set(`${link.animeId}:${genreId}`, { animeId: link.animeId, genreId });
      }
      if (links.size) {
        await transaction.animeGenre.createMany({ data: [...links.values()], skipDuplicates: true });
      }
    }

    return imported;
  }, { maxWait: 15_000, timeout: 3_600_000 });

  return { imported: animeIds.length, episodesImported };
}
