-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "total_amount" DECIMAL(10,2),
ADD COLUMN     "vat_amount" DECIMAL(10,2) DEFAULT 0,
ADD COLUMN     "vat_included" BOOLEAN NOT NULL DEFAULT false;
