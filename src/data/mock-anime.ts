import type { Anime, Episode } from "@/types/anime";

const scenery = [
  "photo-1470252649378-9c29740c9fa8",
  "photo-1462331940025-496dfbfc7564",
  "photo-1519608487953-e999c86e7455",
  "photo-1500530855697-b586d89ba3ee",
  "photo-1534796636912-3b95b3ab5986",
  "photo-1446776811953-b23d57bd21aa",
];

function art(photo: string, width: number) {
  return `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=${width}&q=85`;
}

function episode(animeId: string, episodeNumber: number, title: string, date?: string): Episode {
  return {
    id: `${animeId}-episode-${episodeNumber}`,
    animeId,
    episodeNumber,
    title,
    releaseDate: date,
    videoSources: [],
    subtitles: [],
    audioLanguages: [],
  };
}

function createAnime(
  id: string,
  title: string,
  poster: number,
  banner: number,
  options: Partial<Anime> & Pick<Anime, "genres" | "releaseYear" | "rating" | "status">,
): Anime {
  const posterImage = art(scenery[poster % scenery.length], 640);
  const bannerImage = art(scenery[banner % scenery.length], 1600);
  const episodes = options.episodes ?? Array.from({ length: 12 }, (_, index) =>
    episode(id, index + 1, `Episode ${index + 1}`),
  );
  return {
    ...options,
    id,
    slug: id,
    title,
    alternativeTitles: [],
    synopsis: "Illustrative sample catalog data for interface development. Replace this description and metadata with verified, appropriately licensed anime catalog data.",
    posterImage,
    bannerImage,
    genres: options.genres,
    releaseYear: options.releaseYear,
    season: options.season,
    status: options.status,
    type: options.type ?? "TV",
    rating: options.rating,
    totalEpisodes: options.totalEpisodes ?? episodes.length,
    studio: options.studio,
    tags: options.tags ?? [],
    episodes,
  };
}

export const mockAnime: Anime[] = [
  createAnime("celestial-chronicles", "Celestial Chronicles", 0, 2, { alternativeTitles: ["Hoshikuzu no Monogatari"], genres: ["Adventure", "Fantasy", "Action"], releaseYear: 2025, season: "Fall", status: "ONGOING", rating: 9.2, studio: "Asteria Works", tags: ["Trending", "Editor's Pick"], synopsis: "A wandering swordswoman and a young star-reader cross a world where constellations shape the fate of kingdoms. Every promise carries a cost beneath an endless violet sky.", episodes: [episode("celestial-chronicles", 1, "The Starfall Oath", "2025-10-04"), episode("celestial-chronicles", 2, "A Map of Forgotten Skies", "2025-10-11"), episode("celestial-chronicles", 3, "The Quiet Observatory", "2025-10-18"), episode("celestial-chronicles", 4, "Where Comets Sleep", "2025-10-25")] }),
  createAnime("bloom-after-rain", "The Bloom After Rain", 4, 0, { genres: ["Drama", "Romance", "Slice of Life"], releaseYear: 2025, season: "Fall", status: "ONGOING", rating: 8.8, studio: "Paper Lantern Studio", tags: ["New Episode"], synopsis: "Two former friends reunite at a seaside flower shop and discover that growing up did not mean growing apart." }),
  createAnime("iron-moon", "Iron Moon Requiem", 5, 4, { alternativeTitles: ["Tetsu no Tsuki"], genres: ["Action", "Sci-Fi", "Drama"], releaseYear: 2024, season: "Winter", status: "COMPLETED", rating: 9.0, studio: "Northstar Animation", tags: ["Fan Favorite"] }),
  createAnime("little-spirit", "Little Spirit Atelier", 3, 1, { genres: ["Fantasy", "Adventure", "Comedy"], releaseYear: 2025, season: "Summer", status: "COMPLETED", rating: 8.5, studio: "Moss & Ink" }),
  createAnime("blue-hour", "Blue Hour Rendezvous", 2, 3, { genres: ["Romance", "Drama"], releaseYear: 2025, season: "Spring", status: "COMPLETED", rating: 8.7, studio: "Daybreak Pictures" }),
  createAnime("abyssal-orbit", "Abyssal Orbit", 1, 5, { genres: ["Sci-Fi", "Adventure", "Mystery"], releaseYear: 2024, season: "Fall", status: "COMPLETED", rating: 8.9, studio: "Halcyon Animation", type: "ONA" }),
  createAnime("foxglove", "Foxglove & Flame", 4, 5, { genres: ["Action", "Fantasy", "Romance"], releaseYear: 2025, season: "Fall", status: "ONGOING", rating: 8.4, studio: "Cloverfield Works", tags: ["New Episode"] }),
  createAnime("paper-kingdom", "The Paper Kingdom", 0, 4, { genres: ["Fantasy", "Drama"], releaseYear: 2023, season: "Spring", status: "COMPLETED", rating: 9.1, studio: "Paper Lantern Studio", type: "MOVIE", totalEpisodes: 1, episodes: [episode("paper-kingdom", 1, "The Paper Kingdom")] }),
  createAnime("lantern-express", "Lantern Express 404", 3, 2, { genres: ["Mystery", "Supernatural", "Drama"], releaseYear: 2024, season: "Summer", status: "COMPLETED", rating: 8.3, studio: "Asteria Works" }),
  createAnime("thunder-garden", "Thunder Garden", 5, 3, { genres: ["Action", "Adventure"], releaseYear: 2025, season: "Fall", status: "ONGOING", rating: 8.1, studio: "Northstar Animation" }),
  createAnime("winter-orchestra", "Winter Orchestra", 2, 0, { genres: ["Music", "Drama", "Slice of Life"], releaseYear: 2024, season: "Winter", status: "COMPLETED", rating: 8.6, studio: "Daybreak Pictures", type: "OVA", totalEpisodes: 4, episodes: Array.from({ length: 4 }, (_, index) => episode("winter-orchestra", index + 1, `Movement ${index + 1}`)) }),
  createAnime("jade-sea", "Jade Sea Pilgrimage", 1, 2, { genres: ["Adventure", "Fantasy"], releaseYear: 2025, season: "Fall", status: "UPCOMING", studio: "Cloverfield Works", type: "ONA", totalEpisodes: undefined, episodes: [] }),
];

export const animeGenres = [...new Set(mockAnime.flatMap((item) => item.genres))].sort();

export const scheduleSamples = [
  { day: "Monday", time: "Sample time — not a live release schedule", animeId: "iron-moon", episode: "Episode 6", timezone: "Times not verified" },
  { day: "Wednesday", time: "Sample time — not a live release schedule", animeId: "bloom-after-rain", episode: "Episode 8", timezone: "Times not verified" },
  { day: "Friday", time: "Sample time — not a live release schedule", animeId: "foxglove", episode: "Episode 5", timezone: "Times not verified" },
  { day: "Saturday", time: "Sample time — not a live release schedule", animeId: "celestial-chronicles", episode: "Episode 4", timezone: "Times not verified" },
];
