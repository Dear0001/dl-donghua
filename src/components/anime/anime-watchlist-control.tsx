"use client";

import { WatchlistButton } from "@/components/anime/watchlist-button";
import type { Anime } from "@/types/anime";

export function AnimeWatchlistControl({ anime }: { anime: Anime }) {
  return <WatchlistButton anime={anime} />;
}
