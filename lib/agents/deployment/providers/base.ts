import { DeploymentProvider, DeploymentProviderType } from "../types";
import { MockDeploymentProvider } from "./mock";
import { VercelDeploymentProvider } from "./vercel";

export function getDeploymentProvider(mode: DeploymentProviderType = "mock"): DeploymentProvider {
  if (mode === "vercel") {
    return new VercelDeploymentProvider();
  }
  return new MockDeploymentProvider();
}

export function sanitizeDeployName(name: string, id: string): string {
  const safeName = (name || "site")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);

  const safeId = (id || "dep")
    .replace(/[^a-z0-9]/gi, "")
    .slice(0, 8)
    .toLowerCase();

  return `${safeName || "site"}-${safeId || "dep"}`;
}
