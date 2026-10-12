import { Bookmark, Star } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { AnimeSummary } from "@/types/anime";
import { cn } from "@/lib/utils";

export function RatingDisplay({ value, className }: { value?: number; className?: string }) {
  if (value === undefined) return <span className={cn("text-xs text-slate-500", className)}>Not rated</span>;
  return <span className={cn("inline-flex items-center gap-1 text-xs font-semibold text-amber-300", className)}><Star size={13} fill="currentColor" />{value.toFixed(1)}</span>;
}

export function GenreBadge({ genre, href }: { genre: string; href?: string }) {
  const className = "rounded-full border border-violet-300/15 bg-violet-300/[.07] px-2.5 py-1 text-[10px] font-medium text-violet-100";
  return href
    ? <Link href={href} className={`${className} transition hover:border-violet-300/40 hover:bg-violet-300/[.13]`}>{genre}</Link>
    : <span className={className}>{genre}</span>;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return <div className="rounded-3xl border border-dashed border-white/10 bg-white/[.02] px-6 py-16 text-center"><h2 className="font-display text-lg font-bold text-white">{title}</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">{description}</p>{action && <div className="mt-5">{action}</div>}</div>;
}

export function ErrorState({ title = "Something went wrong", description, retry }: { title?: string; description: string; retry?: () => void }) {
  return <div className="rounded-2xl border border-rose-300/15 bg-rose-300/[.04] p-6"><h2 className="font-semibold text-rose-100">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>{retry && <button className="mt-4 text-xs font-semibold text-violet-200 hover:text-white" onClick={retry}>Try again</button>}</div>;
}

export function LoadingSpinner() {
  return <span aria-label="Loading" className="inline-block size-5 animate-spin rounded-full border-2 border-violet-300/25 border-t-violet-300" role="status" />;
}

export function AnimeCardSkeleton() {
  return <div className="animate-pulse"><div className="aspect-[2/3] rounded-2xl bg-white/[.06]" /><div className="mt-3 h-3 w-3/4 rounded bg-white/[.07]" /><div className="mt-2 h-2.5 w-1/2 rounded bg-white/[.045]" /></div>;
}

export function AnimeCard({ anime, compact = false, onWatchlist, saved = false }: { anime: AnimeSummary; compact?: boolean; onWatchlist?: (anime: AnimeSummary) => void; saved?: boolean }) {
  return (
    <article className={`group min-w-0 ${compact ? "w-[160px] shrink-0 snap-start sm:w-[180px]" : ""}`}>
      <Link className="relative block aspect-[2/3] overflow-hidden rounded-2xl border border-white/[.07] bg-slate-800 shadow-lg shadow-black/15" href={`/anime/${anime.slug}`}>
        {anime.posterImage ? <Image alt={`${anime.title} poster`} className="object-cover transition duration-500 group-hover:scale-[1.045]" fill loading="lazy" sizes={compact ? "180px" : "(max-width: 640px) 44vw, (max-width: 1024px) 28vw, 18vw"} src={anime.posterImage} /> : <span aria-hidden className="absolute inset-0 grid place-items-center bg-gradient-to-br from-violet-950 via-slate-900 to-slate-800 text-3xl font-bold text-violet-200/50">{anime.title.slice(0, 1)}</span>}
        <span className="absolute left-2.5 top-2.5 rounded-md border border-white/10 bg-slate-950/60 px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-white/90 backdrop-blur">{anime.type}</span>
        {anime.rating !== undefined && <span className="absolute bottom-2.5 left-2.5 flex items-center gap-1 rounded-md bg-slate-950/70 px-2 py-1 text-[10px] font-bold text-amber-300 backdrop-blur"><Star size={10} fill="currentColor" />{anime.rating.toFixed(1)}</span>}
        {onWatchlist && <button aria-label={saved ? `Remove ${anime.title} from watchlist` : `Add ${anime.title} to watchlist`} className={`absolute right-2 top-2 grid size-8 place-items-center rounded-lg border border-white/10 text-white backdrop-blur transition sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100 ${saved ? "bg-violet-500 opacity-100" : "bg-slate-950/60 hover:bg-violet-500"}`} onClick={(event) => { event.preventDefault(); event.stopPropagation(); onWatchlist(anime); }}><Bookmark fill={saved ? "currentColor" : "none"} size={14} /></button>}
      </Link>
      <Link className="mt-2.5 line-clamp-1 block text-sm font-semibold text-slate-100 transition hover:text-violet-200" href={`/anime/${anime.slug}`}>{anime.title}</Link>
      <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-500"><span>{anime.releaseYear ?? "TBA"}</span><span>·</span><span>{anime.totalEpisodes ?? "TBA"} eps</span></div>
    </article>
  );
}
