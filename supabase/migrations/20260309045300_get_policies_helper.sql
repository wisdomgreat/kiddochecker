
CREATE OR REPLACE FUNCTION public.get_table_policies_json(p_tablename text)
RETURNS json
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT json_agg(row_to_json(t)) FROM (
    SELECT policyname, roles, cmd, qual, with_check 
    FROM pg_policies 
    WHERE tablename = p_tablename
  ) t;
$$;
