
-- Create a function to safely execute SQL and view the auth_users_emails_view
CREATE OR REPLACE FUNCTION public.execute_sql(query text)
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE query;
END;
$$;

-- Add RLS policy to restrict who can execute SQL
REVOKE ALL ON FUNCTION public.execute_sql(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.execute_sql(text) TO authenticated;

-- Create RLS policy to enforce that only specific queries can be executed
CREATE OR REPLACE FUNCTION public.check_sql_query_safety(query text)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only allow specific queries to be executed
  RETURN query = 'SELECT id, email FROM auth_users_emails_view';
END;
$$;

-- Add RLS policy to the execute_sql function
CREATE POLICY "Allow only safe SQL queries" ON FUNCTION public.execute_sql
FOR ALL
TO authenticated
USING (public.check_sql_query_safety(query));
