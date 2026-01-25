-- Migration: Seed Default Class Schedule
-- This migration creates the default class schedule that repeats monthly
-- Manual changes to schedules will become the new default for future months

-- Step 1: Create missing class types if they don't exist
INSERT INTO "class_types" ("name", "description", "duration_minutes", "created_at", "updated_at")
SELECT 'Triple Burn', 'Triple Burn fitness class', 60, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "class_types" WHERE "name" = 'Triple Burn');

INSERT INTO "class_types" ("name", "description", "duration_minutes", "created_at", "updated_at")
SELECT 'Tone & Burn', 'Tone & Burn fitness class', 60, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "class_types" WHERE "name" = 'Tone & Burn');

INSERT INTO "class_types" ("name", "description", "duration_minutes", "created_at", "updated_at")
SELECT 'Boxing', 'Boxing training class', 60, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "class_types" WHERE "name" = 'Boxing');

-- Step 2: Get IDs for locations, class types, and coach
-- We'll use CTEs to make the INSERT statements cleaner
DO $$
DECLARE
    v_edge_fit_location_id INTEGER;
    v_gofit_location_id INTEGER;
    v_core_location_id INTEGER;
    v_coach_id INTEGER;
    
    -- Class type IDs
    v_triple_burn_id INTEGER;
    v_tone_burn_id INTEGER;
    v_kids_juniors_mma_id INTEGER;
    v_adults_kickboxing_id INTEGER;
    v_mma_pro_id INTEGER;
    v_adults_boxing_id INTEGER;
    v_boxing_id INTEGER;
    v_kids_juniors_kickboxing_id INTEGER;
    v_teens_adults_kickboxing_id INTEGER;
    v_rumble_kickboxing_id INTEGER;
