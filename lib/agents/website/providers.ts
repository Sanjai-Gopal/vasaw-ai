import { TemplateType, WebsiteBuildInput, WebsiteBuildResult, WebsiteProvider, createPublicBusinessProfile } from "./types";
import { getTemplate, selectTemplate } from "./templates/registry";
import { getTheme } from "./themes";
import { generateDeterministicContent } from "./content/fallback";
import { generateWebsiteContent } from "./content/generator";
import { renderWebsiteProject } from "./renderer";
import { validateWebsiteProject } from "./validator";

export class MockWebsiteProvider implements WebsiteProvider {
  async build(input: WebsiteBuildInput): Promise<WebsiteBuildResult> {
    const { lead, qualification, forceTemplate, outputBaseDir } = input;
    const templateId = (forceTemplate || selectTemplate(lead.category)) as TemplateType;
    const template = getTemplate(templateId);
    const theme = getTheme(templateId);

    // Explicit Public Data Boundary: strip internal lead/qualification metadata
    const profile = createPublicBusinessProfile(lead);

    // Deterministic content in mock mode
    const content = generateDeterministicContent(profile, qualification, template);

    // Render website project files using strictly public profile
    const renderResult = renderWebsiteProject({
      profile,
      template,
      theme,
      content,
      outputBaseDir,
    });

    // Validate generated project with real production build
    const validation = validateWebsiteProject(renderResult.projectDir);
    const websiteId = `web-${lead.id.slice(0, 8)}-${Date.now()}`;

    return {
      websiteId,
      leadId: lead.id,
      businessName: lead.businessName,
      template: templateId,
      status: validation.valid ? "READY" : "FAILED",
      buildStatus: validation.valid ? "SUCCESS" : "FAILED",
      artifact: {
        projectDir: renderResult.projectDir,
        projectName: renderResult.projectName,
        files: renderResult.files,
        pages: renderResult.pages,
        previewUrl: undefined, // Undeployed: live preview is handled by Agent 5
      },
      pages: renderResult.pages,
      buildOutput: validation.stdout || renderResult.projectDir,
      buildErrors: validation.errors,
      previewUrl: undefined, // Undeployed: live preview is handled by Agent 5
      generatedAt: new Date().toISOString(),
    };
  }
}

export class AIWebsiteProvider implements WebsiteProvider {
  async build(input: WebsiteBuildInput): Promise<WebsiteBuildResult> {
    const { lead, qualification, forceTemplate, outputBaseDir } = input;
    const templateId = (forceTemplate || selectTemplate(lead.category)) as TemplateType;
    const template = getTemplate(templateId);
    const theme = getTheme(templateId);

    // Explicit Public Data Boundary: strip internal lead/qualification metadata
    const profile = createPublicBusinessProfile(lead);

    // AI content generation with automatic fallback using strictly public profile
    const content = await generateWebsiteContent({
      profile,
      qualification,
      template,
      mode: "ai",
    });

    // Render website project files using strictly public profile
    const renderResult = renderWebsiteProject({
      profile,
      template,
      theme,
      content,
      outputBaseDir,
    });

    // Validate generated project with real production build
    const validation = validateWebsiteProject(renderResult.projectDir);
    const websiteId = `web-${lead.id.slice(0, 8)}-${Date.now()}`;

    return {
      websiteId,
      leadId: lead.id,
      businessName: lead.businessName,
      template: templateId,
      status: validation.valid ? "READY" : "FAILED",
      buildStatus: validation.valid ? "SUCCESS" : "FAILED",
      artifact: {
        projectDir: renderResult.projectDir,
        projectName: renderResult.projectName,
        files: renderResult.files,
        pages: renderResult.pages,
        previewUrl: undefined, // Undeployed: live preview is handled by Agent 5
      },
      pages: renderResult.pages,
      buildOutput: validation.stdout || renderResult.projectDir,
      buildErrors: validation.errors,
      previewUrl: undefined, // Undeployed: live preview is handled by Agent 5
      generatedAt: new Date().toISOString(),
    };
  }
}

export function getWebsiteProvider(mode: "mock" | "ai" = "mock"): WebsiteProvider {
  if (mode === "ai") {
    return new AIWebsiteProvider();
  }
  return new MockWebsiteProvider();
}
