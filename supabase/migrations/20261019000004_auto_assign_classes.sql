
-- 🏫 Migration: Auto-Assign Classes based on Age
-- Migration ID: 20261019000004_auto_assign_classes.sql

-- 1. Add min_age and max_age to classes table
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS min_age INTEGER;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS max_age INTEGER;

-- 2. Populate min_age and max_age from existing age_range if possible
-- Typical format: '6-10' or '0-5'
UPDATE public.classes 
SET 
  min_age = CAST(split_part(age_range, '-', 1) AS INTEGER),
  max_age = CAST(split_part(age_range, '-', 2) AS INTEGER)
WHERE age_range ~ '^[0-9]+-[0-9]+$';

-- 3. Create a function to find the best class for a child based on age
CREATE OR REPLACE FUNCTION public.get_class_for_age(p_age INTEGER)
RETURNS UUID
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_class_id UUID;
BEGIN
  SELECT id INTO v_class_id
  FROM public.classes
  WHERE (min_age IS NULL OR p_age >= min_age)
    AND (max_age IS NULL OR p_age <= max_age)
  ORDER BY (max_age - min_age) ASC -- Pick the most specific range
  LIMIT 1;
  
  RETURN v_class_id;
END;
$$;

-- 4. Create a trigger function to auto-assign class_id on child signup/update
CREATE OR REPLACE FUNCTION public.auto_assign_child_class()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only auto-assign if age is provided and class_id is currently null
  IF NEW.age IS NOT NULL AND NEW.class_id IS NULL THEN
    NEW.class_id := public.get_class_for_age(NEW.age);
  END IF;
  
  -- If age changed, but class_id was not manually set in this update, re-evaluate
  -- (Optional: uncomment if you want class to always stay in sync with age)
  -- IF TG_OP = 'UPDATE' AND NEW.age != OLD.age AND NEW.class_id = OLD.class_id THEN
  --   NEW.class_id := public.get_class_for_age(NEW.age);
  -- END IF;
  
  RETURN NEW;
END;
$$;

-- 5. Attach the trigger to the children table
DROP TRIGGER IF EXISTS trigger_auto_assign_child_class ON public.children;
CREATE TRIGGER trigger_auto_assign_child_class
BEFORE INSERT OR UPDATE OF age, class_id ON public.children
FOR EACH ROW
EXECUTE FUNCTION public.auto_assign_child_class();

-- 6. Retroactively assign classes to existing children without one
UPDATE public.children
SET class_id = public.get_class_for_age(age)
WHERE class_id IS NULL AND age IS NOT NULL;
