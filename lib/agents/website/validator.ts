import * as fs from "fs";
import * as path from "path";
import { spawnSync } from "child_process";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  stdout?: string;
  stderr?: string;
}

export function validateWebsiteStatic(projectDir: string): ValidationResult {
  const errors: string[] = [];

  if (!fs.existsSync(/*turbopackIgnore: true*/ projectDir)) {
    return {
      valid: false,
      errors: [`Project directory does not exist: ${projectDir}`],
    };
  }

  const stat = fs.statSync(/*turbopackIgnore: true*/ projectDir);
  if (!stat.isDirectory()) {
    return {
      valid: false,
      errors: [`Project path is not a directory: ${projectDir}`],
    };
  }

  const requiredFiles = [
    "package.json",
    "tsconfig.json",
    "next.config.js",
    "postcss.config.js",
    "src/app/layout.tsx",
    "src/app/page.tsx",
    "src/app/globals.css",
    "README.md",
  ];

  for (const relPath of requiredFiles) {
    const fullPath = path.join(/*turbopackIgnore: true*/ projectDir, relPath);
    if (!fs.existsSync(/*turbopackIgnore: true*/ fullPath)) {
      errors.push(`Missing required project file: ${relPath}`);
      continue;
    }

    const fileStat = fs.statSync(/*turbopackIgnore: true*/ fullPath);
    if (fileStat.size === 0) {
      errors.push(`File is empty: ${relPath}`);
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Validate package.json
  try {
    const pkgContent = fs.readFileSync(/*turbopackIgnore: true*/ path.join(/*turbopackIgnore: true*/ projectDir, "package.json"), "utf8");
    const pkg = JSON.parse(pkgContent);
    if (!pkg.name || typeof pkg.name !== "string") {
      errors.push("package.json must contain a valid 'name' field");
    }
    if (!pkg.scripts?.build) {
      errors.push("package.json must contain a 'build' script");
    }
    // Security: Check for command injection in scripts
    const buildScript = String(pkg.scripts?.build || "");
    if (buildScript.includes("&") || buildScript.includes("|") || buildScript.includes(";")) {
      errors.push("Unsafe characters detected in package.json build script");
    }
  } catch (err) {
    errors.push(`Invalid package.json: ${err instanceof Error ? err.message : "JSON parse error"}`);
  }

  // Validate tsconfig.json
  try {
    const tsContent = fs.readFileSync(/*turbopackIgnore: true*/ path.join(/*turbopackIgnore: true*/ projectDir, "tsconfig.json"), "utf8");
    JSON.parse(tsContent);
  } catch (err) {
    errors.push(`Invalid tsconfig.json: ${err instanceof Error ? err.message : "JSON parse error"}`);
  }

  // Validate layout.tsx
  try {
    const layoutContent = fs.readFileSync(/*turbopackIgnore: true*/ path.join(/*turbopackIgnore: true*/ projectDir, "src/app/layout.tsx"), "utf8");
    if (!layoutContent.includes("export default")) {
      errors.push("src/app/layout.tsx must contain a default export");
    }
    if (!layoutContent.includes("metadata")) {
      errors.push("src/app/layout.tsx should export metadata for SEO");
    }
  } catch (err) {
    errors.push(`Failed to read layout.tsx: ${err instanceof Error ? err.message : "read error"}`);
  }

  // Validate page.tsx
  try {
    const pageContent = fs.readFileSync(/*turbopackIgnore: true*/ path.join(/*turbopackIgnore: true*/ projectDir, "src/app/page.tsx"), "utf8");
    if (!pageContent.includes("export default")) {
      errors.push("src/app/page.tsx must contain a default export");
    }
  } catch (err) {
    errors.push(`Failed to read page.tsx: ${err instanceof Error ? err.message : "read error"}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function executeWebsiteBuild(projectDir: string): {
  success: boolean;
  errors: string[];
  stdout: string;
  stderr: string;
} {
  const nextBin = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");

  let result;
  try {
    if (fs.existsSync(nextBin)) {
      // Execute local next binary securely via node with fixed arguments
      result = spawnSync(process.execPath, [nextBin, "build"], {
        cwd: projectDir,
        env: {
          ...process.env,
          NODE_ENV: "production",
          CI: "1",
          NEXT_TELEMETRY_DISABLED: "1",
        },
        timeout: 120000,
        encoding: "utf8",
      });
    } else {
      // Fallback to npx
      result = spawnSync("npx", ["next", "build"], {
        cwd: projectDir,
        shell: process.platform === "win32",
        env: {
          ...process.env,
          NODE_ENV: "production",
          CI: "1",
          NEXT_TELEMETRY_DISABLED: "1",
        },
        timeout: 120000,
        encoding: "utf8",
      });
    }
  } catch (err) {
    return {
      success: false,
      errors: [`Execution failed: ${err instanceof Error ? err.message : "unknown execution error"}`],
      stdout: "",
      stderr: String(err),
    };
  }

  const stdout = result.stdout || "";
  const stderr = result.stderr || "";
  const exitCode = result.status;

  if (exitCode !== 0 || result.error) {
    // Extract actual error lines from stderr and stdout
    const rawError = result.error
      ? result.error.message
      : (stderr.trim() + "\n" + stdout.trim() || `Process exited with code ${exitCode}`);

    const errorLines = rawError
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith("Attention:") && !l.startsWith("https://") && !l.startsWith("⚠ Warning:"));

    const primaryError = errorLines.find((l) => l.toLowerCase().includes("error ts") || l.toLowerCase().includes("error:")) || errorLines.find((l) => l.toLowerCase().includes("error")) || errorLines[0] || "Unknown build error";

    return {
      success: false,
      errors: [`Production build failed: ${primaryError}`],
      stdout,
      stderr,
    };
  }

  return {
    success: true,
    errors: [],
    stdout,
    stderr,
  };
}

export function validateWebsiteProject(
  projectDir: string,
  options?: { skipRealBuild?: boolean }
): ValidationResult {
  // Step 1: Static validation
  const staticResult = validateWebsiteStatic(projectDir);
  if (!staticResult.valid) {
    return staticResult;
  }

  // If real build is disabled (e.g. fast dry run), return static validation
  if (options?.skipRealBuild) {
    return staticResult;
  }

  // Step 2: Real production build execution
  const buildResult = executeWebsiteBuild(projectDir);
  if (!buildResult.success) {
    return {
      valid: false,
      errors: buildResult.errors,
      stdout: buildResult.stdout,
      stderr: buildResult.stderr,
    };
  }

  return {
    valid: true,
    errors: [],
    stdout: buildResult.stdout,
    stderr: buildResult.stderr,
  };
}
