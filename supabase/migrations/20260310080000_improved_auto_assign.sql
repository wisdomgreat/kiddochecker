-- =====================================================================
-- IMPROVED AUTO-ASSIGN CLASS BY AGE
-- =====================================================================

CREATE OR REPLACE FUNCTION public.parse_age_from_string(p_str TEXT, p_index INTEGER)
RETURNS INTEGER AS $$
DECLARE
    parts TEXT[];
    part TEXT;
    val TEXT;
BEGIN
    -- Remove non-numeric/non-range characters but keep hyphens/dashes
    part := regexp_replace(p_str, '[^0-9\-]', '', 'g');
    
    -- Split by hyphen
    parts := string_to_array(part, '-');
    
    IF array_length(parts, 1) < p_index THEN
        RETURN NULL;
    END IF;
    
    val := parts[p_index];
    IF val ~ '^[0-9]+$' THEN
        RETURN CAST(val AS INTEGER);
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.auto_assign_class_by_age()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE 
    v_class_id UUID;
    v_min INTEGER;
    v_max INTEGER;
BEGIN
    -- Only run if explicitly requested or if class_id is currently null
    IF NEW.class_id IS NULL AND NEW.age IS NOT NULL THEN
        -- Find the first class where the age fits the range
        FOR v_class_id, v_min, v_max IN 
            SELECT id, 
                   public.parse_age_from_string(age_range, 1), 
                   public.parse_age_from_string(age_range, 2)
            FROM public.classes
            WHERE age_range IS NOT NULL AND age_range != ''
        LOOP
            -- Case 1: Range like "3-5"
            IF v_min IS NOT NULL AND v_max IS NOT NULL THEN
                IF NEW.age >= v_min AND NEW.age <= v_max THEN
                    NEW.class_id := v_class_id;
                    RETURN NEW;
                END IF;
            -- Case 2: Single age like "5" or "5 years"
            ELSIF v_min IS NOT NULL THEN
                IF NEW.age = v_min THEN
                    NEW.class_id := v_class_id;
                    RETURN NEW;
                END IF;
            END IF;
        END LOOP;
    END IF;
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Fallback to original record if logic fails
    RETURN NEW;
END;
$$;

-- Re-create the trigger to ensure it's active
DROP TRIGGER IF EXISTS trigger_auto_assign_class ON public.children;
CREATE TRIGGER trigger_auto_assign_class
    BEFORE INSERT OR UPDATE OF age, class_id ON public.children
    FOR EACH ROW EXECUTE FUNCTION public.auto_assign_class_by_age();
