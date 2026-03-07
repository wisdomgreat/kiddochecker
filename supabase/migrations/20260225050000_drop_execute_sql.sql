
-- Migration: Drop dangerous execute_sql function
-- Date: 2026-02-25

DROP FUNCTION IF EXISTS public.execute_sql(text);
DROP FUNCTION IF EXISTS public.check_sql_query_safety(text);
