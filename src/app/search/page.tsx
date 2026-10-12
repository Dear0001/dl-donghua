import { Suspense } from "react";
import { SearchClient } from "@/components/search/search-client";
import { listAnime } from "@/services/anime-repository";

export const metadata = { title: "Search Anime — AniFrame", description: "Search anime titles and discover your next series." };

export default async function SearchPage() {
  const result = await listAnime({ page: 1, limit: 48 });
  return <Suspense fallback={<div className="mx-auto max-w-2xl px-5 py-16"><div className="h-14 animate-pulse rounded-2xl bg-white/[.05]" /></div>}><SearchClient initialData={result.data} /></Suspense>;
}
export const dynamic = "force-dynamic";
