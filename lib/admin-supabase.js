import { createClient } from '@supabase/supabase-js';

// Admin/user database — separate Supabase project from the image-reviews DB.
// Holds flax_user_access (emails, passwords, modules, outlet_ids) used to gate
// access to all Flax internal apps. We only READ from this DB here.
const ADMIN_URL = process.env.ADMIN_SUPABASE_URL || 'https://placeholder.supabase.co';
const ADMIN_KEY = process.env.ADMIN_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const adminSupabase = createClient(ADMIN_URL, ADMIN_KEY);
