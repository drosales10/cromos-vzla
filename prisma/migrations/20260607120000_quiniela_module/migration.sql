-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('SCHEDULED', 'LIVE', 'FINISHED');

-- CreateEnum
CREATE TYPE "TournamentPhase" AS ENUM ('GROUP', 'ROUND_16', 'QUARTER', 'SEMI', 'FINAL', 'THIRD_PLACE');

-- CreateTable
CREATE TABLE "stadiums" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "altitude_m" INTEGER NOT NULL DEFAULT 0,
    "capacity" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stadiums_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "flag_emoji" TEXT,
    "section_id" TEXT,
    "fifa_ranking" INTEGER,
    "squad_value_m" DECIMAL(8,2),
    "world_cups_played" INTEGER NOT NULL DEFAULT 0,
    "home_latitude" DECIMAL(10,7),
    "home_longitude" DECIMAL(10,7),
    "home_avg_temp_c" DECIMAL(4,1),
    "home_humidity_pct" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" TEXT NOT NULL,
    "home_team_id" TEXT NOT NULL,
    "away_team_id" TEXT NOT NULL,
    "stadium_id" TEXT NOT NULL,
    "kickoff_at" TIMESTAMP(3) NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'SCHEDULED',
    "phase" "TournamentPhase" NOT NULL DEFAULT 'GROUP',
    "group_code" TEXT,
    "home_score" INTEGER,
    "away_score" INTEGER,
    "home_travel_km" DECIMAL(8,1),
    "away_travel_km" DECIMAL(8,1),
    "predictions_scored_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_weather" (
    "id" TEXT NOT NULL,
    "match_id" TEXT NOT NULL,
    "temperature_c" DECIMAL(4,1) NOT NULL,
    "humidity_pct" INTEGER NOT NULL,
    "conditions" TEXT NOT NULL,
    "wind_speed_ms" DECIMAL(4,1),
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_weather_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "predictions" (
    "id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "match_id" TEXT NOT NULL,
    "home_goals" INTEGER NOT NULL,
    "away_goals" INTEGER NOT NULL,
    "points_earned" INTEGER NOT NULL DEFAULT 0,
    "coins_earned" INTEGER NOT NULL DEFAULT 0,
    "multiplier" DECIMAL(4,2) NOT NULL DEFAULT 1,
    "special_pack_awarded" BOOLEAN NOT NULL DEFAULT false,
    "scored_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_game_scores" (
    "user_id" UUID NOT NULL,
    "album_points" INTEGER NOT NULL DEFAULT 0,
    "trade_points" INTEGER NOT NULL DEFAULT 0,
    "quiniela_points" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_game_scores_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "private_leagues" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "invite_code" TEXT NOT NULL,
    "owner_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "private_leagues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "private_league_members" (
    "league_id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "private_league_members_pkey" PRIMARY KEY ("league_id","user_id")
);

-- CreateTable
CREATE TABLE "trade_score_entries" (
    "id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "trade_id" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trade_score_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stadiums_country_city_idx" ON "stadiums"("country", "city");

-- CreateIndex
CREATE INDEX "teams_fifa_ranking_idx" ON "teams"("fifa_ranking");

-- CreateIndex
CREATE INDEX "matches_kickoff_at_idx" ON "matches"("kickoff_at");

-- CreateIndex
CREATE INDEX "matches_status_kickoff_at_idx" ON "matches"("status", "kickoff_at");

-- CreateIndex
CREATE INDEX "matches_phase_idx" ON "matches"("phase");

-- CreateIndex
CREATE UNIQUE INDEX "match_weather_match_id_key" ON "match_weather"("match_id");

-- CreateIndex
CREATE INDEX "predictions_match_id_idx" ON "predictions"("match_id");

-- CreateIndex
CREATE INDEX "predictions_user_id_created_at_idx" ON "predictions"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "predictions_user_id_match_id_key" ON "predictions"("user_id", "match_id");

-- CreateIndex
CREATE UNIQUE INDEX "private_leagues_invite_code_key" ON "private_leagues"("invite_code");

-- CreateIndex
CREATE INDEX "private_leagues_owner_id_idx" ON "private_leagues"("owner_id");

-- CreateIndex
CREATE INDEX "private_league_members_user_id_idx" ON "private_league_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "trade_score_entries_trade_id_user_id_key" ON "trade_score_entries"("trade_id", "user_id");

-- CreateIndex
CREATE INDEX "trade_score_entries_user_id_created_at_idx" ON "trade_score_entries"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_home_team_id_fkey" FOREIGN KEY ("home_team_id") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_away_team_id_fkey" FOREIGN KEY ("away_team_id") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_stadium_id_fkey" FOREIGN KEY ("stadium_id") REFERENCES "stadiums"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_weather" ADD CONSTRAINT "match_weather_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_game_scores" ADD CONSTRAINT "user_game_scores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "private_leagues" ADD CONSTRAINT "private_leagues_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "private_league_members" ADD CONSTRAINT "private_league_members_league_id_fkey" FOREIGN KEY ("league_id") REFERENCES "private_leagues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "private_league_members" ADD CONSTRAINT "private_league_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_score_entries" ADD CONSTRAINT "trade_score_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
