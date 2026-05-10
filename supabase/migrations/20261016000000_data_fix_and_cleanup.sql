
-- 🩹 Data Fix: Correct Medical Records and Disable Features
-- Migration: 20261016000000_data_fix_and_cleanup.sql
-- Description: Corrects Daramola's medical data and ensures Center Finder is disabled.

-- 1. Correct Daramola's Medical Data
-- Fixes typo 'Penut' and moves 'Heart Palpitation' to medical_info
UPDATE public.children
SET 
    allergies = REPLACE(REPLACE(allergies, 'Penut', 'Peanut'), 'Heart Palpitation', ''),
    medical_info = COALESCE(medical_info, '') || 
                  CASE 
                    WHEN (medical_info IS NOT NULL AND medical_info <> '') AND (allergies LIKE '%Heart Palpitation%') THEN ', ' 
                    ELSE '' 
                  END || 
                  CASE 
                    WHEN allergies LIKE '%Heart Palpitation%' THEN 'Heart Palpitation' 
                    ELSE '' 
                  END
WHERE first_name = 'Daramola' AND last_name = 'Balogun';

-- Cleanup potential trailing/leading commas in allergies
UPDATE public.children
SET allergies = TRIM(BOTH ', ' FROM REPLACE(allergies, ' ,', ','))
WHERE first_name = 'Daramola' AND last_name = 'Balogun';

-- 2. Force Disable Center Finder
-- Ensure the feature is disabled globally
UPDATE public.organization_settings SET show_center_finder = FALSE;
ALTER TABLE public.organization_settings ALTER COLUMN show_center_finder SET DEFAULT FALSE;
