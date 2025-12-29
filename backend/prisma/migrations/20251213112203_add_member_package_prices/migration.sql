-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "location_id" INTEGER;

-- CreateTable
CREATE TABLE "location_package_prices" (
    "id" SERIAL NOT NULL,
    "location_id" INTEGER NOT NULL,
    "package_id" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "location_package_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_package_prices" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "package_id" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "member_package_prices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "location_package_prices_location_id_idx" ON "location_package_prices"("location_id");

-- CreateIndex
CREATE INDEX "location_package_prices_package_id_idx" ON "location_package_prices"("package_id");

-- CreateIndex
CREATE UNIQUE INDEX "location_package_prices_location_id_package_id_key" ON "location_package_prices"("location_id", "package_id");

-- CreateIndex
CREATE INDEX "member_package_prices_user_id_idx" ON "member_package_prices"("user_id");

-- CreateIndex
CREATE INDEX "member_package_prices_package_id_idx" ON "member_package_prices"("package_id");

-- CreateIndex
CREATE UNIQUE INDEX "member_package_prices_user_id_package_id_key" ON "member_package_prices"("user_id", "package_id");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_package_prices" ADD CONSTRAINT "location_package_prices_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_package_prices" ADD CONSTRAINT "location_package_prices_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "session_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_package_prices" ADD CONSTRAINT "member_package_prices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_package_prices" ADD CONSTRAINT "member_package_prices_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "session_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
