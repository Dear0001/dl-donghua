"use client";

import { Bookmark, Clock3, Play, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AnimeCard, EmptyState } from "@/components/ui/primitives";
import { mockAnime } from "@/data/mock-anime";
import { useWatchStore } from "@/stores/watch-store";
import { watchlistStatuses, type AnimeSummary, type WatchlistItem, type WatchlistStatus } from "@/types/anime";

export function WatchlistClient() {
  const items = useWatchStore((state) => state.watchlist);
  const progress = useWatchStore((state) => state.progress);
  const remove = useWatchStore((state) => state.remove);
  const setStatus = useWatchStore((state) => state.setStatus);
  const [filter, setFilter] = useState<WatchlistStatus | "ALL">("ALL");
  const records = useMemo(() => items.filter((item) => filter === "ALL" || item.status === filter)
    .map((item) => ({ item, anime: item.anime ?? mockAnime.find((anime) => anime.id === item.animeId) }))
    .filter((record): record is { item: WatchlistItem; anime: AnimeSummary } => Boolean(record.anime))
    .sort((a, b) => b.item.updatedAt.localeCompare(a.item.updatedAt)), [filter, items]);
  const recent = [...progress].sort((a,b) => b.lastWatchedAt.localeCompare(a.lastWatchedAt)).slice(0, 4);

  return <div className="mx-auto max-w-[1440px] px-4 pb-16 pt-10 sm:px-7 lg:px-10">
    <p className="eyebrow"><Bookmark size={12} /> YOUR PERSONAL LIBRARY</p><h1 className="font-display text-3xl font-bold text-white sm:text-4xl">My watchlist<span className="text-violet-300">.</span></h1><p className="mt-2 text-sm text-slate-400">Your lists and progress are saved in this browser.</p>
    {recent.length > 0 && <section className="mt-8"><div className="mb-3"><p className="eyebrow"><Clock3 size={12} /> PICK UP WHERE YOU LEFT OFF</p><h2 className="section-title">Continue watching</h2></div><div className="grid gap-2 sm:grid-cols-2">{recent.map((entry) => { const anime = entry.anime ?? mockAnime.find((item) => item.id === entry.animeId); return anime ? <Link className="flex items-center gap-3 rounded-2xl border border-white/[.06] bg-white/[.025] p-2.5 hover:bg-white/[.05]" href={`/watch/${anime.slug}/${entry.episodeNumber ?? 1}`} key={entry.episodeId}><span className="relative block h-14 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-800">{anime.bannerImage && <Image alt="" className="object-cover" fill sizes="96px" src={anime.bannerImage} />}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-slate-100">{anime.title}</span><span className="mt-1 block text-[10px] text-slate-500">Episode {entry.episodeNumber ?? "—"} · {Math.round((entry.currentTime / Math.max(1, entry.duration)) * 100)}% watched</span></span><Play className="mr-2 text-violet-200" size={15} /></Link> : null; })}</div></section>}
    <section className="mt-9"><div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">SAVED FOR LATER</p><h2 className="section-title">{records.length} {records.length === 1 ? "title" : "titles"}</h2></div><label className="relative"><span className="sr-only">Filter by watchlist status</span><select className="h-9 appearance-none rounded-xl border border-white/[.08] bg-[#111827] pl-3 pr-8 text-[10px] text-slate-200 outline-none" onChange={(event) => setFilter(event.target.value as WatchlistStatus | "ALL")} value={filter}><option value="ALL">All lists</option>{watchlistStatuses.map((status) => <option key={status.id} value={status.id}>{status.label}</option>)}</select></label></div>
      {records.length ? <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">{records.map(({ anime, item }) => <article key={anime.id}><div className="relative"><AnimeCard anime={anime} /><button aria-label={`Remove ${anime.title} from watchlist`} className="absolute right-2 top-2 grid size-8 place-items-center rounded-lg border border-white/10 bg-slate-950/70 text-slate-200 backdrop-blur hover:bg-rose-500/80" onClick={() => { remove(anime.id); toast("Removed from watchlist"); }}><Trash2 size={13} /></button></div><label className="mt-2 block"><span className="sr-only">Change {anime.title} list</span><select className="h-8 w-full rounded-lg border border-white/[.07] bg-[#111827] px-2 text-[9px] text-slate-300" onChange={(event) => setStatus(anime.id, event.target.value as WatchlistStatus)} value={item.status}>{watchlistStatuses.map((status) => <option key={status.id} value={status.id}>{status.label}</option>)}</select></label><div className="mt-1 text-[9px] text-slate-600">Episode progress: {item.progressEpisode || 0}</div></article>)}</div> : <EmptyState title="Your watchlist is ready when you are" description="Browse the anime catalog and save titles to Plan to Watch, Watching, and more." action={<Link className="text-xs font-semibold text-violet-200" href="/anime">Explore anime →</Link>} />}
    </section>
  </div>;
}
