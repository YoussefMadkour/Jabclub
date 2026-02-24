-- Performance indexes for frequently queried columns

-- children: look up by parent
CREATE INDEX IF NOT EXISTS "children_parent_id_idx" ON "children"("parent_id");

-- payments: filter by user, package, location
CREATE INDEX IF NOT EXISTS "payments_user_id_idx" ON "payments"("user_id");
CREATE INDEX IF NOT EXISTS "payments_package_id_idx" ON "payments"("package_id");
CREATE INDEX IF NOT EXISTS "payments_location_id_idx" ON "payments"("location_id");

-- class_instances: filter by location, coach, class type (most common admin queries)
CREATE INDEX IF NOT EXISTS "class_instances_location_id_idx" ON "class_instances"("location_id");
CREATE INDEX IF NOT EXISTS "class_instances_coach_id_idx" ON "class_instances"("coach_id");
CREATE INDEX IF NOT EXISTS "class_instances_class_type_id_idx" ON "class_instances"("class_type_id");
-- Composite: the most common query pattern (location + date range)
CREATE INDEX IF NOT EXISTS "class_instances_location_start_time_idx" ON "class_instances"("location_id", "start_time");

-- credit_transactions: look up by user, package, booking
CREATE INDEX IF NOT EXISTS "credit_transactions_user_id_idx" ON "credit_transactions"("user_id");
CREATE INDEX IF NOT EXISTS "credit_transactions_member_package_id_idx" ON "credit_transactions"("member_package_id");
CREATE INDEX IF NOT EXISTS "credit_transactions_booking_id_idx" ON "credit_transactions"("booking_id");
