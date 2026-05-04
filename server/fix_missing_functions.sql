CREATE OR REPLACE FUNCTION public.get_parent_children_with_classes(parent_user_id uuid)
 RETURNS TABLE(child_id uuid, first_name text, last_name text, age integer, allergies text, current_class_name text, current_class_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as child_id,
    c.first_name,
    c.last_name,
    c.age,
    c.allergies,
    cl.name as current_class_name,
    cl.id as current_class_id
  FROM public.children c
  LEFT JOIN public.attendance a ON c.id = a.child_id 
    AND a.attendance_date = CURRENT_DATE 
    AND a.checked_out_at IS NULL
  LEFT JOIN public.classes cl ON a.class_id = cl.id
  WHERE c.parent_id = parent_user_id
  ORDER BY c.first_name, c.last_name;
END;
$function$;
