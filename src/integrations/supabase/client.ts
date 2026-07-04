import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Hardcoded to smartcart-v2 project — prevents Lovable from overriding with old paused project
const SUPABASE_URL = "https://vimjbaxojgjsuriepyjp.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpbWpiYXhvamdqc3VyaWVweWpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2MzU2MjcsImV4cCI6MjA5ODIxMTYyN30.AiXnGG3_mA6czpwCPDijcI8H2HO7XevGLh0CIFsEs-w";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);