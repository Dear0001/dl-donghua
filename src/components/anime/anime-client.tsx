"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AnimeCard, AnimeCardSkeleton, EmptyState } from "@/components/ui/primitives";
import { animeGenres } from "@/data/mock-anime";
import { useWatchStore } from "@/stores/watch-store";
import type { Anime, AnimeSummary, AnimeType } from "@/types/anime";

type AnimeResponse = { data: Anime[]; pagination: { page: number; limit: number; total: number; pages: number }; source?: string };

const seasons = ["Winter", "Spring", "Summer", "Fall"];
const types: AnimeType[] = ["TV", "MOVIE", "OVA", "ONA", "SPECIAL"];
const statuses = ["ONGOING", "COMPLETED", "UPCOMING"];

export function AnimeCatalogClient({ initialData, initialTotal }: { initialData: Anime[]; initialTotal: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storedWatchlist = useWatchStore((state) => state.watchlist);
  const setStatus = useWatchStore((state) => state.setStatus);
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AnimeResponse>({
    data: initialData,
    pagination: { page: 1, limit: 24, total: initialTotal, pages: Math.ceil(initialTotal / 24) },
  });
  const [apiError, setApiError] = useState("");
  const state = {
    q: searchParams.get("q") ?? "",
    genre: searchParams.get("genre") ?? "",
    year: searchParams.get("year") ?? "",
    season: searchParams.get("season") ?? "",
    status: searchParams.get("status") ?? "",
    type: searchParams.get("type") ?? "",
    sort: searchParams.get("sort") ?? "popularity",
    page: searchParams.get("page") ?? "1",
  };

  const updateQuery = useCallback((key: string, value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    router.replace(`/anime${next.size ? `?${next.toString()}` : ""}`, { scroll: false });
  }, [router, searchParams]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (search.trim() !== state.q) updateQuery("q", search.trim());
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [search, state.q, updateQuery]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setApiError("");
    const params = new URLSearchParams(searchParams.toString());
    params.set("limit", "24");
    fetch(`/api/v1/anime?${params}`, { signal: controller.signal })
      .then(async (result) => {
        if (!result.ok) throw new Error("Catalog service is unavailable.");
        return result.json() as Promise<AnimeResponse>;
      })
      .then((result) => { if (active) setResponse(result); })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        if (active) {
          setApiError("Live catalog could not load. Showing the local sample catalog instead.");
          const fallback = initialData.filter((anime) =>
            (!state.q || anime.title.toLowerCase().includes(state.q.toLowerCase()))
            && (!state.genre || anime.genres.includes(state.genre.replace(/-/g, " ")))
            && (!state.year || anime.releaseYear === Number(state.year))
            && (!state.season || anime.season?.toLowerCase() === state.season.toLowerCase())
            && (!state.status || anime.status === state.status)
            && (!state.type || anime.type === state.type),
          );
          setResponse({ data: fallback.slice((Number(state.page) - 1) * 24, Number(state.page) * 24), pagination: { page: Number(state.page), limit: 24, total: fallback.length, pages: Math.ceil(fallback.length / 24) }, source: "mock" });
        }
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [searchParams, initialData, state.genre, state.page, state.q, state.season, state.status, state.type, state.year]);

  const yearOptions = useMemo(() => [...new Set(initialData.map((anime) => anime.releaseYear).filter((year): year is number => Boolean(year)))].sort((a, b) => b - a), [initialData]);
  const activeFilters = Object.entries(state).filter(([key, value]) => key !== "sort" && key !== "page" && value);

  function toggleWatchlist(anime: AnimeSummary) {
    const existing = storedWatchlist.find((item) => item.animeId === anime.id);
    if (existing) {
      useWatchStore.getState().remove(anime.id);
      toast("Removed from watchlist", { description: anime.title });
    } else {
      setStatus(anime.id, "PLAN_TO_WATCH", anime);
      toast.success("Added to watchlist", { description: anime.title });
    }
  }

  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-16 pt-10 sm:px-7 lg:px-10">
      <div className="mb-8">
        <p className="mb-2 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[1.8px] text-violet-300"><SlidersHorizontal size={12} /> THE ANIME LIBRARY</p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-[38px]">Find your next <span className="text-violet-300">favorite.</span></h1>
        <p className="mt-2 text-sm text-slate-400">Explore the catalog by genre, season, and mood.</p>
      </div>
      <div className="mb-5 grid gap-2 sm:grid-cols-[minmax(220px,1fr)_auto_auto]">
        <label className="relative block">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input aria-label="Search anime catalog" className="h-11 w-full rounded-xl border border-white/[.08] bg-white/[.035] pl-10 pr-10 text-sm outline-none placeholder:text-slate-500 focus:border-violet-300/40" onChange={(event) => setSearch(event.target.value)} placeholder="Search title or alternative name..." value={search} />
          {search && <button aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white" onClick={() => setSearch("")}><X size={15} /></button>}
        </label>
        <label className="relative">
          <span className="sr-only">Sort results</span>
          <select className="h-11 w-full appearance-none rounded-xl border border-white/[.08] bg-[#111827] px-3 pr-9 text-xs text-slate-300 outline-none sm:w-[170px]" onChange={(event) => updateQuery("sort", event.target.value)} value={state.sort}>
            <option value="popularity">Most popular</option><option value="rating">Top rated</option><option value="newest">Newest first</option><option value="title">Title A–Z</option>
          </select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={13} />
        </label>
        <button aria-expanded={filtersOpen} className={`flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-medium transition ${filtersOpen ? "border-violet-300/30 bg-violet-300/[.08] text-violet-100" : "border-white/[.08] bg-white/[.035] text-slate-300 hover:bg-white/[.06]"}`} onClick={() => setFiltersOpen((open) => !open)}><SlidersHorizontal size={14} /> Filters{activeFilters.length > 0 && <span className="grid size-4 place-items-center rounded-full bg-violet-400 text-[9px] font-bold text-slate-950">{activeFilters.length}</span>}</button>
      </div>
      <AnimatePresence initial={false}>
        {filtersOpen && <motion.div animate={{ height: "auto", opacity: 1 }} className="mb-5 overflow-hidden" exit={{ height: 0, opacity: 0 }} initial={{ height: 0, opacity: 0 }}>
          <div className="grid gap-3 rounded-2xl border border-white/[.07] bg-white/[.025] p-4 sm:grid-cols-2 lg:grid-cols-4">
            <FilterSelect label="Genre" value={state.genre} onChange={(value) => updateQuery("genre", value)} options={animeGenres.map((name) => ({ value: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), label: name }))} />
            <FilterSelect label="Release year" value={state.year} onChange={(value) => updateQuery("year", value)} options={yearOptions.map((year) => ({ value: String(year), label: String(year) }))} />
            <FilterSelect label="Season" value={state.season} onChange={(value) => updateQuery("season", value)} options={seasons.map((season) => ({ value: season, label: season }))} />
            <FilterSelect label="Status" value={state.status} onChange={(value) => updateQuery("status", value)} options={statuses.map((status) => ({ value: status, label: status[0] + status.slice(1).toLowerCase() }))} />
            <FilterSelect label="Type" value={state.type} onChange={(value) => updateQuery("type", value)} options={types.map((type) => ({ value: type, label: type }))} />
            <div className="flex items-end sm:col-span-1 lg:col-span-3"><button className="inline-flex h-9 items-center gap-1.5 px-2 text-[11px] font-semibold text-slate-400 transition hover:text-white" onClick={() => { setSearch(""); router.replace("/anime", { scroll: false }); }}><X size={13} /> Clear all filters</button></div>
          </div>
        </motion.div>}
      </AnimatePresence>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="text-[11px] text-slate-500">{loading ? "Finding titles…" : `${response.pagination.total} titles`}{apiError && <span className="ml-2 text-amber-300/80">{apiError}</span>}</p>
        <div className="flex flex-wrap gap-1.5">{activeFilters.map(([key, value]) => <button className="inline-flex items-center gap-1 rounded-full border border-violet-300/15 bg-violet-300/[.06] px-2.5 py-1 text-[9px] text-violet-100" key={key} onClick={() => updateQuery(key, "")}>{key === "genre" ? value.replace(/-/g, " ") : value}<X size={10} /></button>)}</div>
      </div>
      {loading && response.data.length === 0 ? <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">{Array.from({ length: 12 }, (_, index) => <AnimeCardSkeleton key={index} />)}</div>
        : response.data.length ? <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">{response.data.map((anime) => <AnimeCard anime={anime} key={anime.id} onWatchlist={toggleWatchlist} saved={storedWatchlist.some((item) => item.animeId === anime.id)} />)}</div>
          : <EmptyState description="Try another title or remove one of the selected filters." title="No anime found" action={<button className="text-xs font-semibold text-violet-200" onClick={() => { setSearch(""); router.replace("/anime", { scroll: false }); }}>Clear search and filters</button>} />}
      {response.pagination.pages > 1 && <nav aria-label="Catalog pages" className="mt-9 flex items-center justify-center gap-5"><button className="page-button" disabled={response.pagination.page <= 1} onClick={() => updateQuery("page", String(response.pagination.page - 1))}>Previous</button><span className="text-xs text-slate-400">Page {response.pagination.page} of {response.pagination.pages}</span><button className="page-button" disabled={response.pagination.page >= response.pagination.pages} onClick={() => updateQuery("page", String(response.pagination.page + 1))}>Next</button></nav>}
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) {
  return <label className="block"><span className="mb-1.5 block text-[10px] font-semibold text-slate-400">{label}</span><span className="relative block"><select className="h-9 w-full appearance-none rounded-lg border border-white/[.07] bg-[#0f172a] px-3 pr-8 text-xs text-slate-200 outline-none focus:border-violet-300/35" onChange={(event) => onChange(event.target.value)} value={value}><option value="">All {label.toLowerCase()}s</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500" size={12} /></span></label>;
}
