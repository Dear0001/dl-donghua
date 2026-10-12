import type { Metadata } from "next";
import { AnimeCard, EmptyState } from "@/components/ui/primitives";
import { animeGenres } from "@/data/mock-anime";
import { slugify } from "@/lib/slug";
import { listAnime } from "@/services/anime-repository";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; sort?: string; year?: string; season?: string; status?: string; type?: string }>;
};

function titleFromSlug(slug: string) {
  return animeGenres.find((genre) => slugify(genre) === slug)
    ?? slug.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const title = titleFromSlug(slug);
  return { title: `${title} Anime — AniFrame`, description: `Explore ${title} anime in the AniFrame catalog.` };
}

export default async function GenrePage({ params, searchParams }: Props) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const genre = titleFromSlug(slug);
  const parsedYear = Number(query.year);
  const page = Number(query.page);
  const sort = ["popularity", "rating", "newest", "title"].includes(query.sort ?? "")
    ? query.sort as "popularity" | "rating" | "newest" | "title" : "rating";
  const result = await listAnime({
    genre,
    page: Number.isFinite(page) && page > 0 ? page : 1,
    limit: 24,
    sort,
    year: Number.isInteger(parsedYear) && parsedYear > 0 ? parsedYear : undefined,
    season: query.season || undefined,
    status: query.status || undefined,
    type: ["TV", "MOVIE", "OVA", "ONA", "SPECIAL"].includes(query.type ?? "")
      ? query.type as "TV" | "MOVIE" | "OVA" | "ONA" | "SPECIAL" : undefined,
  });
  const pageHref = (nextPage: number) => {
    const params = new URLSearchParams();
    for (const key of ["sort", "year", "season", "status", "type"] as const) {
      if (query[key]) params.set(key, query[key]!);
    }
    params.set("page", String(nextPage));
    return `/genres/${slug}?${params}`;
  };

  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-16 pt-10 sm:px-7 lg:px-10">
      <p className="eyebrow">EXPLORE A CATEGORY</p>
      <h1 className="font-display text-3xl font-bold capitalize text-white sm:text-4xl">{genre}<span className="text-violet-300"> anime.</span></h1>
      <p className="mt-2 text-sm text-slate-400">Stories in the {genre.toLowerCase()} genre.</p>
      <form action={`/genres/${slug}`} className="mt-6 grid gap-2 rounded-2xl border border-white/[.06] bg-white/[.025] p-3 sm:grid-cols-3 lg:grid-cols-6">
        <label className="text-[10px] text-slate-400">Sort<select className="mt-1 h-9 w-full rounded-lg border border-white/[.07] bg-[#0f172a] px-2 text-xs text-slate-200" defaultValue={sort} name="sort"><option value="popularity">Popularity</option><option value="rating">Rating</option><option value="newest">Newest</option><option value="title">Title</option></select></label>
        <label className="text-[10px] text-slate-400">Year<input className="mt-1 h-9 w-full rounded-lg border border-white/[.07] bg-[#0f172a] px-2 text-xs text-slate-200" defaultValue={query.year ?? ""} max="2200" min="1900" name="year" placeholder="Any year" type="number" /></label>
        <label className="text-[10px] text-slate-400">Season<select className="mt-1 h-9 w-full rounded-lg border border-white/[.07] bg-[#0f172a] px-2 text-xs text-slate-200" defaultValue={query.season ?? ""} name="season"><option value="">All seasons</option>{["Winter", "Spring", "Summer", "Fall"].map((season) => <option key={season}>{season}</option>)}</select></label>
        <label className="text-[10px] text-slate-400">Status<select className="mt-1 h-9 w-full rounded-lg border border-white/[.07] bg-[#0f172a] px-2 text-xs text-slate-200" defaultValue={query.status ?? ""} name="status"><option value="">All statuses</option>{["ONGOING", "COMPLETED", "UPCOMING"].map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
        <label className="text-[10px] text-slate-400">Type<select className="mt-1 h-9 w-full rounded-lg border border-white/[.07] bg-[#0f172a] px-2 text-xs text-slate-200" defaultValue={query.type ?? ""} name="type"><option value="">All types</option>{["TV", "MOVIE", "OVA", "ONA", "SPECIAL"].map((type) => <option key={type}>{type}</option>)}</select></label>
        <button className="mt-auto h-9 rounded-lg bg-violet-300 text-xs font-bold text-slate-950 hover:bg-violet-200">Apply filters</button>
      </form>
      <p className="mb-4 mt-5 text-[11px] text-slate-500">{result.pagination.total} titles</p>
      {result.data.length
        ? <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">{result.data.map((anime) => <AnimeCard anime={anime} key={anime.id} />)}</div>
        : <EmptyState title={`No ${genre} anime found`} description="Try changing the selected filters or check back after this genre has catalog entries." />}
      {result.pagination.pages > 1 && <nav aria-label="Genre pages" className="mt-9 flex items-center justify-center gap-5"><a aria-disabled={result.pagination.page <= 1} className="page-button" href={result.pagination.page > 1 ? pageHref(result.pagination.page - 1) : undefined}>Previous</a><span className="text-xs text-slate-400">Page {result.pagination.page} of {result.pagination.pages}</span><a aria-disabled={result.pagination.page >= result.pagination.pages} className="page-button" href={result.pagination.page < result.pagination.pages ? pageHref(result.pagination.page + 1) : undefined}>Next</a></nav>}
    </div>
  );
}
