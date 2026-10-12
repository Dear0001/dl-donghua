ALTER TABLE "Anime"
    ADD COLUMN "alternativeTitles" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    ADD COLUMN "type" TEXT NOT NULL DEFAULT 'TV',
    ADD COLUMN "rating" DOUBLE PRECISION,
    ADD COLUMN "releaseYear" INTEGER,
    ADD COLUMN "season" TEXT,
    ADD COLUMN "studio" TEXT,
    ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "Episode"
    ADD COLUMN "synopsis" TEXT,
    ADD COLUMN "duration" INTEGER,
    ADD COLUMN "releaseDate" TIMESTAMP(3),
    ADD COLUMN "audioLanguages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    ADD COLUMN "subtitles" JSONB,
    ADD COLUMN "videoSources" JSONB;
