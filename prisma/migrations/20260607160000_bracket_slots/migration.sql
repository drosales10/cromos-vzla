-- AlterEnum
ALTER TYPE "TournamentPhase" ADD VALUE 'ROUND_32';

-- AlterTable
ALTER TABLE "matches" ADD COLUMN "bracket_slot" TEXT,
ADD COLUMN "feeder_home_slot" TEXT,
ADD COLUMN "feeder_away_slot" TEXT,
ADD COLUMN "bracket_order" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "matches_bracket_slot_key" ON "matches"("bracket_slot");

-- CreateIndex
CREATE INDEX "matches_phase_bracket_order_idx" ON "matches"("phase", "bracket_order");
