import { createClient } from "@supabase/supabase-js";

// =========================================================================
//              SUPABASE CLIENT CONFIGURATION
// =========================================================================
// Replace these placeholder values with your own Supabase project credentials.
// You can retrieve these from your Supabase Dashboard under Settings > API.
// =========================================================================

// Paste your Supabase API URL here:
const SUPABASE_URL = "https://wabhgsdzmptgxrggjjgm.supabase.co";

// Paste your Supabase Public Anon Key here:
const SUPABASE_PUBLIC_KEY = "sb_publishable_gI4ZjOm-5A5_DVQylKcuWA_QLcDyT0d";

// Export the initialized client to be used throughout your React application
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
