import type { MetadataRoute } from "next";
import { mockAnime } from "@/data/mock-anime";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  let anime: { slug: string; updatedAt: Date }[] = mockAnime.map((entry) => ({ slug: entry.slug, updatedAt: new Date() }));
  try {
    anime = await prisma.anime.findMany({ select: { slug: true, updatedAt: true }, orderBy: { updatedAt: "desc" }, take: 5000 });
  } catch (error) {
    if (process.env.NODE_ENV === "production") throw error;
    console.warn("[seo] Database unavailable; sitemap includes sample anime URLs.");
  }
  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    ...["anime", "search", "schedule", "genres/action"].map((path) => ({
      url: `${baseUrl}/${path}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...anime.map((entry) => ({
      url: `${baseUrl}/anime/${encodeURIComponent(entry.slug)}`,
      lastModified: entry.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
