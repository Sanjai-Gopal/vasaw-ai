import { describe, it, expect } from "vitest";
import { scopeToOrganization } from "@/lib/supabase/auth";

describe("Multi-Tenancy & Authorization Boundaries", () => {
  describe("scopeToOrganization", () => {
    it("should allow access when no organization filter is applied", () => {
      const item = { id: "1", organizationId: "org-123" };
      expect(scopeToOrganization(item, undefined)).toBe(true);
    });

    it("should match records belonging to the user's organization", () => {
      const item = { id: "1", organizationId: "org-123" };
      expect(scopeToOrganization(item, "org-123")).toBe(true);
    });

    it("should block records belonging to a different organization", () => {
      const item = { id: "1", organizationId: "org-456" };
      expect(scopeToOrganization(item, "org-123")).toBe(false);
    });

    it("should support snake_case organization_id", () => {
      const item = { id: "1", organization_id: "org-123" };
      expect(scopeToOrganization(item, "org-123")).toBe(true);
      expect(scopeToOrganization(item, "org-999")).toBe(false);
    });
  });
});
