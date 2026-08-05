SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'rewards' 
ORDER BY column_name;
