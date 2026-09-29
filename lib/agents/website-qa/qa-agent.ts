import { QAConfig, QAReport, QAIssue, QAMetrics, QACustomCheck, QAScreenshot } from "./types";
import type { QAResult, QAAnalysis, QAAnalysisResult } from "./types";

const DEFAULT_CONFIG: QAConfig = {
  url: "https://example.com",
  viewport: "desktop",
  waitForNetworkIdle: true,
  waitTimeout: 5000,
  checkAccessibility: true,
  checkSEO: true,
  checkPerformance: true,
  customChecks: [],
};

function fetchHTML(url: string): Promise<string> {
  return fetch(url).then((res) => {
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
    return res.text();
  });
}

function extractMeta(content: string, name: string): string | null {
  const regex = new RegExp(`<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']+)["']`, "i");
  const match = content.match(regex);
  return match ? match[1] : null;
}

function extractLinkTag(content: string, rel: string): string | null {
  const regex = new RegExp(`<link[^>]*rel=["']${rel}["'][^>]*href=["']([^"']+)["']`, "i");
  const match = content.match(regex);
  return match ? match[1] : null;
}

function calculateWordCount(text: string): number {
  return text.split(/\s+/).length;
}

function analyzeAccessibility(html: string): QAIssue[] {
  const issues: QAIssue[] = [];
  if (!/<h[1-6]>/i.test(html)) {
    issues.push({
      severity: "critical",
      category: "accessibility",
      message: "Missing heading structure (h1-h6)",
    });
  }
  if (!/alt=["'][^"']*["']/i.test(html)) {
    issues.push({
      severity: "warning",
      category: "accessibility",
      message: "Images without alt text detected",
    });
  }
  if (!/<button[^>]*>/i.test(html) && !/<a[^>]*href=/i.test(html)) {
    issues.push({
      severity: "info",
      category: "accessibility",
      message: "Limitable interactive elements",
    });
  }
  return issues;
}

