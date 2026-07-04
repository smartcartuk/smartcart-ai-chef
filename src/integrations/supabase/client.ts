import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://vimjbaxojgjsuriepyjp.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpbWpiYXhvamdqc3VyaWVweWpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2MzU2MjcsImV4cCI6MjA5ODIxMTYyN30.AiXnGG3_mA6czpwCPDijcI8H2HO7XevGLh0CIFsEs-w";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);