BEGIN
    -- Get location IDs
    SELECT id INTO v_edge_fit_location_id FROM "locations" WHERE "name" ILIKE '%Edge Fit%Zayed Dunes%' LIMIT 1;
    SELECT id INTO v_gofit_location_id FROM "locations" WHERE "name" ILIKE '%Gofit Arena%' OR "name" ILIKE '%Hadayek%' LIMIT 1;
    SELECT id INTO v_core_location_id FROM "locations" WHERE "name" = 'CORE' LIMIT 1;
    
    -- Get coach ID (use first coach found, or create one if none exists)
    SELECT id INTO v_coach_id FROM "users" WHERE "role" = 'coach' LIMIT 1;
    IF v_coach_id IS NULL THEN
        INSERT INTO "users" ("email", "password_hash", "first_name", "last_name", "role", "created_at", "updated_at")
        VALUES ('default-coach@jabclub.com', '$2b$10$default', 'Default', 'Coach', 'coach', NOW(), NOW())
        RETURNING id INTO v_coach_id;
    END IF;
    
    -- Get class type IDs
    SELECT id INTO v_triple_burn_id FROM "class_types" WHERE "name" = 'Triple Burn' LIMIT 1;
    SELECT id INTO v_tone_burn_id FROM "class_types" WHERE "name" = 'Tone & Burn' LIMIT 1;
    SELECT id INTO v_kids_juniors_mma_id FROM "class_types" WHERE "name" = 'Kids & Juniors MMA' LIMIT 1;
    SELECT id INTO v_adults_kickboxing_id FROM "class_types" WHERE "name" = 'Adults Kickboxing' LIMIT 1;
    SELECT id INTO v_mma_pro_id FROM "class_types" WHERE "name" = 'MMA Pro' LIMIT 1;
    SELECT id INTO v_adults_boxing_id FROM "class_types" WHERE "name" = 'Adults Boxing' LIMIT 1;
    SELECT id INTO v_boxing_id FROM "class_types" WHERE "name" = 'Boxing' LIMIT 1;
    SELECT id INTO v_kids_juniors_kickboxing_id FROM "class_types" WHERE "name" = 'Kids & Juniors Kickboxing' LIMIT 1;
    SELECT id INTO v_teens_adults_kickboxing_id FROM "class_types" WHERE "name" = 'Teens & Adults Kickboxing' LIMIT 1;
    SELECT id INTO v_rumble_kickboxing_id FROM "class_types" WHERE "name" = 'Rumble Kickboxing' LIMIT 1;
    
    -- Step 3: Insert schedules for EDGE FIT – Zayed Dunes Club House
    -- Saturday to Thursday (day 6 to day 4)
    -- 09:30 AM - Sunday: Ladies Only – Triple Burn, Tuesday: Ladies Only – Tone & Burn
    IF v_edge_fit_location_id IS NOT NULL AND v_coach_id IS NOT NULL THEN
        -- Sunday 09:30 - Triple Burn
        IF v_triple_burn_id IS NOT NULL THEN
            INSERT INTO "class_schedules" ("class_type_id", "coach_id", "location_id", "day_of_week", "start_time", "capacity", "is_active", "created_at", "updated_at")
            VALUES (v_triple_burn_id, v_coach_id, v_edge_fit_location_id, 0, '09:30', 20, true, NOW(), NOW())
            ON CONFLICT ("class_type_id", "coach_id", "location_id", "day_of_week", "start_time") DO NOTHING;
        END IF;
        
        -- Tuesday 09:30 - Tone & Burn
        IF v_tone_burn_id IS NOT NULL THEN
            INSERT INTO "class_schedules" ("class_type_id", "coach_id", "location_id", "day_of_week", "start_time", "capacity", "is_active", "created_at", "updated_at")
            VALUES (v_tone_burn_id, v_coach_id, v_edge_fit_location_id, 2, '09:30', 20, true, NOW(), NOW())
            ON CONFLICT ("class_type_id", "coach_id", "location_id", "day_of_week", "start_time") DO NOTHING;
        END IF;
        
        -- 06:00 PM - Saturday to Thursday: Kids & Juniors MMA
        IF v_kids_juniors_mma_id IS NOT NULL THEN
            INSERT INTO "class_schedules" ("class_type_id", "coach_id", "location_id", "day_of_week", "start_time", "capacity", "is_active", "created_at", "updated_at")
            VALUES 
                (v_kids_juniors_mma_id, v_coach_id, v_edge_fit_location_id, 6, '18:00', 20, true, NOW(), NOW()),
                (v_kids_juniors_mma_id, v_coach_id, v_edge_fit_location_id, 0, '18:00', 20, true, NOW(), NOW()),
                (v_kids_juniors_mma_id, v_coach_id, v_edge_fit_location_id, 1, '18:00', 20, true, NOW(), NOW()),
                (v_kids_juniors_mma_id, v_coach_id, v_edge_fit_location_id, 2, '18:00', 20, true, NOW(), NOW()),
                (v_kids_juniors_mma_id, v_coach_id, v_edge_fit_location_id, 3, '18:00', 20, true, NOW(), NOW()),
                (v_kids_juniors_mma_id, v_coach_id, v_edge_fit_location_id, 4, '18:00', 20, true, NOW(), NOW())
            ON CONFLICT ("class_type_id", "coach_id", "location_id", "day_of_week", "start_time") DO NOTHING;
        END IF;
        
        -- 07:00 PM schedules
        IF v_adults_kickboxing_id IS NOT NULL THEN
            -- Saturday, Monday, Tuesday, Wednesday, Thursday: Adults Kickboxing
            INSERT INTO "class_schedules" ("class_type_id", "coach_id", "location_id", "day_of_week", "start_time", "capacity", "is_active", "created_at", "updated_at")
            VALUES 
                (v_adults_kickboxing_id, v_coach_id, v_edge_fit_location_id, 6, '19:00', 20, true, NOW(), NOW()),
                (v_adults_kickboxing_id, v_coach_id, v_edge_fit_location_id, 1, '19:00', 20, true, NOW(), NOW()),
                (v_adults_kickboxing_id, v_coach_id, v_edge_fit_location_id, 2, '19:00', 20, true, NOW(), NOW()),
                (v_adults_kickboxing_id, v_coach_id, v_edge_fit_location_id, 3, '19:00', 20, true, NOW(), NOW()),
                (v_adults_kickboxing_id, v_coach_id, v_edge_fit_location_id, 4, '19:00', 20, true, NOW(), NOW())
            ON CONFLICT ("class_type_id", "coach_id", "location_id", "day_of_week", "start_time") DO NOTHING;
        END IF;
        
        IF v_adults_boxing_id IS NOT NULL THEN
            -- Sunday: Adults Boxing
            INSERT INTO "class_schedules" ("class_type_id", "coach_id", "location_id", "day_of_week", "start_time", "capacity", "is_active", "created_at", "updated_at")
            VALUES (v_adults_boxing_id, v_coach_id, v_edge_fit_location_id, 0, '19:00', 20, true, NOW(), NOW())
            ON CONFLICT ("class_type_id", "coach_id", "location_id", "day_of_week", "start_time") DO NOTHING;
        END IF;
        
        -- 08:00 PM schedules
        IF v_mma_pro_id IS NOT NULL THEN
            -- Saturday, Monday: MMA Pro
            INSERT INTO "class_schedules" ("class_type_id", "coach_id", "location_id", "day_of_week", "start_time", "capacity", "is_active", "created_at", "updated_at")
            VALUES 
                (v_mma_pro_id, v_coach_id, v_edge_fit_location_id, 6, '20:00', 20, true, NOW(), NOW()),
                (v_mma_pro_id, v_coach_id, v_edge_fit_location_id, 1, '20:00', 20, true, NOW(), NOW())
            ON CONFLICT ("class_type_id", "coach_id", "location_id", "day_of_week", "start_time") DO NOTHING;
        END IF;
        
        IF v_boxing_id IS NOT NULL THEN
            -- Sunday, Wednesday: Boxing
            INSERT INTO "class_schedules" ("class_type_id", "coach_id", "location_id", "day_of_week", "start_time", "capacity", "is_active", "created_at", "updated_at")
            VALUES 
                (v_boxing_id, v_coach_id, v_edge_fit_location_id, 0, '20:00', 20, true, NOW(), NOW()),
                (v_boxing_id, v_coach_id, v_edge_fit_location_id, 3, '20:00', 20, true, NOW(), NOW())
            ON CONFLICT ("class_type_id", "coach_id", "location_id", "day_of_week", "start_time") DO NOTHING;
        END IF;
    END IF;
    
    -- Step 4: Insert schedules for GOFIT Arena – Hadayek El-Ahram
    -- Saturday to Thursday
    IF v_gofit_location_id IS NOT NULL AND v_coach_id IS NOT NULL THEN
        -- 07:00 PM - Saturday, Monday, Wednesday: Kids & Juniors Kickboxing
        IF v_kids_juniors_kickboxing_id IS NOT NULL THEN
            INSERT INTO "class_schedules" ("class_type_id", "coach_id", "location_id", "day_of_week", "start_time", "capacity", "is_active", "created_at", "updated_at")
            VALUES 
                (v_kids_juniors_kickboxing_id, v_coach_id, v_gofit_location_id, 6, '19:00', 15, true, NOW(), NOW()),
                (v_kids_juniors_kickboxing_id, v_coach_id, v_gofit_location_id, 1, '19:00', 15, true, NOW(), NOW()),
                (v_kids_juniors_kickboxing_id, v_coach_id, v_gofit_location_id, 3, '19:00', 15, true, NOW(), NOW())
            ON CONFLICT ("class_type_id", "coach_id", "location_id", "day_of_week", "start_time") DO NOTHING;
        END IF;
        
        -- 08:30 PM - Saturday, Monday, Wednesday: Teens & Adults Kickboxing
        IF v_teens_adults_kickboxing_id IS NOT NULL THEN
            INSERT INTO "class_schedules" ("class_type_id", "coach_id", "location_id", "day_of_week", "start_time", "capacity", "is_active", "created_at", "updated_at")
            VALUES 
                (v_teens_adults_kickboxing_id, v_coach_id, v_gofit_location_id, 6, '20:30', 15, true, NOW(), NOW()),
                (v_teens_adults_kickboxing_id, v_coach_id, v_gofit_location_id, 1, '20:30', 15, true, NOW(), NOW()),
                (v_teens_adults_kickboxing_id, v_coach_id, v_gofit_location_id, 3, '20:30', 15, true, NOW(), NOW())
            ON CONFLICT ("class_type_id", "coach_id", "location_id", "day_of_week", "start_time") DO NOTHING;
        END IF;
    END IF;
    
    -- Step 5: Insert schedules for CORE
    -- Saturday to Thursday
    IF v_core_location_id IS NOT NULL AND v_coach_id IS NOT NULL THEN
        -- 08:30 PM - Sunday, Tuesday: Rumble Kickboxing
        IF v_rumble_kickboxing_id IS NOT NULL THEN
            INSERT INTO "class_schedules" ("class_type_id", "coach_id", "location_id", "day_of_week", "start_time", "capacity", "is_active", "created_at", "updated_at")
            VALUES 
                (v_rumble_kickboxing_id, v_coach_id, v_core_location_id, 0, '20:30', 25, true, NOW(), NOW()),
                (v_rumble_kickboxing_id, v_coach_id, v_core_location_id, 2, '20:30', 25, true, NOW(), NOW())
            ON CONFLICT ("class_type_id", "coach_id", "location_id", "day_of_week", "start_time") DO NOTHING;
        END IF;
    END IF;
END $$;
