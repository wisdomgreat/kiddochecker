
CREATE OR REPLACE FUNCTION public.get_table_schema(p_tablename text)
RETURNS json
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT json_agg(row_to_json(t)) FROM (
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = p_tablename
  ) t;
$$;
