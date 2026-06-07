-- CreateTable
CREATE TABLE "simulation_picks" (
    "user_id" UUID NOT NULL,
    "bracket_slot" TEXT NOT NULL,
    "predicted_winner_team_id" TEXT NOT NULL,
    "predicted_home_goals" INTEGER,
    "predicted_away_goals" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "simulation_picks_pkey" PRIMARY KEY ("user_id","bracket_slot")
);

-- CreateIndex
CREATE INDEX "simulation_picks_user_id_idx" ON "simulation_picks"("user_id");

-- AddForeignKey
ALTER TABLE "simulation_picks" ADD CONSTRAINT "simulation_picks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
