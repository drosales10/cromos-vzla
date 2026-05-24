-- CreateEnum
CREATE TYPE "TradeStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "trade_proposals" (
    "id" TEXT NOT NULL,
    "from_user_id" UUID NOT NULL,
    "to_user_id" UUID NOT NULL,
    "status" "TradeStatus" NOT NULL DEFAULT 'PENDING',
    "give_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "receive_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trade_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trade_proposals_from_user_id_created_at_idx" ON "trade_proposals"("from_user_id", "created_at");

-- CreateIndex
CREATE INDEX "trade_proposals_to_user_id_status_created_at_idx" ON "trade_proposals"("to_user_id", "status", "created_at");

-- AddForeignKey
ALTER TABLE "trade_proposals" ADD CONSTRAINT "trade_proposals_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_proposals" ADD CONSTRAINT "trade_proposals_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
