import { Prisma } from "@prisma/client";
import { mockAnime } from "@/data/mock-anime";
import type { Anime, AnimeType } from "@/types/anime";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

const defaultTake = 24;
const maximumTake = 48;

export type AnimeQuery = {
  q?: string;
  genre?: string;
  year?: number;
  season?: string;
  status?: string;
  type?: AnimeType;
  sort?: "popularity" | "rating" | "newest" | "title";
  page?: number;
  limit?: number;
};

const mapping = {
  id: true,
  title: true,
  alternativeTitles: true,
  slug: true,
  synopsis: true,
  posterUrl: true,
  coverUrl: true,
  status: true,
  type: true,
  rating: true,
  releaseYear: true,
  season: true,
  studio: true,
  tags: true,
  sourceUrl: true,
  genres: { include: { genre: true } },
  episodes: { orderBy: { episodeNumber: "asc" as const } },
} satisfies Prisma.AnimeSelect;

type DbAnime = Prisma.AnimeGetPayload<{ select: typeof mapping }>;

function fromDatabase(record: DbAnime): Anime {
  return {
    id: record.id,
    slug: record.slug,
    title: record.title,
    alternativeTitles: record.alternativeTitles,
    synopsis: record.synopsis ?? "",
    posterImage: record.posterUrl ?? "",
    bannerImage: record.coverUrl ?? record.posterUrl ?? "",
    genres: record.genres.map(({ genre }) => genre.name),
    releaseYear: record.releaseYear ?? undefined,
    season: record.season ?? undefined,
    status: ["ONGOING", "COMPLETED", "UPCOMING"].includes(record.status)
      ? record.status as Anime["status"] : "UNKNOWN",
    type: ["TV", "MOVIE", "OVA", "ONA", "SPECIAL"].includes(record.type)
      ? record.type as AnimeType : "TV",
    rating: record.rating ?? undefined,
    studio: record.studio ?? undefined,
    tags: record.tags,
    totalEpisodes: record.episodes.length,
    sourceUrl: record.sourceUrl,
    episodes: record.episodes.map((item) => ({
      id: item.id,
      animeId: item.animeId,
      episodeNumber: item.episodeNumber,
      title: item.title,
      synopsis: item.synopsis ?? undefined,
      thumbnail: item.thumbnailUrl ?? undefined,
      duration: item.duration ?? undefined,
      releaseDate: item.releaseDate?.toISOString(),
      audioLanguages: item.audioLanguages,
      subtitles: Array.isArray(item.subtitles) ? item.subtitles as Anime["episodes"][number]["subtitles"] : [],
      videoSources: Array.isArray(item.videoSources) ? item.videoSources as Anime["episodes"][number]["videoSources"] : [],
    })),
  };
}

function fallbackFilter(query: AnimeQuery) {
  const matched = mockAnime.filter((anime) =>
    (!query.q || `${anime.title} ${anime.alternativeTitles.join(" ")}`.toLowerCase().includes(query.q.toLowerCase()))
    && (!query.genre || anime.genres.some((genre) => slugify(genre) === slugify(query.genre ?? "")))
    && (!query.year || anime.releaseYear === query.year)
    && (!query.season || anime.season?.toLowerCase() === query.season.toLowerCase())
    && (!query.status || anime.status === query.status)
    && (!query.type || anime.type === query.type),
  );
  matched.sort((a, b) => {
    if (query.sort === "title") return a.title.localeCompare(b.title);
    if (query.sort === "newest") return (b.releaseYear ?? 0) - (a.releaseYear ?? 0);
    if (query.sort === "popularity") return Number(b.tags.includes("Trending")) - Number(a.tags.includes("Trending")) || (b.rating ?? 0) - (a.rating ?? 0);
    return (b.rating ?? 0) - (a.rating ?? 0);
  });
  return matched;
}

