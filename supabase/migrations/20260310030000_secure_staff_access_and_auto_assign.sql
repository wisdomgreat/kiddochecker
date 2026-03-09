-- Migration: 20260310030000_secure_staff_access_and_auto_assign.sql
-- Add class assignment & strictly limit staff view

-- 1. Add class_id to children table (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'children' AND column_name = 'class_id') THEN
        ALTER TABLE public.children ADD COLUMN class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 2. Function to auto-assign a class based on age
CREATE OR REPLACE FUNCTION public.auto_assign_class_by_age()
RETURNS TRIGGER AS $$
DECLARE
    v_class_id UUID;
    v_age INTEGER;
BEGIN
    -- Only auto-assign if class is not set and age is provided
    IF NEW.class_id IS NULL AND NEW.age IS NOT NULL THEN
        -- Basic parsing of age_range (assuming format like "0-2", "3-5", etc, or exact number)
        SELECT id INTO v_class_id
        FROM public.classes
        WHERE 
            age_range IS NOT NULL AND 
            -- Check if age is inside the hyphenated range "3-5"
            (
                (age_range LIKE '%-%' AND NEW.age >= CAST(split_part(age_range, '-', 1) AS INTEGER) 
                                      AND NEW.age <= CAST(split_part(age_range, '-', 2) AS INTEGER))
                OR
                -- Check if it matches a specific number "4"
                (age_range !~ '[a-zA-Z-]' AND NEW.age = CAST(age_range AS INTEGER))
            )
        LIMIT 1;
        
        IF v_class_id IS NOT NULL THEN
            NEW.class_id := v_class_id;
        END IF;
    END IF;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Fallback: If parsing fails, just return without assigning
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on children inserts
DROP TRIGGER IF EXISTS trigger_auto_assign_class on public.children;
CREATE TRIGGER trigger_auto_assign_class
    BEFORE INSERT OR UPDATE OF age, class_id ON public.children
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_assign_class_by_age();

-- 3. Enhance Data Security (CIA) - Update Children Policies
-- Drop existing policies that might allow staff to see all children
DROP POLICY IF EXISTS "Admin can manage all children" ON public.children;
-- Note: Parent access is likely handled by a different policy. We'll leave existing parent policies.

-- New Admin policy
CREATE POLICY "Admins can view and edit all children" 
    ON public.children
    FOR ALL
    USING (public.has_role(auth.uid(), 'admin'::public.app_role))
    WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Staff/Teacher strict policy
-- They can only SELECT children assigned to classes they teach
CREATE POLICY "Staff can view children in their assigned classes" 
    ON public.children
    FOR SELECT
    USING (
        public.has_role(auth.uid(), 'staff'::public.app_role) -- or teacher/assistant, "has_role" handles this level
        AND class_id IN (
            SELECT class_id FROM public.teachers WHERE user_id = auth.uid()
        )
    );

-- 4. Secure Attendance View
-- Staff should only see attendance for classes they manage
DROP POLICY IF EXISTS "Staff and admin can view all attendance" ON public.attendance;

CREATE POLICY "Admins can view all attendance" 
    ON public.attendance
    FOR SELECT 
    USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Staff can view attendance for their assigned classes" 
    ON public.attendance
    FOR SELECT
    USING (
        public.has_role(auth.uid(), 'staff'::public.app_role)
        AND class_id IN (
            SELECT class_id FROM public.teachers WHERE user_id = auth.uid()
        )
    );
