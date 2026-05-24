-- Create table for exact per-sticker quantities per user
CREATE TABLE "user_sticker_inventory" (
    "user_id" UUID NOT NULL,
    "sticker_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "user_sticker_inventory_pkey" PRIMARY KEY ("user_id", "sticker_id")
);

CREATE INDEX "user_sticker_inventory_user_id_idx" ON "user_sticker_inventory"("user_id");
CREATE INDEX "user_sticker_inventory_sticker_id_idx" ON "user_sticker_inventory"("sticker_id");

ALTER TABLE "user_sticker_inventory"
ADD CONSTRAINT "user_sticker_inventory_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_sticker_inventory"
ADD CONSTRAINT "user_sticker_inventory_sticker_id_fkey"
FOREIGN KEY ("sticker_id") REFERENCES "sticker_catalog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill inventory from legacy arrays
WITH expanded AS (
    SELECT uc.user_id, unnest(uc.have) AS sticker_id, 1::INTEGER AS quantity
    FROM user_cromos uc
    UNION ALL
    SELECT uc.user_id, unnest(uc.doubles) AS sticker_id, 2::INTEGER AS quantity
    FROM user_cromos uc
    UNION ALL
    SELECT uc.user_id, unnest(uc.need) AS sticker_id, 2::INTEGER AS quantity
    FROM user_cromos uc
)
INSERT INTO user_sticker_inventory (user_id, sticker_id, quantity, created_at, updated_at)
SELECT e.user_id, e.sticker_id, MAX(e.quantity) AS quantity, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM expanded e
JOIN sticker_catalog sc ON sc.id = e.sticker_id
WHERE e.sticker_id IS NOT NULL AND e.sticker_id <> ''
GROUP BY e.user_id, e.sticker_id
ON CONFLICT (user_id, sticker_id)
DO UPDATE SET quantity = GREATEST(user_sticker_inventory.quantity, EXCLUDED.quantity), updated_at = CURRENT_TIMESTAMP;