export async function listAnime(query: AnimeQuery = {}) {
  const page = Number.isFinite(query.page) ? Math.max(1, Math.floor(query.page ?? 1)) : 1;
  const limit = Number.isFinite(query.limit) ? Math.min(maximumTake, Math.max(1, Math.floor(query.limit ?? defaultTake))) : defaultTake;
  const skip = (page - 1) * limit;
  try {
    const where: Prisma.AnimeWhereInput = {
      ...(query.q ? { OR: [
        { title: { contains: query.q, mode: "insensitive" } },
        { alternativeTitles: { has: query.q } },
      ] } : {}),
      ...(query.genre ? { genres: { some: { genre: { OR: [
        { name: { equals: query.genre, mode: "insensitive" } },
        { slug: { equals: slugify(query.genre) } },
      ] } } } } : {}),
      ...(query.year ? { releaseYear: query.year } : {}),
      ...(query.season ? { season: { equals: query.season, mode: "insensitive" } } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.type ? { type: query.type } : {}),
    };
    const orderBy: Prisma.AnimeOrderByWithRelationInput | Prisma.AnimeOrderByWithRelationInput[] =
      query.sort === "title" ? { title: "asc" }
        : query.sort === "newest" ? { releaseYear: "desc" }
          : query.sort === "rating" ? [{ rating: "desc" }, { updatedAt: "desc" }]
            : query.sort === "popularity" ? [{ rating: "desc" }, { updatedAt: "desc" }]
              : { updatedAt: "desc" };
    const [rows, total] = await Promise.all([
      prisma.anime.findMany({ where, orderBy, skip, take: limit, select: mapping }),
      prisma.anime.count({ where }),
    ]);
    if (total === 0 && process.env.NODE_ENV !== "production" && await prisma.anime.count() === 0) {
      const records = fallbackFilter(query);
      return { data: records.slice(skip, skip + limit), pagination: { page, limit, total: records.length, pages: Math.ceil(records.length / limit) }, source: "mock" as const };
    }
    return { data: rows.map(fromDatabase), pagination: { page, limit, total, pages: Math.ceil(total / limit) }, source: "database" as const };
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      if (process.env.DATABASE_URL) console.warn("[catalog] Database unavailable; serving mock catalog data in development.");
      const records = fallbackFilter(query);
      return { data: records.slice(skip, skip + limit), pagination: { page, limit, total: records.length, pages: Math.ceil(records.length / limit) }, source: "mock" as const };
    }
    throw error;
  }
}

export async function findAnimeBySlug(slug: string): Promise<Anime | null> {
  try {
    const record = await prisma.anime.findUnique({ where: { slug }, select: mapping });
    if (!record && process.env.NODE_ENV !== "production" && await prisma.anime.count() === 0) {
      return mockAnime.find((anime) => anime.slug === slug) ?? null;
    }
    return record ? fromDatabase(record) : null;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      if (process.env.DATABASE_URL) console.warn("[catalog] Database unavailable; looking up mock data in development.");
      return mockAnime.find((anime) => anime.slug === slug) ?? null;
    }
    throw error;
  }
}

export async function findAnimeById(id: string): Promise<Anime | null> {
  try {
    const record = await prisma.anime.findUnique({ where: { id }, select: mapping });
    return record ? fromDatabase(record) : null;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      if (process.env.DATABASE_URL) console.warn("[catalog] Database unavailable; looking up mock data in development.");
      return mockAnime.find((anime) => anime.id === id) ?? null;
    }
    throw error;
  }
}

export async function relatedAnime(anime: Anime, take = 8) {
  const suggestions = mockAnime
    .filter((item) => item.id !== anime.id && item.genres.some((genre) => anime.genres.includes(genre)))
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, take);
  try {
    const rows = await prisma.anime.findMany({
      where: { id: { not: anime.id }, genres: { some: { genre: { name: { in: anime.genres } } } } },
      orderBy: { updatedAt: "desc" },
      take,
      select: mapping,
    });
    if (!rows.length && process.env.NODE_ENV !== "production" && await prisma.anime.count() === 0) {
      return suggestions;
    }
    return rows.map(fromDatabase);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      if (process.env.DATABASE_URL) console.warn("[catalog] Database unavailable; recommending mock catalog data in development.");
      return suggestions;
    }
    throw error;
  }
}

export function getAnimeGenres(anime: Anime[]) {
  return [...new Set(anime.flatMap((item) => item.genres))].sort((a, b) => a.localeCompare(b));
}
