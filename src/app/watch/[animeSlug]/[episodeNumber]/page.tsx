import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Play } from "lucide-react";
import Link from "next/link";
import { AnimeCard, EmptyState } from "@/components/ui/primitives";
import { VideoPlayer } from "@/components/player/video-player";
import { findAnimeBySlug, relatedAnime } from "@/services/anime-repository";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ animeSlug: string; episodeNumber: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { animeSlug, episodeNumber } = await params;
  const anime = await findAnimeBySlug(animeSlug);
  if (!anime) return { title: "Anime not found — AniFrame" };
  const episode = anime.episodes.find((item) => item.episodeNumber === Number(episodeNumber));
  return episode
    ? { title: `${episode.title} — ${anime.title} | AniFrame`, description: episode.synopsis ?? `Watch ${episode.title} of ${anime.title}.` }
    : { title: "Episode not found — AniFrame" };
}

export default async function WatchPage({ params }: Props) {
  const { animeSlug, episodeNumber } = await params;
  const anime = await findAnimeBySlug(animeSlug);
  if (!anime) notFound();
  const episodeIndex = anime.episodes.findIndex((item) => item.episodeNumber === Number(episodeNumber));
  if (episodeIndex < 0) notFound();
  const episode = anime.episodes[episodeIndex];
  const recommendations = await relatedAnime(anime, 4);

  return <div className="mx-auto max-w-[1440px] px-4 pb-16 pt-6 sm:px-7 lg:px-10">
    <Link className="mb-4 inline-flex items-center gap-1.5 text-[11px] text-slate-400 transition hover:text-white" href={`/anime/${anime.slug}`}><ArrowLeft size={13} /> Back to {anime.title}</Link>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_310px]">
      <div className="min-w-0">
        <VideoPlayer anime={anime} episode={episode} next={anime.episodes[episodeIndex + 1]} previous={anime.episodes[episodeIndex - 1]} />
        <section className="mt-5">
          <p className="eyebrow">NOW PLAYING</p><h1 className="font-display text-xl font-bold text-white sm:text-2xl">{anime.title}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400"><span>Episode {episode.episodeNumber}</span><span>·</span><span>{episode.title}</span>{episode.duration && <><span>·</span><span>{episode.duration} min</span></>}</div>
          {episode.synopsis && <p className="mt-3 max-w-3xl text-xs leading-6 text-slate-400">{episode.synopsis}</p>}
        </section>
        <section className="mt-7 rounded-2xl border border-white/[.06] bg-white/[.02] p-4">
          <div className="mb-3 flex items-center justify-between"><div><p className="eyebrow">UP NEXT</p><h2 className="text-sm font-bold text-white">Episode list</h2></div><Link className="text-[10px] text-violet-200 hover:text-white" href={`/anime/${anime.slug}`}>All anime details</Link></div>
          {anime.episodes.length > 0 ? <div className="max-h-[380px] space-y-1 overflow-y-auto pr-1">{anime.episodes.map((item) => {
            const playable = item.videoSources.some((source) => source.authorized);
            return <Link className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition ${item.id === episode.id ? "border-violet-300/20 bg-violet-300/[.07]" : "border-transparent hover:bg-white/[.04]"}`} href={`/watch/${anime.slug}/${item.episodeNumber}`} key={item.id}><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/[.04] text-[10px] font-bold text-slate-400">{String(item.episodeNumber).padStart(2, "0")}</span><span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-semibold text-slate-200">{item.title}</span><span className="mt-1 block text-[9px] text-slate-500">{item.duration ? `${item.duration} min` : "Runtime unknown"}{item.releaseDate ? ` · ${item.releaseDate.slice(0, 10)}` : ""}</span></span>{playable ? <Play size={13} className="text-violet-200" /> : <span className="text-[9px] text-slate-600">Unavailable</span>}</Link>;
          })}</div> : <EmptyState title="No episodes yet" description="Episode information will appear here when it is available." />}
        </section>
      </div>
      <aside className="space-y-5">
        <div className="rounded-2xl border border-white/[.06] bg-white/[.025] p-4"><p className="eyebrow">SERIES</p><Link className="font-display text-sm font-bold text-white hover:text-violet-200" href={`/anime/${anime.slug}`}>{anime.title}</Link><p className="mt-2 line-clamp-4 text-[11px] leading-5 text-slate-400">{anime.synopsis}</p><Link className="mt-3 inline-flex items-center gap-1 text-[10px] font-semibold text-violet-200" href={`/anime/${anime.slug}`}>View details <ArrowRight size={12} /></Link></div>
        {recommendations.length > 0 && <div><div className="mb-3"><p className="eyebrow">KEEP EXPLORING</p><h2 className="text-sm font-bold text-white">More anime</h2></div><div className="grid grid-cols-2 gap-3 xl:grid-cols-2">{recommendations.slice(0, 4).map((item) => <AnimeCard anime={item} key={item.id} />)}</div></div>}
      </aside>
    </div>
  </div>;
}
