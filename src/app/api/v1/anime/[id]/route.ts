import { NextRequest, NextResponse } from "next/server";
import { withApiError } from "@/lib/api";
import { findAnimeById, findAnimeBySlug, relatedAnime } from "@/services/anime-repository";

export const GET = withApiError("get anime", async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const anime = await findAnimeById(id) ?? await findAnimeBySlug(id);
  if (!anime) return NextResponse.json({ error: "Anime not found." }, { status: 404 });
  return NextResponse.json({ data: anime, recommendations: await relatedAnime(anime) });
});
