import type { Database } from "@/types/database";
import { createBrowserClient } from "@supabase/ssr";

// Singleton instance to avoid creating multiple clients
let supabaseInstance: ReturnType<typeof createBrowserClient<Database>> | null =
  null;

export function createClient() {
  // Return existing instance if available
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set."
    );
  }

  // Create and cache the instance
  supabaseInstance = createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey
  );
  return supabaseInstance;
}
