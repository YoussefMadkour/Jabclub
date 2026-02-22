-- AlterTable: Add temporary schedule fields to class_schedules
ALTER TABLE "class_schedules" ADD COLUMN "is_override" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "class_schedules" ADD COLUMN "override_start_date" TIMESTAMP(3);
ALTER TABLE "class_schedules" ADD COLUMN "override_end_date" TIMESTAMP(3);
ALTER TABLE "class_schedules" ADD COLUMN "base_schedule_id" INTEGER;

-- CreateIndex
CREATE INDEX "class_schedules_is_override_idx" ON "class_schedules"("is_override");
CREATE INDEX "class_schedules_override_start_date_override_end_date_idx" ON "class_schedules"("override_start_date", "override_end_date");
CREATE INDEX "class_schedules_base_schedule_id_idx" ON "class_schedules"("base_schedule_id");

-- AddForeignKey
ALTER TABLE "class_schedules" ADD CONSTRAINT "class_schedules_base_schedule_id_fkey" FOREIGN KEY ("base_schedule_id") REFERENCES "class_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Drop the old unique constraint and create a new one that includes override dates
-- Note: We need to handle this carefully since we can't drop a constraint that might have dependencies
-- For now, we'll keep the existing constraint and add a partial unique index for non-override schedules
-- Override schedules can have the same time/day combination as long as dates differ

-- Create a partial unique index for non-override schedules (maintains original behavior)
CREATE UNIQUE INDEX "class_schedules_unique_non_override" 
ON "class_schedules"("class_type_id", "coach_id", "location_id", "day_of_week", "start_time") 
WHERE "is_override" = false;

-- For override schedules, we allow duplicates as long as date ranges don't overlap
-- This will be handled at the application level
