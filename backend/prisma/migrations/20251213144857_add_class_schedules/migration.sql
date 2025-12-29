-- AlterTable
ALTER TABLE "class_instances" ADD COLUMN     "schedule_id" INTEGER;

-- CreateTable
CREATE TABLE "class_schedules" (
    "id" SERIAL NOT NULL,
    "class_type_id" INTEGER NOT NULL,
    "coach_id" INTEGER NOT NULL,
    "location_id" INTEGER NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_time" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "class_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "class_schedules_is_active_idx" ON "class_schedules"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "class_schedules_class_type_id_coach_id_location_id_day_of_w_key" ON "class_schedules"("class_type_id", "coach_id", "location_id", "day_of_week", "start_time");

-- CreateIndex
CREATE INDEX "class_instances_schedule_id_idx" ON "class_instances"("schedule_id");

-- AddForeignKey
ALTER TABLE "class_instances" ADD CONSTRAINT "class_instances_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "class_schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_schedules" ADD CONSTRAINT "class_schedules_class_type_id_fkey" FOREIGN KEY ("class_type_id") REFERENCES "class_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_schedules" ADD CONSTRAINT "class_schedules_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_schedules" ADD CONSTRAINT "class_schedules_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
