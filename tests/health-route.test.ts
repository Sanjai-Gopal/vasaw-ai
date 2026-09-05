import { describe, it, expect } from "vitest";
import { GET as healthRouteHandler } from "../app/api/health/route";
import { GET as aiHealthRouteHandler } from "../app/api/ai/health/route";

describe("Unified Health & Readiness API Routes", () => {
  it("should return 200 and healthy system telemetry from /api/health", async () => {
    const response = await healthRouteHandler();
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.status).toBe("healthy");
    expect(body.timestamp).toBeDefined();
    expect(body.uptimeSeconds).toBeGreaterThanOrEqual(0);
    expect(body.environment).toBeDefined();
    expect(body.environment.integrationMode).toBeDefined();
    expect(body.environment.outreachMode).toBeDefined();
    expect(body.services).toBeDefined();
    expect(Array.isArray(body.agents)).toBe(true);
    expect(body.agents.length).toBe(6);
  });

  it("should return 200 and provider status from /api/ai/health", async () => {
    const response = await aiHealthRouteHandler();
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.providers).toBeDefined();
  });
});
