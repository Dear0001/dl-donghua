import { NextRequest, NextResponse } from "next/server";
import { withApiError } from "@/lib/api";
import { listAnime } from "@/services/anime-repository";

export const GET = withApiError("list latest anime", async (request: NextRequest) => {
  const result = await listAnime({
    page: 1,
    limit: Number(request.nextUrl.searchParams.get("limit") ?? 12),
    sort: "newest",
  });
  return NextResponse.json({ data: result.data, source: result.source });
});
