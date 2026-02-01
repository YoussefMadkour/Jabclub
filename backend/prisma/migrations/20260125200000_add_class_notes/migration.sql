-- CreateTable: Add ClassNote model
CREATE TABLE IF NOT EXISTS "class_notes" (
    "id" SERIAL NOT NULL,
    "booking_id" INTEGER NOT NULL,
    "coach_id" INTEGER NOT NULL,
    "rating" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "class_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Add unique constraint on booking_id (one note per booking)
CREATE UNIQUE INDEX IF NOT EXISTS "class_notes_booking_id_key" ON "class_notes"("booking_id");

-- CreateIndex: Add index on coach_id
CREATE INDEX IF NOT EXISTS "class_notes_coach_id_idx" ON "class_notes"("coach_id");

-- CreateIndex: Add index on booking_id
CREATE INDEX IF NOT EXISTS "class_notes_booking_id_idx" ON "class_notes"("booking_id");

-- AddForeignKey: Link to bookings table
ALTER TABLE "class_notes" ADD CONSTRAINT "class_notes_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Link to users table (coach)
ALTER TABLE "class_notes" ADD CONSTRAINT "class_notes_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
