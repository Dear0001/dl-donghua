export type AnimeStatus = "ONGOING" | "COMPLETED" | "UPCOMING" | "UNKNOWN";
export type AnimeType = "TV" | "MOVIE" | "OVA" | "ONA" | "SPECIAL";
export type WatchlistStatus = "PLAN_TO_WATCH" | "WATCHING" | "COMPLETED" | "ON_HOLD" | "DROPPED";

export type VideoSource = {
  url: string;
  type: "video/mp4" | "application/x-mpegURL";
  label: string;
  authorized: true;
};

export type SubtitleTrack = { src: string; lang: string; label: string; default?: boolean };

export interface Episode {
  id: string;
  animeId: string;
  episodeNumber: number;
  title: string;
  synopsis?: string;
  thumbnail?: string;
  duration?: number;
  releaseDate?: string;
  videoSources: VideoSource[];
  subtitles: SubtitleTrack[];
  audioLanguages: string[];
}

export interface Anime {
  id: string;
  slug: string;
  title: string;
  alternativeTitles: string[];
  synopsis: string;
  posterImage: string;
  bannerImage: string;
  genres: string[];
  releaseYear?: number;
  season?: string;
  status: AnimeStatus;
  type: AnimeType;
  rating?: number;
  totalEpisodes?: number;
  studio?: string;
  tags: string[];
  episodes: Episode[];
  sourceUrl?: string;
}

export type AnimeSummary = Pick<Anime,
  "id" | "slug" | "title" | "alternativeTitles" | "synopsis" | "posterImage" |
  "bannerImage" | "genres" | "releaseYear" | "season" | "status" | "type" |
  "rating" | "totalEpisodes" | "studio" | "tags" | "sourceUrl"
>;

export interface WatchProgress {
  animeId: string;
  anime?: AnimeSummary;
  episodeId: string;
  episodeNumber?: number;
  currentTime: number;
  duration: number;
  lastWatchedAt: string;
  completed: boolean;
}

export interface WatchlistItem {
  animeId: string;
  anime?: AnimeSummary;
  status: WatchlistStatus;
  addedAt: string;
  updatedAt: string;
  progressEpisode: number;
}

export const watchlistStatuses: { id: WatchlistStatus; label: string }[] = [
  { id: "PLAN_TO_WATCH", label: "Plan to Watch" },
  { id: "WATCHING", label: "Watching" },
  { id: "COMPLETED", label: "Completed" },
  { id: "ON_HOLD", label: "On Hold" },
  { id: "DROPPED", label: "Dropped" },
];
