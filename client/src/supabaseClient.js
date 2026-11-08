import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nouvfczsahmvfowcdqda.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vdXZmY3pzYWhtdmZvd2NkcWRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMjIxMjQsImV4cCI6MjA5Nzc5ODEyNH0.Bp-rvbGfO9EKwqZsRSsZ0dlJ_1FTBt0dXBL04kMUs-g';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

