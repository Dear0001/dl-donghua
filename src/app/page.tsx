import { ArrowRight, CalendarClock, Play, Sparkles, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { AnimeCard } from "@/components/ui/primitives";
import { mockAnime } from "@/data/mock-anime";
import { getAnimeGenres, listAnime, relatedAnime } from "@/services/anime-repository";
import { HomeInteractions } from "@/components/anime/home-interactions";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [trending, newest] = await Promise.all([
    listAnime({ page: 1, limit: 8, sort: "popularity" }),
    listAnime({ page: 1, limit: 6, sort: "newest" }),
  ]);
  const featured = trending.data[0] ?? (process.env.NODE_ENV === "production" ? null : mockAnime[0]);
  const popular = trending.data.filter((anime) => anime.id !== featured?.id);
  const month = new Date().getMonth();
  const currentSeason = month < 2 ? "Winter" : month < 5 ? "Spring" : month < 8 ? "Summer" : month < 11 ? "Fall" : "Winter";
  const thisSeason = trending.data.filter((anime) => anime.season === currentSeason && anime.releaseYear === new Date().getFullYear());
  const updatedEpisodes = [...new Map([...trending.data, ...newest.data]
    .flatMap((anime) => anime.episodes.map((episode) => ({ anime, episode })))
    .filter(({ episode }) => episode.releaseDate)
    .map((entry) => [entry.episode.id, entry] as const)).values()]
    .sort((a, b) => (b.episode.releaseDate ?? "").localeCompare(a.episode.releaseDate ?? ""))
    .slice(0, 8);
  const recommended = featured ? await relatedAnime(featured, 8) : [];
  const recentlyAdded = newest.data.slice(0, 6);
  const genres = getAnimeGenres(trending.data);

  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-14 sm:px-7 lg:px-10">
      {featured ? <section className="relative mt-5 min-h-[410px] overflow-hidden rounded-[25px] border border-white/[.07] bg-[#151326] sm:min-h-[470px] lg:min-h-[525px]">
        {featured.bannerImage && <Image alt="" className="object-cover object-center" fill priority sizes="100vw" src={featured.bannerImage} />}
        <div className="absolute inset-0 bg-gradient-to-r from-[#090d18] via-[#090d18]/90 to-[#090d18]/15" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#090d18]/80 via-transparent to-[#090d18]/10" />
        <div className="relative z-10 flex min-h-[410px] max-w-[740px] flex-col justify-end px-6 pb-10 pt-24 sm:min-h-[470px] sm:px-10 sm:pb-12 lg:min-h-[525px] lg:justify-center lg:px-14">
          <span className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full border border-violet-200/20 bg-violet-200/[.08] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[1.5px] text-violet-100"><Sparkles size={12} /> Featured this week</span>
          <h1 className="font-display text-[38px] font-bold leading-tight tracking-[-1.3px] text-white sm:text-[50px]">{featured.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2.5 text-[11px] text-slate-300"><RatingDisplay value={featured.rating} /><span>·</span><span>{featured.releaseYear ?? "TBA"}</span><span>·</span><span>{featured.season ?? "New"} season</span><span>·</span><span>{featured.totalEpisodes ?? "TBA"} episodes</span></div>
          <p className="mt-4 line-clamp-3 max-w-[580px] text-[12px] leading-6 text-slate-300 sm:text-[13px]">{featured.synopsis}</p>
          <div className="mt-5 flex flex-wrap gap-2">{featured.genres.slice(0, 3).map((genre) => <GenreLink genre={genre} key={genre} />)}</div>
          <div className="mt-7 flex flex-wrap gap-2.5"><Link className="inline-flex h-10 items-center gap-2 rounded-xl bg-violet-300 px-4 text-xs font-bold text-slate-950 transition hover:bg-violet-200" href={`/watch/${featured.slug}/1`}><Play size={14} fill="currentColor" /> Watch now</Link><Link className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/15 bg-white/[.06] px-4 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/[.12]" href={`/anime/${featured.slug}`}>More details <ArrowRight size={14} /></Link><HomeInteractions anime={featured} /></div>
        </div>
        <div className="absolute bottom-5 right-6 z-10 hidden items-center gap-2 text-[9px] font-semibold text-white/65 lg:flex"><span className="size-1.5 rounded-full bg-violet-300" /> FEATURED PICK</div>
      </section> : <section className="mt-5 rounded-[25px] border border-white/[.07] bg-[#111827] p-8 sm:p-12"><p className="eyebrow">WELCOME TO ANIFRAME</p><h1 className="font-display text-3xl font-bold text-white">Your anime catalog is ready.</h1><p className="mt-2 text-sm text-slate-400">No anime records are available yet. Import permitted catalog metadata to start browsing.</p><Link className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-300 px-4 py-2.5 text-xs font-bold text-slate-950" href="/anime">Browse catalog <ArrowRight size={13} /></Link></section>}

      <AnimeRail title="Trending anime" kicker="WHAT EVERYONE'S WATCHING" anime={trending.data} href="/anime?sort=popularity" />
      {thisSeason.length > 0
        ? <AnimeRail title="Popular this season" kicker={`${currentSeason.toUpperCase()} ${new Date().getFullYear()} LINEUP`} anime={thisSeason} href={`/anime?season=${currentSeason}&year=${new Date().getFullYear()}`} />
        : <section className="mt-10 rounded-2xl border border-white/[.06] bg-white/[.02] p-5"><p className="eyebrow">CURRENT SEASON</p><h2 className="section-title">Popular this season</h2><p className="mb-0 mt-2 text-xs text-slate-500">No current-season catalog metadata is available yet.</p></section>}

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between"><div><p className="eyebrow"><CalendarClock size={12} /> FRESHLY RELEASED</p><h2 className="section-title">Recently updated episodes</h2></div><Link className="hidden items-center gap-1 text-[10px] text-slate-400 hover:text-white sm:flex" href="/schedule">Full schedule <ArrowRight size={12} /></Link></div>
        {updatedEpisodes.length ? <div className="grid gap-2 sm:grid-cols-2">{updatedEpisodes.map(({ anime, episode }) => <Link className="group flex items-center gap-3 rounded-2xl border border-white/[.06] bg-white/[.025] p-2.5 transition hover:border-violet-300/20 hover:bg-white/[.045]" href={`/watch/${anime.slug}/${episode.episodeNumber}`} key={episode.id}><span className="relative block h-16 w-[94px] shrink-0 overflow-hidden rounded-xl bg-slate-800"><Image alt="" className="object-cover" fill sizes="94px" src={anime.bannerImage} /></span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-slate-100 group-hover:text-violet-200">{anime.title}</span><span className="mt-1.5 block text-[10px] text-slate-400">{episode.title}</span><span className="mt-1 block text-[9px] text-slate-600">{episode.releaseDate} · episode update</span></span><span className="mr-1 grid size-8 shrink-0 place-items-center rounded-full border border-white/[.07] text-slate-300 transition group-hover:border-violet-300/25 group-hover:bg-violet-300/10 group-hover:text-violet-100"><Play size={12} fill="currentColor" /></span></Link>)}</div> : <EmptyEpisodes />}
      </section>

      {popular.length > 0 && <AnimeRail title="Most popular" kicker="FAN FAVORITES" anime={popular} href="/anime?sort=popularity" />}
      <AnimeRail title="Recommended for you" kicker="HAND-PICKED DISCOVERIES" anime={recommended} />
      <AnimeRail title="Recently added" kicker="NEW TO THE LIBRARY" anime={recentlyAdded} href="/anime?sort=newest" />
      <section className="mt-10"><div className="mb-4"><p className="eyebrow">EXPLORE BY MOOD</p><h2 className="section-title">Browse genres</h2></div><div className="flex flex-wrap gap-2">{genres.map((genre) => <GenreLink genre={genre} key={genre} />)}</div></section>
      <section className="mt-11 rounded-2xl border border-violet-300/10 bg-gradient-to-r from-violet-400/[.08] via-blue-400/[.035] to-transparent p-5 sm:flex sm:items-center sm:justify-between sm:px-7"><div><p className="mb-1 text-sm font-bold text-slate-100">Keep your next watch close.</p><p className="m-0 text-[11px] text-slate-400">Your personal watchlist stays right here on this device.</p></div><Link className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-violet-200 hover:text-white sm:mt-0" href="/watchlist">Open watchlist <ArrowRight size={13} /></Link></section>
    </div>
  );
}

function RatingDisplay({ value }: { value?: number }) {
  if (value === undefined) return <span className="text-slate-400">Unrated</span>;
  return <span className="inline-flex items-center gap-1 font-semibold text-amber-300"><Star size={12} fill="currentColor" />{value.toFixed(1)}</span>;
}

function GenreLink({ genre }: { genre: string }) {
  return <Link className="rounded-full border border-white/[.09] bg-white/[.035] px-3 py-1.5 text-[10px] text-slate-300 transition hover:border-violet-300/25 hover:bg-violet-300/[.08] hover:text-violet-100" href={`/genres/${genre.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>{genre}</Link>;
}

function EmptyEpisodes() {
  return <p className="rounded-2xl border border-white/[.06] bg-white/[.025] p-6 text-center text-xs text-slate-400">Episode release metadata is not available for the current sample catalog.</p>;
}

function AnimeRail({ title, kicker, anime, href }: { title: string; kicker: string; anime: typeof mockAnime; href?: string }) {
  if (!anime.length) return null;
  return (
    <section className="mt-10">
      <div className="mb-4 flex items-end justify-between"><div><p className="eyebrow">{kicker}</p><h2 className="section-title">{title}</h2></div>{href && <Link className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 transition hover:text-violet-200" href={href}>See all <ArrowRight size={12} /></Link>}</div>
      <div className="flex snap-x gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-4">{anime.map((item) => <AnimeCard anime={item} compact key={item.id} />)}</div>
    </section>
  );
}
