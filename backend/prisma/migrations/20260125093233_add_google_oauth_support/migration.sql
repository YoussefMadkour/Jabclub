-- AlterTable: Make password_hash optional and add google_id
ALTER TABLE "users" 
  ALTER COLUMN "password_hash" DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS "google_id" TEXT;

-- CreateIndex: Add unique constraint on google_id
CREATE UNIQUE INDEX IF NOT EXISTS "users_google_id_key" ON "users"("google_id") WHERE "google_id" IS NOT NULL;
