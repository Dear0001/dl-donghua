"use client";

import { WatchlistButton } from "@/components/anime/watchlist-button";
import type { Anime } from "@/types/anime";

export function HomeInteractions({ anime }: { anime: Anime }) {
  return <WatchlistButton anime={anime} compact />;
}
