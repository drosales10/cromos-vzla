-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "is_superuser" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "profiles_is_superuser_idx" ON "profiles"("is_superuser");
