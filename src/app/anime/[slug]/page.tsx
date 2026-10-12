import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { AnimeCard, GenreBadge, RatingDisplay } from "@/components/ui/primitives";
import { AnimeWatchlistControl } from "@/components/anime/anime-watchlist-control";
import { findAnimeBySlug, relatedAnime } from "@/services/anime-repository";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const anime = await findAnimeBySlug(slug);
  if (!anime) return { title: "Anime not found" };
  return {
    title: `${anime.title} — AniFrame`,
    description: anime.synopsis.slice(0, 160),
    alternates: { canonical: `/anime/${anime.slug}` },
    openGraph: {
      title: `${anime.title} — AniFrame`,
      description: anime.synopsis.slice(0, 160),
      images: anime.bannerImage ? [{ url: anime.bannerImage }] : [],
      type: "website",
    },
  };
}

export default async function AnimeDetailPage({ params }: Props) {
  const { slug } = await params;
  const anime = await findAnimeBySlug(slug);
  if (!anime) notFound();
  const related = await relatedAnime(anime, 6);
  const audioLanguages = [...new Set(anime.episodes.flatMap((episode) => episode.audioLanguages))];
  const subtitleLanguages = [...new Set(anime.episodes.flatMap((episode) => episode.subtitles.map((track) => track.lang)))];

  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-16 sm:px-7 lg:px-10">
      <section className="relative mt-5 min-h-[300px] overflow-hidden rounded-3xl border border-white/[.07] bg-slate-900 sm:min-h-[360px]">
        {/* Remote catalog artwork is supplied by metadata; the gradient is the resilient fallback. */}
        {anime.bannerImage && <div aria-hidden className="absolute inset-0 bg-cover bg-center opacity-60" style={{ backgroundImage: `url("${anime.bannerImage.replaceAll('"', "")}")` }} />}
        <div className="absolute inset-0 bg-gradient-to-r from-[#090d18] via-[#090d18]/85 to-[#090d18]/35" />
        <div className="relative z-10 flex min-h-[300px] items-end gap-5 p-5 sm:min-h-[360px] sm:gap-8 sm:p-8 lg:p-10">
          <div className="relative hidden aspect-[2/3] w-[150px] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-slate-800 shadow-2xl sm:block">{anime.posterImage ? <Image alt={`${anime.title} poster`} className="object-cover" fill sizes="150px" src={anime.posterImage} /> : <span aria-hidden className="grid h-full place-items-center text-3xl text-violet-200/50">{anime.title.slice(0, 1)}</span>}</div>
          <div className="max-w-2xl pb-1">
            <div className="mb-2 flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[1.4px] text-violet-200">{anime.type} <span className="text-white/30">/</span> {anime.status.replace("_", " ")}</div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[46px]">{anime.title}</h1>
            {anime.alternativeTitles.length > 0 && <p className="mt-1 text-xs text-slate-400">{anime.alternativeTitles.join(" · ")}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] text-slate-300"><RatingDisplay value={anime.rating} />{anime.releaseYear && <><span>·</span><span>{anime.releaseYear}{anime.season ? ` · ${anime.season}` : ""}</span></>}<span>·</span><span>{anime.totalEpisodes ?? "TBA"} episodes</span>{anime.studio && <><span>·</span><span>{anime.studio}</span></>}</div>
            <div className="mt-4 flex flex-wrap gap-1.5">{anime.genres.map((genre) => <GenreBadge genre={genre} href={`/genres/${genre.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} key={genre} />)}</div>
            <div className="mt-5 flex flex-wrap gap-2"><a className="inline-flex h-10 items-center justify-center rounded-xl bg-violet-300 px-4 text-xs font-bold text-slate-950 transition hover:bg-violet-200" href={anime.episodes.length ? `/watch/${anime.slug}/${anime.episodes[0].episodeNumber}` : "#episodes"}>Start watching</a><AnimeWatchlistControl anime={anime} /></div>
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_290px]">
        <div>
          <section><h2 className="mb-3 font-display text-lg font-bold text-white">Synopsis</h2><p className="max-w-3xl text-sm leading-7 text-slate-300">{anime.synopsis || "A synopsis has not been added to this catalog entry yet."}</p></section>
          <section className="mt-8" id="episodes"><div className="mb-3 flex items-end justify-between"><div><p className="eyebrow">EPISODE GUIDE</p><h2 className="section-title">Episodes <span>({anime.episodes.length})</span></h2></div><span className="text-[10px] text-slate-500">Episodes without an authorized source are marked unavailable.</span></div>
            {anime.episodes.length ? <div className="grid gap-2 sm:grid-cols-2">{anime.episodes.map((episode) => {
              const playable = episode.videoSources.some((source) => source.authorized === true);
              return <a className="flex min-h-[72px] items-center gap-3 rounded-xl border border-white/[.06] bg-white/[.025] p-3 transition hover:border-violet-300/20 hover:bg-white/[.045]" href={`/watch/${anime.slug}/${episode.episodeNumber}`} key={episode.id}>
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-violet-300/[.08] text-[10px] font-bold text-violet-200">{String(episode.episodeNumber).padStart(2, "0")}</span>
                <span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-slate-200">{episode.title}</span><span className="mt-1 block text-[9px] text-slate-500">{episode.duration ? `${episode.duration} min` : "Runtime unavailable"}{episode.releaseDate ? ` · ${episode.releaseDate.slice(0, 10)}` : ""}</span></span>
                <span className={`text-[9px] ${playable ? "text-violet-200" : "text-slate-600"}`}>{playable ? "Watch" : "Unavailable"}</span>
              </a>;
            })}</div> : <p className="rounded-xl border border-white/[.06] bg-white/[.02] p-5 text-xs text-slate-400">Episode metadata is not available yet.</p>}
          </section>
        </div>
        <aside className="h-fit rounded-2xl border border-white/[.06] bg-white/[.025] p-4"><h2 className="font-display text-sm font-bold text-white">Information</h2><dl className="mt-3 space-y-3 text-[11px]"><Info label="Type" value={anime.type} /><Info label="Status" value={anime.status.replace("_", " ")} /><Info label="Year" value={anime.releaseYear?.toString() ?? "Unknown"} /><Info label="Season" value={anime.season ?? "Unknown"} /><Info label="Studio" value={anime.studio ?? "Unknown"} /><Info label="Audio" value={audioLanguages.join(", ") || "Not provided"} /><Info label="Subtitles" value={subtitleLanguages.join(", ") || "Not provided"} /></dl></aside>
      </div>

      {related.length > 0 && <section className="mt-11"><div className="mb-4"><p className="eyebrow">SIMILAR STORIES</p><h2 className="section-title">You may also like</h2></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">{related.map((item) => <AnimeCard anime={item} key={item.id} />)}</div></section>}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-3 border-b border-white/[.05] pb-2 last:border-0 last:pb-0"><dt className="text-slate-500">{label}</dt><dd className="m-0 text-right text-slate-200">{value}</dd></div>;
}
