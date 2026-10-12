import { NextRequest, NextResponse } from "next/server";
import { withApiError } from "@/lib/api";
import { listAnime } from "@/services/anime-repository";

export const GET = withApiError("search anime", async (request: NextRequest) => {
  const params = request.nextUrl.searchParams;
  const query = params.get("q")?.trim() ?? "";
  if (!query) {
    return NextResponse.json({ error: "The q query parameter is required." }, { status: 400 });
  }
  if (query.length > 200) {
    return NextResponse.json({ error: "The q query parameter must not exceed 200 characters." }, { status: 400 });
  }
  const result = await listAnime({
    q: query,
    page: Number(params.get("page") ?? 1),
    limit: Number(params.get("limit") ?? 24),
  });
  return NextResponse.json({ data: result.data, pagination: result.pagination, source: result.source });
});
