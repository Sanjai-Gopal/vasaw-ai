import { DeploymentProvider, DeployRequest, DeploymentResult } from "../types";
import { validateBuildResult, validateProjectDirectory, collectAndScanProjectFiles } from "../validator";
import { sanitizeDeployName } from "./base";

export class MockDeploymentProvider implements DeploymentProvider {
  readonly id = "mock" as const;

  async deploy(request: DeployRequest): Promise<DeploymentResult> {
    const createdAt = new Date().toISOString();
    const websiteId = request.websiteId || request.buildResult?.websiteId || "mock-website";
    const leadId = request.leadId || request.buildResult?.leadId;
    const businessName = request.businessName || request.buildResult?.businessName || "Business Site";

    const deployName = sanitizeDeployName(businessName, websiteId);
    const deploymentId = `mock-dep-${deployName}-${Date.now().toString(36)}`;

    // 1. Validate build result if provided
    if (request.buildResult) {
      const buildValidation = validateBuildResult(request.buildResult);
      if (!buildValidation.valid) {
        return {
          success: false,
          deploymentId,
          websiteId,
          leadId,
          businessName,
          provider: "mock",
          status: "FAILED",
          environment: request.environment || "production",
          createdAt,
          completedAt: new Date().toISOString(),
          error: buildValidation.errors.join("; "),
        };
      }
    }

    // 2. Resolve and validate project directory
    const projectDir = request.projectDir || request.buildResult?.artifact?.projectDir;
    if (!projectDir) {
      return {
        success: false,
        deploymentId,
        websiteId,
        leadId,
        businessName,
        provider: "mock",
        status: "FAILED",
        environment: request.environment || "production",
        createdAt,
        completedAt: new Date().toISOString(),
        error: "Missing project directory for deployment",
      };
    }

    const dirValidation = validateProjectDirectory(projectDir);
    if (!dirValidation.valid) {
      return {
        success: false,
        deploymentId,
        websiteId,
        leadId,
        businessName,
        provider: "mock",
        status: "FAILED",
        environment: request.environment || "production",
        createdAt,
        completedAt: new Date().toISOString(),
        error: dirValidation.errors.join("; "),
      };
    }

    // 3. Scan and collect files (checking for secret leakage)
    const scanResult = collectAndScanProjectFiles(projectDir);
    if (!scanResult.valid) {
      return {
        success: false,
        deploymentId,
        websiteId,
        leadId,
        businessName,
        provider: "mock",
        status: "FAILED",
        environment: request.environment || "production",
        createdAt,
        completedAt: new Date().toISOString(),
        error: scanResult.errors.join("; "),
      };
    }

    // 4. Return deterministic mock deployment result clearly marked as mock
    const mockUrl = `https://mock-${deployName}.vasaw.app`;

    return {
      success: true,
      deploymentId,
      websiteId,
      leadId,
      businessName,
      provider: "mock",
      status: "READY",
      url: mockUrl,
      environment: request.environment || "production",
      createdAt,
      completedAt: new Date().toISOString(),
      error: null,
      metadata: {
        mode: "mock",
        filesDeployed: scanResult.files.length,
        deployName,
      },
    };
  }

  async getStatus(deploymentId: string): Promise<DeploymentResult> {
    return {
      success: true,
      deploymentId,
      websiteId: "mock-website",
      provider: "mock",
      status: "READY",
      url: `https://mock-${deploymentId}.vasaw.app`,
      environment: "production",
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      error: null,
    };
  }

  async delete(deploymentId?: string): Promise<boolean> {
    void deploymentId;
    return true;
  }
}
