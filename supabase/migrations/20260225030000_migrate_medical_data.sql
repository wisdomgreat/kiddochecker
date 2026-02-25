-- DATA MIGRATION: children -> child_medical_profiles
-- This script safely migrates existing medical information from the 'children' table 
-- into the new structured 'child_medical_profiles' table.

INSERT INTO public.child_medical_profiles (
    child_id, 
    allergies, 
    emergency_notes, 
    created_at, 
    updated_at
)
SELECT 
    c.id as child_id,
    CASE 
        WHEN c.allergies IS NOT NULL AND c.allergies != '' THEN 
            jsonb_build_array(
                jsonb_build_object(
                    'type', c.allergies,
                    'severity', 'moderate',
                    'reaction', 'Documented in legacy system'
                )
            )
        ELSE '[]'::jsonb
    END as allergies,
    COALESCE(c.medical_info, '') as emergency_notes,
    NOW(),
    NOW()
FROM public.children c
ON CONFLICT (child_id) DO UPDATE SET
    allergies = CASE 
        WHEN EXCLUDED.allergies != '[]'::jsonb AND (child_medical_profiles.allergies IS NULL OR child_medical_profiles.allergies = '[]'::jsonb) 
        THEN EXCLUDED.allergies 
        ELSE child_medical_profiles.allergies 
    END,
    emergency_notes = CASE 
        WHEN EXCLUDED.emergency_notes != '' AND (child_medical_profiles.emergency_notes IS NULL OR child_medical_profiles.emergency_notes = '') 
        THEN EXCLUDED.emergency_notes 
        ELSE child_medical_profiles.emergency_notes 
    END;

-- Optional: Clear the old columns after verification
-- COMMENTED OUT FOR SAFETY
-- ALTER TABLE public.children DROP COLUMN IF EXISTS allergies;
-- ALTER TABLE public.children DROP COLUMN IF EXISTS medical_info;
