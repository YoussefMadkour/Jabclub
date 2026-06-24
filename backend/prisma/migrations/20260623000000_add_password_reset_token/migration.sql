-- AlterTable: Add password-reset token fields to users
ALTER TABLE "users" ADD COLUMN "reset_token_hash" TEXT;
ALTER TABLE "users" ADD COLUMN "reset_token_expiry" TIMESTAMP(3);
