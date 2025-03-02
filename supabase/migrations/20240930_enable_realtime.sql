
-- Enable replica identity on tables to ensure we get the full row data on updates
ALTER TABLE attendance REPLICA IDENTITY FULL;
ALTER TABLE classes REPLICA IDENTITY FULL;
ALTER TABLE teachers REPLICA IDENTITY FULL;
ALTER TABLE children REPLICA IDENTITY FULL;

-- Add tables to the realtime publication
BEGIN;
  -- Drop the publication if it exists
  DROP PUBLICATION IF EXISTS supabase_realtime;
  
  -- Create the publication with the tables we want to track
  CREATE PUBLICATION supabase_realtime FOR TABLE 
    attendance, 
    classes, 
    teachers, 
    children;
COMMIT;
