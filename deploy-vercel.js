const VERCEL_TOKEN = 'vcp_7Ir1fK3jPx5aHbJMOI3MHoQWH3pwWVKVYW6TNRFXBrLF91e2Kn3hRxVh';
const VERCEL_API = 'https://api.vercel.com';
const GITHUB_TOKEN = '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';

const SUPABASE_URL = 'https://vumaeodrcxylyrtgpeep.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1bWFlb2RyY3h5bHlydGdwZWVwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzIyNjA2OCwiZXhwIjoyMTAyODAyMDY4fQ.tT03G0mSemGQBUH8c6VjXNxFqgFuS0VA9fZdo9Yg_sA';
const { createClient } = require('@supabase/supabase-js');
const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function vercelRequest(endpoint, token, options = {}) {
  const response = await fetch(VERCEL_API + endpoint, {
    ...options,
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error('Vercel API error ' + response.status + ': ' + text);
  }
  return response.json();
}

async function createDeployment(token, options) {
  const body = {
    name: options.name,
    project: options.projectId,
    target: options.target || 'production',
  };
  if (options.gitSource) body.gitSource = options.gitSource;
  if (options.teamId) body.teamId = options.teamId;
  
  return vercelRequest('/v13/deployments', token, { method: 'POST', body: JSON.stringify(body) });
}

async function getDeployment(token, deploymentId, teamId) {
  const params = teamId ? '?teamId=' + teamId : '';
  return vercelRequest('/v13/deployments/' + deploymentId + params, token);
}

async function waitForDeployment(token, deploymentId, options = {}) {
  const maxWaitMs = options.maxWaitMs ?? 300000;
  const pollIntervalMs = options.pollIntervalMs ?? 10000;
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const deployment = await getDeployment(token, deploymentId, options.teamId);
    if (deployment.readyState === 'READY' || deployment.readyState === 'ERROR' || deployment.readyState === 'CANCELED') {
      return deployment;
    }
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }
  throw new Error('Vercel deployment timed out after ' + maxWaitMs + 'ms');
}

async function verifyDeployment(liveUrl, businessName) {
  console.log('Verifying: ' + liveUrl);
  const response = await fetch(liveUrl);
  console.log('HTTP Status:', response.status);
  
  if (!response.ok) {
    throw new Error('Live URL verification failed: ' + response.status);
  }
  
  const html = await response.text();
  
  if (!html.includes(businessName)) {
    throw new Error('Business name "' + businessName + '" not found in deployed page');
  }
  console.log('✓ Business name found');
  
  if (html.includes('.css') || html.includes('styles') || html.includes('tailwind')) {
    console.log('✓ CSS appears to be loaded');
  } else {
    console.warn('⚠ CSS may not be loaded');
  }
  
  return true;
}

async function updateSupabase(biz, result) {
  console.log('Updating Supabase for ' + biz.businessName);
  
  await admin.from('websites').update({
    status: 'deployed',
    live_url: result.liveUrl,
    repo_url: result.repoUrl,
    commit_hash: result.commitSha,
    updated_at: new Date().toISOString(),
  }).eq('id', biz.websiteId);
  
  await admin.from('deployments').upsert({
    id: result.deploymentId,
    website_id: biz.websiteId,
    lead_id: biz.leadId,
    business_name: biz.businessName,
    status: 'deployed',
    provider: 'vercel',
    environment: 'production',
    live_url: result.liveUrl,
    commit_hash: result.commitSha,
    duration_sec: 0,
    deployed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  });
  
  await admin.from('leads').update({
    deployment_status: 'deployed',
    website_status: 'deployed',
    updated_at: new Date().toISOString(),
  }).eq('id', biz.leadId);
  
  await admin.from('activities').insert({
    lead_id: biz.leadId,
    actor: 'deployment-agent',
    type: 'deployment',
    status: 'success',
    title: 'Website deployed',
    description: biz.businessName + ' deployed to ' + result.liveUrl,
  });
  
  console.log('✓ Supabase updated');
}

