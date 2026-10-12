import { NextRequest, NextResponse } from "next/server";
import { withApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export const GET = withApiError("get episode", async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const data = await prisma.episode.findUnique({
    where: { id },
    select: {
      id: true,
      animeId: true,
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
      createdAt: true,
      anime: true,
    },
  });
  if (!data) return NextResponse.json({ error: "Episode not found." }, { status: 404 });
  return NextResponse.json({ data });
});
