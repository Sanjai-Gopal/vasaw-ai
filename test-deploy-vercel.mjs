import { createProject, createDeployment, waitForDeployment, deployFromFiles } from './lib/services/vercel-service.js';
import * as fs from 'fs';
import * as path from 'path';

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;

if (!VERCEL_TOKEN) {
  console.error('VERCEL_TOKEN not set');
  process.exit(1);
}

const outputDir = 'C:\\tmp\\vasaw-websites\\nagerkovil-arya-bhavan-7e7a7d98';
const projectName = 'nagerkovil-arya-bhavan-7e7a7d98';

async function main() {
  try {
    console.log('Creating Vercel project...');
    
    // Create project (without GitHub integration)
    const project = await createProject(VERCEL_TOKEN, {
      name: projectName,
      framework: 'nextjs',
    });
    
    console.log('Project created:', project.id, project.name);
    
    // Collect files for deployment
    const files = collectFilesForDeploy(outputDir);
    console.log(`Collected ${files.length} files for deployment`);
    
    // Deploy files directly
    console.log('Deploying to Vercel...');
    const deployment = await deployFromFiles(VERCEL_TOKEN, project.id, files, {
      teamId: VERCEL_TEAM_ID,
      target: 'production',
    });
    
    console.log('Deployment created:', deployment.id);
    console.log('Deployment URL:', deployment.url);
    
    // Wait for deployment
    console.log('Waiting for deployment to complete...');
    const completedDeployment = await waitForDeployment(VERCEL_TOKEN, deployment.id, {
      teamId: VERCEL_TEAM_ID,
      maxWaitMs: 300000,
    });
    
    console.log('Deployment completed:', completedDeployment.readyState);
    console.log('Live URL: https://' + completedDeployment.url);
    
    if (completedDeployment.readyState !== 'READY') {
      throw new Error(`Deployment failed: ${completedDeployment.readyState}`);
    }
    
    // Verify deployment
    const liveUrl = 'https://' + completedDeployment.url;
    console.log('Verifying deployment...');
    const response = await fetch(liveUrl);
    console.log('HTTP Status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const html = await response.text();
    if (!html.includes('Nagerkovil Arya Bhavan')) {
      throw new Error('Business name not found in HTML');
    }
    
    console.log('✓ Deployment verified successfully!');
    console.log('Live URL:', liveUrl);
    
  } catch (error) {
    console.error('Deployment failed:', error.message);
    process.exit(1);
  }
}

function collectFilesForDeploy(outputDir) {
  const files = [];
  const excludeDirs = ["node_modules", ".next", ".git", ".vercel", "out"];
  const excludeFiles = [".DS_Store", "tsconfig.tsbuildinfo"];

  function walk(dir, prefix = "") {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (excludeDirs.includes(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);
      const relPath = path.join(prefix, entry.name).replace(/\\/g, "/");
      if (entry.isDirectory()) {
        walk(fullPath, relPath);
      } else if (!excludeFiles.includes(entry.name)) {
        const content = fs.readFileSync(fullPath);
        files.push({ path: relPath, content });
      }
    }
  }

  walk(outputDir);
  return files;
}

main().catch(console.error);