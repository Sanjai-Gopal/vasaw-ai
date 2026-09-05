import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "./server";

export interface AuthenticatedUser {
  id: string;
  email: string | null;
  organizationId?: string;
  role?: string;
}

/**
 * Extracts and validates the session user from a NextRequest.
 * Supports:
 * - Authorization: Bearer <token>
 * - Cookie: sb-access-token / sb-auth-token
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  const authHeader = request.headers.get("authorization");
  let token = "";

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7).trim();
  } else {
    // Cookie fallback
    const cookieHeader = request.cookies.get("sb-access-token")?.value ||
      request.cookies.get("supabase-auth-token")?.value;
    if (cookieHeader) {
      token = cookieHeader;
    }
  }

  if (!token) {
    return null;
  }

  try {
    const admin = getSupabaseAdmin();
    const { data: { user }, error } = await admin.auth.getUser(token);

    if (error || !user) {
      return null;
    }

    // Resolve user's organization membership
    const { data: membership } = await admin
      .from("organization_memberships")
      .select("organization_id, role")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    return {
      id: user.id,
      email: user.email ?? null,
      organizationId: membership?.organization_id ?? undefined,
      role: membership?.role ?? "member",
    };
  } catch {
    return null;
  }
}

/**
 * Validates that the request has an active authenticated user.
 */
export async function requireAuth(
  request: NextRequest
): Promise<{ user: AuthenticatedUser | null; error?: string }> {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return {
      user: null,
      error: "Unauthorized: Valid authentication session or API token required.",
    };
  }
  return { user };
}

/**
 * Helper to ensure a tenant query only accesses resources belonging to organizationId.
 */
export function scopeToOrganization<T extends Record<string, unknown>>(
  item: T,
  organizationId?: string
): boolean {
  if (!organizationId) return true; // Global/admin scope
  const itemOrg = (item as Record<string, unknown>).organization_id || (item as Record<string, unknown>).organizationId;
  if (!itemOrg) return true; // Unassigned legacy record
  return itemOrg === organizationId;
}
