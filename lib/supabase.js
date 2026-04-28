import { createClient } from '@supabase/supabase-js';

// Fallbacks let `next build` static-analyse modules without env vars present.
// At runtime, real env vars are read by createClient and override these.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
