CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE "Anime" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "synopsis" TEXT,
    "posterUrl" TEXT,
    "coverUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "sourceUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Anime_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Episode" (
    "id" TEXT NOT NULL,
    "animeId" TEXT NOT NULL,
    "episodeNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "sourceUrl" TEXT,
    "playbackUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Episode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Genre" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "Genre_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AnimeGenre" (
    "animeId" TEXT NOT NULL,
    "genreId" TEXT NOT NULL,

    CONSTRAINT "AnimeGenre_pkey" PRIMARY KEY ("animeId", "genreId")
);

CREATE UNIQUE INDEX "Anime_slug_key" ON "Anime"("slug");
CREATE UNIQUE INDEX "Anime_sourceUrl_key" ON "Anime"("sourceUrl");
CREATE INDEX "Anime_title_idx" ON "Anime" USING GIN ("title" gin_trgm_ops);
CREATE INDEX "Anime_updatedAt_idx" ON "Anime"("updatedAt");
CREATE UNIQUE INDEX "Episode_animeId_episodeNumber_key" ON "Episode"("animeId", "episodeNumber");
CREATE INDEX "Episode_animeId_idx" ON "Episode"("animeId");
CREATE UNIQUE INDEX "Genre_name_key" ON "Genre"("name");
CREATE UNIQUE INDEX "Genre_slug_key" ON "Genre"("slug");
CREATE INDEX "AnimeGenre_genreId_idx" ON "AnimeGenre"("genreId");

ALTER TABLE "Episode" ADD CONSTRAINT "Episode_animeId_fkey"
    FOREIGN KEY ("animeId") REFERENCES "Anime"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AnimeGenre" ADD CONSTRAINT "AnimeGenre_animeId_fkey"
    FOREIGN KEY ("animeId") REFERENCES "Anime"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AnimeGenre" ADD CONSTRAINT "AnimeGenre_genreId_fkey"
    FOREIGN KEY ("genreId") REFERENCES "Genre"("id") ON DELETE CASCADE ON UPDATE CASCADE;
