import * as fs from "fs";
import * as path from "path";
import { WebsiteBuildResult } from "@/lib/agents/website/types";
import { ProjectFileInfo } from "./types";

const SECRET_PATTERNS: Array<{ name: string; regex: RegExp }> = [
  { name: "OpenAI API Key", regex: /sk-[a-zA-Z0-9_\-]{20,}/ },
  { name: "Vercel Token", regex: /vcp_[a-zA-Z0-9_\-]{20,}/ },
  { name: "GitHub Token", regex: /(?:ghp_|github_pat_)[a-zA-Z0-9_\-]{20,}/ },
  { name: "Supabase Service Key", regex: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_\-]{20,}\.[a-zA-Z0-9_\-]+/ },
  { name: "Generic Private Key", regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/ },
  { name: "AWS Secret Access Key", regex: /(?:aws_secret_access_key|AWS_SECRET_ACCESS_KEY)\s*=\s*['"]?[a-zA-Z0-9/+=]{40}['"]?/ },
  { name: "Bearer Token", regex: /bearer\s+[a-zA-Z0-9._\-]{25,}/i },
];

const EXCLUDED_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  ".vercel",
  "out",
  ".turbo",
  "dist",
  "build",
]);

const EXCLUDED_FILES = new Set([
  ".env",
  ".env.local",
  ".env.production",
  ".env.development",
  ".DS_Store",
  "npm-debug.log",
  "yarn-debug.log",
  "yarn-error.log",
  "tsconfig.tsbuildinfo",
]);

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  files: ProjectFileInfo[];
}

export function validateBuildResult(buildResult?: WebsiteBuildResult): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!buildResult) {
    errors.push("Missing website build result");
    return { valid: false, errors };
  }

  if (buildResult.status !== "READY") {
    errors.push(`Website is not READY for deployment (current status: ${buildResult.status})`);
  }

  if (buildResult.buildStatus !== "SUCCESS") {
    errors.push(`Website build did not succeed (current buildStatus: ${buildResult.buildStatus})`);
  }

  if (!buildResult.artifact?.projectDir) {
    errors.push("Website build result does not contain an artifact project directory");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateProjectDirectory(projectDir: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!projectDir || typeof projectDir !== "string" || projectDir.trim() === "") {
    errors.push("Project directory must be a valid non-empty string");
    return { valid: false, errors };
  }

  const resolved = path.resolve(/*turbopackIgnore: true*/ projectDir);

  // Path traversal safety check
  if (resolved.includes("..") && !fs.existsSync(/*turbopackIgnore: true*/ resolved)) {
    errors.push("Invalid project directory path");
    return { valid: false, errors };
  }

  if (!fs.existsSync(/*turbopackIgnore: true*/ resolved)) {
    errors.push(`Project directory does not exist on disk: ${projectDir}`);
    return { valid: false, errors };
  }

  const stat = fs.statSync(/*turbopackIgnore: true*/ resolved);
  if (!stat.isDirectory()) {
    errors.push(`Project path is not a directory: ${projectDir}`);
    return { valid: false, errors };
  }

  // Required: package.json
  const packageJsonPath = path.join(/*turbopackIgnore: true*/ resolved, "package.json");
  if (!fs.existsSync(/*turbopackIgnore: true*/ packageJsonPath)) {
    errors.push("Required project file missing from artifact: package.json");
  }

  // Required: at least one main page entrypoint
  const candidatePages = [
    "src/app/page.tsx",
    "src/app/page.jsx",
    "src/app/page.js",
    "app/page.tsx",
    "app/page.jsx",
    "pages/index.tsx",
    "pages/index.jsx",
    "index.html",
  ];
  const hasPage = candidatePages.some((candidate) =>
    fs.existsSync(/*turbopackIgnore: true*/ path.join(resolved, candidate))
  );

  if (!hasPage) {
    errors.push("Required project entry point missing (e.g. src/app/page.tsx or index.html)");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function collectAndScanProjectFiles(projectDir: string): ValidationResult {
  const errors: string[] = [];
  const files: ProjectFileInfo[] = [];

  const dirValidation = validateProjectDirectory(projectDir);
  if (!dirValidation.valid) {
    return { valid: false, errors: dirValidation.errors, files: [] };
  }

  const resolvedBase = path.resolve(/*turbopackIgnore: true*/ projectDir);

  function walk(currentDir: string): void {
    const entries = fs.readdirSync(/*turbopackIgnore: true*/ currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const entryName = entry.name;
      const fullPath = path.join(/*turbopackIgnore: true*/ currentDir, entryName);

      if (entry.isDirectory()) {
        if (EXCLUDED_DIRS.has(entryName) || entryName.startsWith(".")) {
          continue;
        }
        walk(fullPath);
      } else if (entry.isFile()) {
        if (EXCLUDED_FILES.has(entryName) || entryName.startsWith(".env")) {
          continue;
        }

        const relativePath = path.relative(resolvedBase, fullPath).replace(/\\/g, "/");
        let content: string;
        let size = 0;

        try {
          const stat = fs.statSync(/*turbopackIgnore: true*/ fullPath);
          size = stat.size;

          // Limit file size to 10MB per file for safety
          if (size > 10 * 1024 * 1024) {
            errors.push(`File exceeds size limit (10MB): ${relativePath}`);
            continue;
          }

          content = fs.readFileSync(/*turbopackIgnore: true*/ fullPath, "utf8");
        } catch {
          // If binary or unreadable as utf-8, read empty
          content = "";
        }

        // Scan text files for exposed secrets
        for (const pattern of SECRET_PATTERNS) {
          if (pattern.regex.test(content)) {
            errors.push(`Potential secret (${pattern.name}) detected in file: ${relativePath}`);
          }
        }

        files.push({
          path: relativePath,
          content,
          size,
        });
      }
    }
  }

  try {
    walk(resolvedBase);
  } catch (err) {
    errors.push(`Failed to read project files: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (files.length === 0 && errors.length === 0) {
    errors.push("No deployable files found in project directory");
  }

  return {
    valid: errors.length === 0,
    errors,
    files,
  };
}
