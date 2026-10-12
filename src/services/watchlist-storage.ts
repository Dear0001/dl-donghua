"use client";

import { useWatchStore } from "@/stores/watch-store";
import type { WatchProgress, WatchlistStatus } from "@/types/anime";

export const watchlistStorage = {
  add(animeId: string, status: WatchlistStatus = "PLAN_TO_WATCH") {
    useWatchStore.getState().setStatus(animeId, status);
  },
  setStatus(animeId: string, status: WatchlistStatus) {
    useWatchStore.getState().setStatus(animeId, status);
  },
  remove(animeId: string) {
    useWatchStore.getState().remove(animeId);
  },
  saveProgress(progress: WatchProgress) {
    useWatchStore.getState().saveProgress(progress);
  },
};
