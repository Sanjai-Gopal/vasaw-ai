import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "./server";

export interface AuthenticatedUser {
  id: string;
  email: string | null;
  organizationId?: string;
  role?: string;
}

export interface AuthCookieUpdate {
  name: string;
  value: string;
  options: CookieOptions;
}

export interface AuthContext {
  user: AuthenticatedUser | null;
  cookies: AuthCookieUpdate[];
}

function getPublicSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase Auth is not configured on the server.");
  return { url, key };
}

/** Reads a verified Supabase user from the request session and captures refreshed cookies. */
export async function getAuthContext(request: NextRequest): Promise<AuthContext> {
  const cookies: AuthCookieUpdate[] = [];
  let user: AuthenticatedUser | null = null;

  try {
    const authorization = request.headers.get("authorization");
    if (authorization?.startsWith("Bearer ")) {
      const token = authorization.slice(7).trim();
      if (!token) return { user: null, cookies };
      const { data, error } = await getSupabaseAdmin().auth.getUser(token);
      if (error || !data.user) return { user: null, cookies };
      user = { id: data.user.id, email: data.user.email ?? null };
    } else {
      const { url, key } = getPublicSupabaseConfig();
      const supabase = createServerClient(url, key, {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (updates) => {
            cookies.push(...updates);
          },
        },
      });
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) return { user: null, cookies };
      user = { id: data.user.id, email: data.user.email ?? null };
    }

    const admin = getSupabaseAdmin();
    const { data: memberships, error: membershipError } = await admin
      .from("organization_memberships")
      .select("organization_id, role")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1);

    if (!membershipError && memberships?.[0]) {
      user.organizationId = memberships[0].organization_id;
      user.role = memberships[0].role;
    } else {
      user.role = "member";
    }
  } catch {
    return { user: null, cookies };
  }

  return { user, cookies };
}

export function applyAuthCookies<T extends NextResponse>(response: T, updates: AuthCookieUpdate[]): T {
  for (const cookie of updates) {
    response.cookies.set(cookie.name, cookie.value, cookie.options);
  }
  response.headers.set("Cache-Control", "private, no-store, max-age=0, must-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

/** Convenience wrapper retained for existing API handlers. */
export async function getAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  return (await getAuthContext(request)).user;
}

export async function requireAuth(
  request: NextRequest
): Promise<{ user: AuthenticatedUser | null; error?: string }> {
  const { user } = await getAuthContext(request);
  return user
    ? { user }
    : { user: null, error: "Unauthorized: sign in with a valid Supabase Auth session." };
}

/** Legacy display filter. Authorization code must use a scoped database query, not this helper. */
export function scopeToOrganization<T extends Record<string, unknown>>(
  item: T,
  organizationId?: string
): boolean {
  if (!organizationId) return true;
  const itemOrganizationId = item.organization_id ?? item.organizationId;
  return itemOrganizationId === organizationId;
}

/** A strict ownership check for callers that already fetched a row. */
export function scopeToUserOrOrganization<T extends Record<string, unknown>>(
  item: T,
  user: Pick<AuthenticatedUser, "id" | "organizationId">
): boolean {
  return item.owner_user_id === user.id || Boolean(user.organizationId && item.organization_id === user.organizationId);
}

export function applyAuthCookiesToJson(response: NextResponse, auth: AuthContext): NextResponse {
  return applyAuthCookies(response, auth.cookies);
}
