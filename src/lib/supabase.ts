import type { SupabaseClient } from '@supabase/supabase-js';

// These two values are PUBLIC by design (the "anon" key is only a doorway; the database
// rules in supabase/schema.sql are what protect the data). NEVER put the service_role key here.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey);

let clientPromise: Promise<SupabaseClient> | null = null;

/**
 * The Supabase library is loaded on demand (dynamic import) so it never delays the
 * first paint of the cinematic hero. Returns null when the env vars are missing.
 */
export function getSupabase(): Promise<SupabaseClient> | null {
  if (!isSupabaseConfigured) return null;
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(url!, anonKey!, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      })
    );
  }
  return clientPromise;
}

/** Only allow http(s) links (blocks javascript: and other schemes). */
export function safeUrl(value: string | undefined | null): string | null {
  if (!value) return null;
  try {
    const u = new URL(value.trim());
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : null;
  } catch {
    return null;
  }
}
