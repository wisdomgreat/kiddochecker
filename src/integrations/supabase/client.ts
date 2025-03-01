
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://pxqztqcukuilqdermblq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4cXp0cWN1a3VpbHFkZXJtYmxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4MzYwODgsImV4cCI6MjA1NjQxMjA4OH0.2mZ8Dn2DX5SAQw2dHwPdHy6bQK5OhNTVI-1HVvXXlOs";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
