-- AlterEnum
ALTER TYPE "TradeStatus" ADD VALUE 'EXPIRED';

-- AlterTable
ALTER TABLE "trade_proposals" ADD COLUMN     "expires_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "trade_proposals_status_expires_at_idx" ON "trade_proposals"("status", "expires_at");
