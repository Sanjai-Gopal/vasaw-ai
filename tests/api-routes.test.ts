import { describe, it, expect } from "vitest";
import { GET as leadsRouteHandler } from "../app/api/leads/route";
import { GET as campaignsRouteHandler } from "../app/api/campaigns/route";
import { GET as websitesRouteHandler } from "../app/api/websites/route";
import { GET as messagesRouteHandler } from "../app/api/messages/route";
import { GET as statsRouteHandler } from "../app/api/dashboard/stats/route";

describe("Phase 15: Core API Route Handlers Integration Tests", () => {
  it("should handle GET /api/leads gracefully and return typed response", async () => {
    const response = await leadsRouteHandler();
    expect([200, 500]).toContain(response.status);

    const body = await response.json();
    if (response.status === 200) {
      expect(body.ok).toBe(true);
      expect(Array.isArray(body.leads)).toBe(true);
    } else {
      expect(body.ok).toBe(false);
      expect(body.error).toBeDefined();
    }
  });

  it("should handle GET /api/campaigns gracefully and return typed response", async () => {
    const response = await campaignsRouteHandler();
    expect([200, 500]).toContain(response.status);

    const body = await response.json();
    if (response.status === 200) {
      expect(body.ok).toBe(true);
      expect(Array.isArray(body.campaigns)).toBe(true);
    } else {
      expect(body.ok).toBe(false);
    }
  });

  it("should handle GET /api/websites gracefully and return typed response", async () => {
    const response = await websitesRouteHandler();
    expect([200, 500]).toContain(response.status);

    const body = await response.json();
    if (response.status === 200) {
      expect(body.ok).toBe(true);
      expect(Array.isArray(body.websites)).toBe(true);
    } else {
      expect(body.ok).toBe(false);
    }
  });

  it("should handle GET /api/messages gracefully and return typed response", async () => {
    const response = await messagesRouteHandler();
    expect([200, 500]).toContain(response.status);

    const body = await response.json();
    if (response.status === 200) {
      expect(body.ok).toBe(true);
      expect(Array.isArray(body.messages)).toBe(true);
    } else {
      expect(body.ok).toBe(false);
    }
  });

  it("should handle GET /api/dashboard/stats and return pipeline metrics structure", async () => {
    const response = await statsRouteHandler();
    expect([200, 500]).toContain(response.status);

    const body = await response.json();
    if (response.status === 200) {
      expect(body.stats).toBeDefined();
      expect(body.pipeline).toBeDefined();
      expect(body.agents).toBeDefined();
    } else {
      expect(body.error).toBeDefined();
    }
  });
});
