"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AnimeSummary, WatchProgress, WatchlistItem, WatchlistStatus } from "@/types/anime";

const safeStorage = {
  getItem(name: string) {
    try {
      return localStorage.getItem(name);
    } catch (error) {
      console.warn("[watchlist] Browser storage is unavailable.", error);
      return null;
    }
  },
  setItem(name: string, value: string) {
    try {
      localStorage.setItem(name, value);
    } catch (error) {
      console.error("[watchlist] Unable to persist watchlist data.", error);
    }
  },
  removeItem(name: string) {
    try {
      localStorage.removeItem(name);
    } catch (error) {
      console.error("[watchlist] Unable to remove persisted watchlist data.", error);
    }
  },
};

type WatchState = {
  watchlist: WatchlistItem[];
  progress: WatchProgress[];
  hydrated: boolean;
  setHydrated: (hydrated: boolean) => void;
  setStatus: (animeId: string, status: WatchlistStatus, anime?: AnimeSummary) => void;
  remove: (animeId: string) => void;
  saveProgress: (progress: WatchProgress) => void;
};

export const useWatchStore = create<WatchState>()(
  persist(
    (set) => ({
      watchlist: [],
      progress: [],
      hydrated: false,
      setHydrated: (hydrated) => set({ hydrated }),
      setStatus: (animeId, status, anime) => set((state) => {
        const existing = state.watchlist.find((item) => item.animeId === animeId);
        const now = new Date().toISOString();
        return {
          watchlist: existing
            ? state.watchlist.map((item) => item.animeId === animeId ? { ...item, anime: anime ?? item.anime, status, updatedAt: now } : item)
            : [...state.watchlist, { animeId, anime, status, addedAt: now, updatedAt: now, progressEpisode: 0 }],
        };
      }),
      remove: (animeId) => set((state) => ({
        watchlist: state.watchlist.filter((item) => item.animeId !== animeId),
      })),
      saveProgress: (progress) => set((state) => {
        const existing = state.progress.filter((item) => item.episodeId !== progress.episodeId);
        const watchItem = state.watchlist.find((item) => item.animeId === progress.animeId);
        return {
          progress: [...existing, progress],
          watchlist: watchItem
            ? state.watchlist.map((item) => item.animeId === progress.animeId
              ? { ...item, anime: progress.anime ?? item.anime, progressEpisode: Math.max(item.progressEpisode, progress.episodeNumber ?? 0), updatedAt: progress.lastWatchedAt }
              : item)
            : state.watchlist,
        };
      }),
    }),
    {
      name: "frame-anime-watch-state-v1",
      storage: createJSONStorage(() => safeStorage),
      skipHydration: true,
      partialize: (state) => ({ watchlist: state.watchlist, progress: state.progress }) as WatchState,
      onRehydrateStorage: () => (state, error) => {
        if (error) console.warn("[watchlist] Stored watchlist data could not be read.", error);
        state?.setHydrated(true);
      },
    },
  ),
);
