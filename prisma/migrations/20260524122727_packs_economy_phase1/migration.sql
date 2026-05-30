-- CreateEnum
CREATE TYPE "StickerRarity" AS ENUM ('COMMON', 'SPECIAL', 'GOLD');

-- CreateEnum
CREATE TYPE "CouponRewardType" AS ENUM ('COINS', 'PACK');

-- CreateTable
CREATE TABLE "sticker_catalog" (
    "id" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "rarity" "StickerRarity" NOT NULL DEFAULT 'COMMON',
    "weight" INTEGER NOT NULL DEFAULT 100,
    "image_path" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sticker_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pack_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "size" INTEGER NOT NULL DEFAULT 5,
    "price_coins" INTEGER NOT NULL DEFAULT 100,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pack_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_wallets" (
    "user_id" UUID NOT NULL,
    "coins" INTEGER NOT NULL DEFAULT 0,
    "last_daily_claim_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_wallets_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "wallet_ledger" (
    "id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "entry_type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "balance_after" INTEGER NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_pack_inventory" (
    "user_id" UUID NOT NULL,
    "pack_type_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pack_inventory_pkey" PRIMARY KEY ("user_id","pack_type_id")
);

-- CreateTable
CREATE TABLE "pack_openings" (
    "id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "pack_type_id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "cost_coins" INTEGER NOT NULL DEFAULT 0,
    "coupon_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pack_openings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pack_opening_items" (
    "id" TEXT NOT NULL,
    "opening_id" TEXT NOT NULL,
    "slot" INTEGER NOT NULL,
    "sticker_id" TEXT NOT NULL,
    "is_new" BOOLEAN NOT NULL DEFAULT false,
    "is_double" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pack_opening_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupons" (
    "code" TEXT NOT NULL,
    "reward_type" "CouponRewardType" NOT NULL,
    "coins_amount" INTEGER,
    "pack_type_id" TEXT,
    "pack_quantity" INTEGER NOT NULL DEFAULT 1,
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "max_global_uses" INTEGER,
    "max_per_user" INTEGER NOT NULL DEFAULT 1,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_by_user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "coupon_redemptions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "opening_id" TEXT,

    CONSTRAINT "coupon_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sticker_catalog_section_idx" ON "sticker_catalog"("section");

-- CreateIndex
CREATE INDEX "sticker_catalog_rarity_idx" ON "sticker_catalog"("rarity");

-- CreateIndex
CREATE INDEX "sticker_catalog_active_idx" ON "sticker_catalog"("active");

-- CreateIndex
CREATE INDEX "wallet_ledger_user_id_created_at_idx" ON "wallet_ledger"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "wallet_ledger_entry_type_idx" ON "wallet_ledger"("entry_type");

-- CreateIndex
CREATE INDEX "user_pack_inventory_pack_type_id_idx" ON "user_pack_inventory"("pack_type_id");

-- CreateIndex
CREATE INDEX "pack_openings_user_id_created_at_idx" ON "pack_openings"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "pack_openings_pack_type_id_idx" ON "pack_openings"("pack_type_id");

-- CreateIndex
CREATE INDEX "pack_opening_items_opening_id_slot_idx" ON "pack_opening_items"("opening_id", "slot");

-- CreateIndex
CREATE INDEX "pack_opening_items_sticker_id_idx" ON "pack_opening_items"("sticker_id");

-- CreateIndex
CREATE INDEX "coupons_active_starts_at_ends_at_idx" ON "coupons"("active", "starts_at", "ends_at");

-- CreateIndex
CREATE INDEX "coupon_redemptions_code_user_id_idx" ON "coupon_redemptions"("code", "user_id");

-- CreateIndex
CREATE INDEX "coupon_redemptions_user_id_created_at_idx" ON "coupon_redemptions"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "user_wallets" ADD CONSTRAINT "user_wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_ledger" ADD CONSTRAINT "wallet_ledger_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_pack_inventory" ADD CONSTRAINT "user_pack_inventory_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_pack_inventory" ADD CONSTRAINT "user_pack_inventory_pack_type_id_fkey" FOREIGN KEY ("pack_type_id") REFERENCES "pack_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pack_openings" ADD CONSTRAINT "pack_openings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pack_openings" ADD CONSTRAINT "pack_openings_pack_type_id_fkey" FOREIGN KEY ("pack_type_id") REFERENCES "pack_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pack_opening_items" ADD CONSTRAINT "pack_opening_items_opening_id_fkey" FOREIGN KEY ("opening_id") REFERENCES "pack_openings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pack_opening_items" ADD CONSTRAINT "pack_opening_items_sticker_id_fkey" FOREIGN KEY ("sticker_id") REFERENCES "sticker_catalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_pack_type_id_fkey" FOREIGN KEY ("pack_type_id") REFERENCES "pack_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_code_fkey" FOREIGN KEY ("code") REFERENCES "coupons"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_opening_id_fkey" FOREIGN KEY ("opening_id") REFERENCES "pack_openings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
