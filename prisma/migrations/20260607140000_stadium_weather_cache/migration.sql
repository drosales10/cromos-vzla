-- CreateTable
CREATE TABLE "stadium_weather_cache" (
    "stadium_id" TEXT NOT NULL,
    "temperature_c" DECIMAL(4,1) NOT NULL,
    "humidity_pct" INTEGER NOT NULL,
    "conditions" TEXT NOT NULL,
    "wind_speed_ms" DECIMAL(4,1),
    "simulated" BOOLEAN NOT NULL DEFAULT false,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stadium_weather_cache_pkey" PRIMARY KEY ("stadium_id")
);

-- CreateIndex
CREATE INDEX "stadium_weather_cache_fetched_at_idx" ON "stadium_weather_cache"("fetched_at");

-- AddForeignKey
ALTER TABLE "stadium_weather_cache" ADD CONSTRAINT "stadium_weather_cache_stadium_id_fkey" FOREIGN KEY ("stadium_id") REFERENCES "stadiums"("id") ON DELETE CASCADE ON UPDATE CASCADE;
