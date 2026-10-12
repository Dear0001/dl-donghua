"use client";

import { useWatchStore } from "@/stores/watch-store";
import type { WatchProgress } from "@/types/anime";

export const playbackProgress = {
  forEpisode(episodeId: string) {
    return useWatchStore.getState().progress.find((progress) => progress.episodeId === episodeId);
  },
  save(progress: WatchProgress) {
    useWatchStore.getState().saveProgress(progress);
  },
  recent(count = 8) {
    return [...useWatchStore.getState().progress]
      .sort((a, b) => b.lastWatchedAt.localeCompare(a.lastWatchedAt))
      .slice(0, count);
  },
};
