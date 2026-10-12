"use client";

import { Bookmark, Check } from "lucide-react";
import { toast } from "sonner";
import { useWatchStore } from "@/stores/watch-store";
import type { Anime, WatchlistStatus } from "@/types/anime";

export function WatchlistButton({ anime, compact = false }: { anime: Anime; compact?: boolean }) {
  const item = useWatchStore((state) => state.watchlist.find((entry) => entry.animeId === anime.id));
  const setStatus = useWatchStore((state) => state.setStatus);
  const remove = useWatchStore((state) => state.remove);
  const toggle = () => {
    if (item) {
      remove(anime.id);
      toast("Removed from your list", { description: anime.title });
    } else {
      setStatus(anime.id, "PLAN_TO_WATCH", anime);
      toast.success("Added to your watchlist", { description: anime.title });
    }
  };
  const cycleStatus = (status: WatchlistStatus) => {
    setStatus(anime.id, status, anime);
    toast.success(`Moved to ${status.toLowerCase().replace(/_/g, " ")}`);
  };
  if (compact) return <button aria-label={item ? "Remove from watchlist" : "Add to watchlist"} className={`grid size-9 place-items-center rounded-xl border transition ${item ? "border-violet-300/25 bg-violet-300/10 text-violet-100" : "border-white/10 bg-black/20 text-white hover:bg-white/10"}`} onClick={toggle}>{item ? <Check size={15} /> : <Bookmark size={15} />}</button>;
  return <div className="flex flex-wrap gap-2"><button className={`inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-xs font-semibold transition ${item ? "border-violet-300/25 bg-violet-300/10 text-violet-100" : "border-white/10 bg-white/[.04] text-slate-200 hover:bg-white/[.08]"}`} onClick={toggle}>{item ? <Check size={14} /> : <Bookmark size={14} />}{item ? "In watchlist" : "Add to watchlist"}</button>{item && <select aria-label="Watchlist status" className="h-10 rounded-xl border border-white/10 bg-[#101827] px-3 text-xs text-slate-300" onChange={(event) => cycleStatus(event.target.value as WatchlistStatus)} value={item.status}><option value="PLAN_TO_WATCH">Plan to Watch</option><option value="WATCHING">Watching</option><option value="COMPLETED">Completed</option><option value="ON_HOLD">On Hold</option><option value="DROPPED">Dropped</option></select>}</div>;
}
