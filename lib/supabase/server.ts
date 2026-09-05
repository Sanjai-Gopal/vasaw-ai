import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let serverClient: SupabaseClient | null = null;
let adminClient: SupabaseClient | null = null;

function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  if (!url) {
    throw new Error("[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL");
  }
  return url;
}

function getServerClient(): SupabaseClient {
  if (serverClient) return serverClient;

  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;

  if (!supabaseAnonKey) {
    throw new Error(
      "[Supabase] Missing NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY"
    );
  }

  serverClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });
  return serverClient;
}

function getAdminClient(): SupabaseClient {
  if (adminClient) return adminClient;

  const supabaseUrl = getSupabaseUrl();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      "[Supabase] Missing SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
  return adminClient;
}

export function getSupabaseClient(): SupabaseClient {
  return getServerClient();
}

export function getSupabaseAdmin(): SupabaseClient {
  return getAdminClient();
}

export { getSupabaseClient as default };