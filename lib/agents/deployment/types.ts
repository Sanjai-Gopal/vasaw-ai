import { WebsiteBuildResult } from "@/lib/agents/website/types";
import { SavedWebsite } from "@/lib/agents/storage/types";

export type DeploymentStatus = "PENDING" | "BUILDING" | "READY" | "FAILED" | "CANCELED";

export type DeploymentProviderType = "mock" | "vercel";

export interface DeployRequest {
  websiteId?: string;
  buildResult?: WebsiteBuildResult;
  websiteRecord?: SavedWebsite;
  projectDir?: string;
  businessName?: string;
  leadId?: string;
  mode?: "mock" | "vercel";
  forceRedeploy?: boolean;
  environment?: "production" | "preview";
}

export interface DeploymentResult {
  success: boolean;
  deploymentId: string;
  websiteId: string;
  leadId?: string;
  businessName?: string;
  provider: DeploymentProviderType;
  status: DeploymentStatus;
  url?: string;
  environment: "production" | "preview";
  createdAt: string;
  completedAt?: string;
  error?: string | null;
  metadata?: Record<string, unknown>;
}

export interface DeploymentResponse {
  success: boolean;
  agent: "deployment";
  mode: DeploymentProviderType;
  result?: DeploymentResult;
  error?: string;
}

export interface DeploymentProvider {
  id: DeploymentProviderType;
  deploy(request: DeployRequest): Promise<DeploymentResult>;
  getStatus(deploymentId: string): Promise<DeploymentResult>;
  delete(deploymentId: string): Promise<boolean>;
}

export interface ProjectFileInfo {
  path: string;
  content: string;
  size: number;
}
