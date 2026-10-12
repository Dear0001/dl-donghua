import { NextResponse } from "next/server";
import { withApiError } from "@/lib/api";
import { getAnimeGenres, listAnime } from "@/services/anime-repository";

export const GET = withApiError("list genres", async () => {
  const result = await listAnime({ page: 1, limit: 48 });
  const counts = new Map<string, number>();
  result.data.forEach((anime) => anime.genres.forEach((genre) => counts.set(genre, (counts.get(genre) ?? 0) + 1)));
  const data = getAnimeGenres(result.data).map((name) => ({
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    count: counts.get(name) ?? 0,
  }));
  return NextResponse.json({ data });
});
