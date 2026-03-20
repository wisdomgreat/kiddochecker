-- ➕ Add metadata to visitor_interactions
-- Description: Allows storing JSONB metadata for interactions (e.g., template names, automation results).

ALTER TABLE public.visitor_interactions 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Update the comment
COMMENT ON COLUMN public.visitor_interactions.metadata IS 'Stores context for automated interactions, such as email template names.';
