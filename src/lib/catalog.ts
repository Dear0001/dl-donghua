import { Prisma } from "@prisma/client";

export const animeCardSelect = {
  id: true,
  title: true,
  alternativeTitles: true,
  slug: true,
  synopsis: true,
  posterUrl: true,
  status: true,
  type: true,
  releaseYear: true,
  season: true,
  studio: true,
  tags: true,
  updatedAt: true,
  genres: { include: { genre: true } },
  _count: { select: { episodes: true } },
} satisfies Prisma.AnimeSelect;

export type AnimeCardData = Prisma.AnimeGetPayload<{
  select: typeof animeCardSelect;
}>;

export function parsePage(value: string | undefined) {
  if (!value || !/^\d+$/.test(value)) return 1;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? Math.min(1_000_000, Math.max(1, parsed)) : 1;
}

export function parseLimit(value: string | undefined) {
  if (!value || !/^\d+$/.test(value)) return 24;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? Math.min(50, Math.max(1, parsed)) : 24;
}
