import { WatchlistClient } from "@/components/anime/watchlist-client";

export const metadata = { title: "My Watchlist — AniFrame", description: "Your private anime watchlist and recent playback progress." };

export default function WatchlistPage() {
  return <WatchlistClient />;
}
