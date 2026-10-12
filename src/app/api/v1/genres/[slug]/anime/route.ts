import { NextRequest, NextResponse } from "next/server";
import { withApiError } from "@/lib/api";
import { listAnime } from "@/services/anime-repository";

export const GET = withApiError("list anime by genre", async (request: NextRequest, { params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  const searchParams = request.nextUrl.searchParams;
  const genre = decodeURIComponent(slug).replace(/-/g, " ");
  const result = await listAnime({
    genre,
    page: Number(searchParams.get("page") ?? 1),
    limit: Number(searchParams.get("limit") ?? 24),
  });
  return NextResponse.json({ data: result.data, pagination: result.pagination, source: result.source });
});
