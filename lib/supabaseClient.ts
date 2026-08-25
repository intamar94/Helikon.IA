import { createClient } from "@supabase/supabase-js";

// Helikon.IA uses the shared Supabase project without touching the tables
// belonging to the other applications hosted in that project.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ssadrlauhtazkretwgxf.supabase.co";
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_a9YdR7Lq_NOuJlanOrAUwA_pD_goUBJ";

export const supabaseConfigured = Boolean(url && anonKey);

export const supabase = supabaseConfigured
  ? createClient(url as string, anonKey as string)
  : null;