function analyzeSEO(html: string): QAIssue[] {
  const issues: QAIssue[] = [];
  const title = extractMeta(html, "title");
  const description = extractMeta(html, "description");

  if (!title) {
    issues.push({
      severity: "critical",
      category: "seo",
      message: "Missing <title> tag",
    });
  }
  if (!description || description.length < 50) {
    issues.push({
      severity: "warning",
      category: "seo",
      message: "Missing or too short meta description",
    });
  }
  if (!/<link[^>]*rel=["']stylesheet["']/i.test(html)) {
    issues.push({
      severity: "info",
      category: "seo",
      message: "No stylesheet linked",
    });
  }
  return issues;
}

function analyzePerformance(html: string, metrics: QAMetrics): QAIssue[] {
  const issues: QAIssue[] = [];
  if (!metrics) {
    issues.push({
      severity: "info",
      category: "performance",
      message: "No performance metrics available",
    });
    return issues;
  }
  if (metrics.loadTime && metrics.loadTime > 3000) {
    issues.push({
      severity: "warning",
      category: "performance",
      message: `Slow load time: ${metrics.loadTime}ms`,
    });
  }
  if (metrics.cumulativeLayoutShift && metrics.cumulativeLayoutShift > 0.1) {
    issues.push({
      severity: "warning",
      category: "performance",
      message: `High CLS: ${metrics.cumulativeLayoutShift}`,
    });
  }
  if (metrics.firstInputDelay && metrics.firstInputDelay > 100) {
    issues.push({
      severity: "warning",
      category: "performance",
      message: `High FID: ${metrics.firstInputDelay}ms`,
    });
  }
  return issues;
}

function runCustomChecks(
  html: string,
  checks: QACustomCheck[]
): QAIssue[] {
  const issues: QAIssue[] = [];
  for (const check of checks) {
    try {
      const selector = check.selector;
      const exists = html.includes(`id="${selector}"`) || html.includes(`class="${selector}"`);
      if (check.shouldExist !== undefined && check.shouldExist !== exists) {
        issues.push({
          severity: "warning",
          category: "custom",
          message: check.name,
          selector,
          details: check.attribute ? { attribute: check.attribute, expectedValue: check.expectedValue } : undefined,
        });
      } else if (check.shouldExist === undefined && exists) {
        const attr = check.attribute ?? "";
        const value = check.expectedValue ?? "";
        issues.push({
          severity: "info",
          category: "custom",
          message: `${check.name}: found, value="${value}"`,
          selector,
          details: attr ? { actualValue: attr } : undefined,
        });
      }
    } catch (e) {
      issues.push({
        severity: "info",
        category: "custom",
        message: `${check.name}: error during check`,
        details: e instanceof Error ? { message: e.message } : String(e),
      } as QAIssue);
    }
  }
  return issues;
}

export async function runWebsiteQA(
  url: string,
  config: Partial<QAConfig> = {}
): Promise<{ result: QAResult }> {
  const mergedConfig: QAConfig = { ...DEFAULT_CONFIG, ...config, url };
  let html: string;
  try {
    html = await fetchHTML(mergedConfig.url);
  } catch (error) {
    return {
      result: {
        success: false,
        error: error instanceof Error ? error.message : "Unknown fetch error",
        report: {
          url: mergedConfig.url,
          timestamp: new Date().toISOString(),
          viewport: mergedConfig.viewport ?? "desktop",
          passed: false,
          summary: { critical: 0, warning: 0, info: 0, total: 0 },
          issues: [],
        },
      },
    };
  }

  const issues: QAIssue[] = [];
  let metrics: QAMetrics = {};

  if (mergedConfig.checkAccessibility) {
    issues.push(...analyzeAccessibility(html));
  }
  if (mergedConfig.checkSEO) {
    issues.push(...analyzeSEO(html));
  }
  if (mergedConfig.checkPerformance || mergedConfig.customChecks?.length) {
    if (mergedConfig.customChecks?.length) {
      issues.push(...runCustomChecks(html, mergedConfig.customChecks));
    }
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) {
      metrics.loadTime = Math.floor(Math.random() * 3000) + 500;
    }
  }

  const critical = issues.filter((i) => i.severity === "critical").length;
  const warning = issues.filter((i) => i.severity === "warning").length;
  const info = issues.filter((i) => i.severity === "info").length;
  const total = issues.length;

  const passed = critical === 0;

  const report: QAReport = {
    url: mergedConfig.url,
    timestamp: new Date().toISOString(),
    viewport: mergedConfig.viewport ?? "desktop",
    passed,
    summary: { critical, warning, info, total },
    issues,
  };

  return {
    result: {
      success: true,
      report,
    },
  };
}

export function analyzeQAReport(report: QAReport): QAAnalysis {
  const { critical, warning, info, total } = report.summary;
  let result: QAAnalysisResult;
  let score: number;

  if (critical > 0) {
    result = "fail";
    score = Math.max(0, 100 - critical * 25 - warning * 10);
  } else if (warning > 3) {
    result = "warning";
    score = Math.max(0, 100 - warning * 10 - info * 2);
  } else {
    result = "pass";
    score = 100 - info * 1;
  }

  const recommendations: string[] = [];
  if (critical > 0) {
    recommendations.push(
      "Fix critical issues before proceeding with website deployment"
    );
  }
  if (warning > 0) {
    recommendations.push(
      "Address warning-level issues to improve user experience"
    );
  }
  if (report.issues.some((i) => i.category === "seo" && i.severity !== "info")) {
    recommendations.push("Optimize SEO meta tags and structure");
  }
  if (report.issues.some((i) => i.category === "accessibility")) {
    recommendations.push("Improve accessibility compliance");
  }

  return {
    result,
    score,
    summary: `Score: ${score}/100 (${critical} critical, ${warning} warning, ${info} info)`,
    recommendations,
  };
}