import { AnimeCardSkeleton } from "@/components/ui/primitives";

export default function Loading() {
  return <div aria-label="Loading anime catalog" className="mx-auto max-w-[1440px] px-4 py-12 sm:px-7"><div className="mb-7 h-7 w-56 animate-pulse rounded bg-white/[.06]" /><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">{Array.from({ length: 12 }, (_, index) => <AnimeCardSkeleton key={index} />)}</div></div>;
}
