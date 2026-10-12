import { NextRequest, NextResponse } from "next/server";
import { withApiError } from "@/lib/api";
import { listAnime } from "@/services/anime-repository";
import type { AnimeType } from "@/types/anime";

export const GET = withApiError("list anime", async (request: NextRequest) => {
  const params = request.nextUrl.searchParams;
  const query = params.get("q")?.trim() ?? "";
  if (query.length > 200) {
    return NextResponse.json({ error: "The q query parameter must not exceed 200 characters." }, { status: 400 });
  }
  const type = params.get("type")?.toUpperCase();
  const sort = params.get("sort");
  const yearValue = Number(params.get("year"));
  const year = Number.isInteger(yearValue) && yearValue >= 1900 && yearValue <= 2200 ? yearValue : undefined;
  const result = await listAnime({
    page: Number(params.get("page") ?? 1),
    limit: Number(params.get("limit") ?? 24),
    q: query || undefined,
    genre: params.get("genre") || undefined,
    year,
    season: params.get("season") || undefined,
    status: params.get("status")?.toUpperCase() || undefined,
    type: ["TV", "MOVIE", "OVA", "ONA", "SPECIAL"].includes(type ?? "") ? type as AnimeType : undefined,
    sort: ["popularity", "rating", "newest", "title"].includes(sort ?? "") ? sort as "popularity" | "rating" | "newest" | "title" : undefined,
  });
  return NextResponse.json({
    data: result.data,
    pagination: result.pagination,
    source: result.source,
  });
});
