/*
  Warnings:

  - Made the column `expires_at` on table `trade_proposals` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "trade_proposals" ALTER COLUMN "expires_at" SET NOT NULL;
