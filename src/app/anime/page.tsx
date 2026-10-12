import { Suspense } from "react";
import { AnimeCatalogClient } from "@/components/anime/anime-client";
import { AnimeCardSkeleton } from "@/components/ui/primitives";
import { listAnime } from "@/services/anime-repository";

export const dynamic = "force-dynamic";

export default async function AnimePage() {
  const result = await listAnime({ page: 1, limit: 24, sort: "popularity" });
  return <Suspense fallback={<div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-4 px-5 py-12 sm:grid-cols-4 lg:grid-cols-6">{Array.from({ length: 12 }, (_, index) => <AnimeCardSkeleton key={index} />)}</div>}><AnimeCatalogClient initialData={result.data} initialTotal={result.pagination.total} /></Suspense>;
}