async function main() {
  const projects = [
    { 
      projectId: 'prj_5TZJukGYGZ2jDPsbOFYUngj24JyI', 
      name: 'vasaw-nagerkovil-arya-bhavan',
      commitSha: 'bc39b3b91d6480a5e216902a4dbbebc0dc09d9a2',
      businessName: 'Nagerkovil Arya Bhavan',
      leadId: '7e7a7d98-a8e4-4886-a0ba-78db2de92ed3',
      websiteId: 'a650ef83-fea4-409c-b49b-fd782701ff0b',
      subdir: 'nagerkovil-arya-bhavan-7e7a7d98'
    },
    { 
      projectId: 'prj_K6rW3atDrIAnMFB50m2BHCJEJr54', 
      name: 'vasaw-welcomcafe-kovai',
      commitSha: '52bccd7f6059060760523ef98ca0b060529c400e',
      businessName: 'Welcomcafe Kovai',
      leadId: 'beb1bf5f-d79f-4985-a452-79acc3dd3375',
      websiteId: '565a46a4-aa00-482a-948b-e3586b71ae84',
      subdir: 'welcomcafe-kovai-beb1bf5f'
    },
    { 
      projectId: 'prj_i8K6UQrC6F2Nyg8T62HS4OOBChpW', 
      name: 'vasaw-kovai-kitchen',
      commitSha: '78905d930872df3b11e06abdaeff5085705b028d',
      businessName: 'Kovai Kitchen',
      leadId: 'fac214d9-253e-4b6a-91c0-de83ea7c8ff5',
      websiteId: 'fb1f2bc6-86e5-4147-8af1-6de2438ab555',
      subdir: 'kovai-kitchen-fac214d9'
    },
  ];

  const results = [];

  for (const proj of projects) {
    try {
      console.log('\n=== Deploying ' + proj.businessName + ' ===');
      
      const deployment = await createDeployment(VERCEL_TOKEN, {
        name: proj.name,
        projectId: proj.projectId,
        gitSource: {
          type: 'github',
          repoId: '1340754773',
          ref: 'main',
          sha: proj.commitSha,
        },
        target: 'production',
      });
      
      console.log('Created deployment:', deployment.id);
      
      const finalDeployment = await waitForDeployment(VERCEL_TOKEN, deployment.id, {
        maxWaitMs: 300000,
        pollIntervalMs: 10000,
      });
      
      console.log('Deployment status:', finalDeployment.readyState);
      
      if (finalDeployment.readyState !== 'READY') {
        throw new Error('Vercel deployment failed: ' + finalDeployment.readyState);
      }
      
      const liveUrl = 'https://' + finalDeployment.url;
      console.log('Live URL:', liveUrl);
      
      await verifyDeployment(liveUrl, proj.businessName);
      
      const repoUrl = 'https://github.com/Sanjai-Gopal/vasaw-ai/tree/main/' + proj.subdir;
      
      await updateSupabase({
        businessName: proj.businessName,
        leadId: proj.leadId,
        websiteId: proj.websiteId,
      }, {
        repoUrl,
        commitSha: proj.commitSha,
        vercelProjectId: proj.projectId,
        deploymentId: finalDeployment.id,
        liveUrl,
      });
      
      results.push({
        business: proj.businessName,
        repoUrl,
        commitSha: proj.commitSha,
        vercelProjectId: proj.projectId,
        deploymentId: finalDeployment.id,
        liveUrl,
        status: 'success',
      });
      
      console.log('✅ ' + proj.businessName + ' DEPLOYED SUCCESSFULLY');
      console.log('   Repo: ' + repoUrl);
      console.log('   Commit: ' + proj.commitSha);
      console.log('   Vercel Project: ' + proj.projectId);
      console.log('   Deployment: ' + finalDeployment.id);
      console.log('   Live URL: ' + liveUrl);
      
    } catch (err) {
      console.error('❌ ' + proj.businessName + ' FAILED:', err.message);
      results.push({
        business: proj.businessName,
        status: 'failed',
        error: err.message,
      });
    }
  }

  // Re-check Ganga Restaurant
  console.log('\n=== Re-checking Ganga Restaurant ===');
  try {
    const liveUrl = 'https://ganga-restaurant-indian-restaurants.vercel.app';
    await verifyDeployment(liveUrl, 'Ganga Restaurant');
    
    await admin.from('websites').update({
      status: 'deployed',
      live_url: liveUrl,
      updated_at: new Date().toISOString(),
    }).eq('id', '4d7ec33a-9701-4cf0-8d5a-1a675fae0e88');
    
    await admin.from('leads').update({
      deployment_status: 'deployed',
      website_status: 'deployed',
      updated_at: new Date().toISOString(),
    }).eq('id', 'd7bd7a69-6cae-42de-80d8-5b519e7f38ce');
    
    results.push({
      business: 'Ganga Restaurant',
      liveUrl,
      status: 'verified',
    });
    console.log('✓ Ganga Restaurant verified');
  } catch (err) {
    console.error('✗ Ganga Restaurant verification failed:', err.message);
    results.push({
      business: 'Ganga Restaurant',
      status: 'failed',
      error: err.message,
    });
  }

  console.log('\n=== FINAL REPORT ===');
  console.log(JSON.stringify(results, null, 2));
}

main().catch(console.error);