/* config.js — the ONE place that decides where the data lives.
 *
 * Practice mode (default): backend "local" — the tree lives in this
 * browser only, seeded with the family's starting tree.
 *
 * Go-live: create the free Supabase project (see README.md), run
 * supabase/schema.sql, then set:
 *   window.FC_CONFIG = {
 *     backend: "supabase",
 *     supabaseUrl: "https://YOUR-PROJECT.supabase.co",
 *     supabaseAnonKey: "YOUR-ANON-KEY"
 *   };
 * Nothing else changes — the whole app talks through the adapter seam.
 */
window.FC_CONFIG = {
  backend: "supabase",
  supabaseUrl: "https://pylobfhkefukhngrccxv.supabase.co",
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5bG9iZmhrZWZ1a2huZ3JjY3h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ2ODU0NjMsImV4cCI6MjExMDI2MTQ2M30.R9qxOHYTgBl21kiBEiRPpdsPLYTXL2IPQw5gAHu12zk"
};
