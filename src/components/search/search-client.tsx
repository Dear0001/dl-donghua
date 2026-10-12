"use client";

import { Search, Trash2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimeCard, EmptyState, RatingDisplay } from "@/components/ui/primitives";
import { mockAnime } from "@/data/mock-anime";
import type { Anime } from "@/types/anime";

export function SearchClient({ initialData }: { initialData: Anime[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const query = params.get("q") ?? "";
  const [input, setInput] = useState(query);
  const [history, setHistory] = useState<string[]>([]);
  const [results, setResults] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (input.trim() !== query) router.replace(input.trim() ? `/search?q=${encodeURIComponent(input.trim())}` : "/search", { scroll: false });
    }, 220);
    return () => window.clearTimeout(timer);
  }, [input, query, router]);
  useEffect(() => {
    if (!query) {
      setResults([]);
      setSearchError("");
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setSearchError("");
    fetch(`/api/v1/anime/search?q=${encodeURIComponent(query)}&page=1&limit=24`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Search service is unavailable.");
        return response.json() as Promise<{ data: Anime[] }>;
      })
      .then((response) => setResults(response.data))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setResults(initialData.filter((anime) => `${anime.title} ${anime.alternativeTitles.join(" ")}`.toLowerCase().includes(query.toLowerCase())));
        setSearchError("Live search is unavailable; showing matching sample titles.");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [initialData, query]);
  useEffect(() => {
    try {
      const stored: unknown = JSON.parse(window.localStorage.getItem("anime-search-history-v1") ?? "[]");
      if (Array.isArray(stored)) setHistory(stored.filter((item): item is string => typeof item === "string").slice(0, 8));
    } catch {
      try {
        window.localStorage.removeItem("anime-search-history-v1");
      } catch {
        console.warn("[search] Unable to clear invalid local search history.");
      }
    }
  }, []);

  useEffect(() => {
    if (!query.trim()) return;
    setHistory((current) => {
      const next = [query, ...current.filter((entry) => entry.toLowerCase() !== query.toLowerCase())].slice(0, 8);
      try {
        window.localStorage.setItem("anime-search-history-v1", JSON.stringify(next));
      } catch {
        console.warn("[search] Unable to save local search history.");
      }
      return next;
    });
  }, [query]);

  const suggestions = query ? results.slice(0, 4) : [];
  return <div className="mx-auto max-w-[1200px] px-4 pb-16 pt-12 sm:px-7">
    <p className="eyebrow"><Search size={12} /> FIND YOUR NEXT SERIES</p><h1 className="font-display text-3xl font-bold text-white sm:text-4xl">Search the library</h1><p className="mt-2 text-sm text-slate-400">Titles, alternative names, and stories worth finding.</p>
    <div className="relative mt-7 max-w-2xl">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
      <input autoComplete="off" autoFocus aria-label="Search anime titles" className="h-14 w-full rounded-2xl border border-white/[.09] bg-white/[.04] pl-12 pr-12 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-300/40 focus:bg-white/[.055]" onChange={(event) => setInput(event.target.value)} placeholder="Try a title or alternate name..." value={input} />
      {input && <button aria-label="Clear search" className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white" onClick={() => { setInput(""); router.replace("/search"); }}><X size={16} /></button>}
      {suggestions.length > 0 && input.trim() !== query && <div className="absolute top-[60px] z-20 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#111827] p-2 shadow-2xl">{suggestions.map((anime) => <SearchSuggestion anime={anime} key={anime.id} />)}</div>}
    </div>
    {!query && history.length > 0 && <section className="mt-6 max-w-2xl"><div className="mb-2 flex items-center justify-between"><p className="m-0 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Recent searches</p><button className="inline-flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-200" onClick={() => { setHistory([]); try { window.localStorage.removeItem("anime-search-history-v1"); } catch { console.warn("[search] Unable to clear local search history."); } }}><Trash2 size={11} /> Clear history</button></div><div className="flex flex-wrap gap-2">{history.map((item) => <button className="rounded-full border border-white/[.07] bg-white/[.03] px-3 py-1.5 text-[10px] text-slate-300 hover:bg-white/[.07]" key={item} onClick={() => setInput(item)}>{item}</button>)}</div></section>}
    {query && <section className="mt-9"><p aria-live="polite" className="mb-4 text-xs text-slate-400">{loading ? "Searching…" : `${results.length} results`} for <span className="font-semibold text-white">“{query}”</span>{searchError && <span className="ml-2 text-amber-300/80">{searchError}</span>}</p>{results.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">{results.map((anime) => <AnimeCard anime={anime} key={anime.id} />)}</div> : !loading && <EmptyState title="No matching anime" description="Try another spelling, an alternate title, or browse the catalog by genre." action={<Link className="text-xs font-semibold text-violet-200" href="/anime">Open the catalog →</Link>} />}</section>}
    {!query && <section className="mt-10"><div className="mb-4"><p className="eyebrow">POPULAR RIGHT NOW</p><h2 className="section-title">Trending searches</h2></div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{[...mockAnime].sort((a,b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0,6).map((anime) => <SearchSuggestion anime={anime} key={anime.id} />)}</div></section>}
  </div>;
}

function SearchSuggestion({ anime }: { anime: Anime }) {
  return <Link className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-white/[.05]" href={`/anime/${anime.slug}`}><span className="relative block h-12 w-9 shrink-0 overflow-hidden rounded-md bg-slate-800">{anime.posterImage && <Image alt="" className="object-cover" fill sizes="36px" src={anime.posterImage} />}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-slate-100">{anime.title}</span><span className="mt-1 block text-[10px] text-slate-500">{anime.releaseYear ?? "TBA"} · {anime.genres.slice(0,2).join(", ")}</span></span><RatingDisplay value={anime.rating} /></Link>;
}
