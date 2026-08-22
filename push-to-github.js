const GITHUB_TOKEN = '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';
const fs = require('fs');
const path = require('path');

const GITHUB_API = 'https://api.github.com';

async function githubRequest(endpoint, token, options = {}) {
  const response = await fetch(GITHUB_API + endpoint, {
    ...options,
    headers: {
      'Authorization': 'Bearer ' + token,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error('GitHub API error ' + response.status + ': ' + text);
  }
  return response.json();
}

async function pushFiles(token, owner, repo, files, commitMessage, branch = 'main') {
  const ref = await githubRequest('/repos/' + owner + '/' + repo + '/git/ref/heads/' + branch, token);
  const latestCommitSha = ref.object.sha;

  const blobs = await Promise.all(
    files.map(async (file) => {
      const content = typeof file.content === 'string' ? file.content : new TextDecoder().decode(file.content);
      const blob = await githubRequest('/repos/' + owner + '/' + repo + '/git/blobs', token, {
        method: 'POST',
        body: JSON.stringify({ content, encoding: 'utf-8' }),
      });
      return { path: file.path, sha: blob.sha };
    })
  );

  const tree = await githubRequest('/repos/' + owner + '/' + repo + '/git/trees', token, {
    method: 'POST',
    body: JSON.stringify({
      base_tree: latestCommitSha,
      tree: blobs.map((b) => ({
        path: b.path,
        mode: '100644',
        type: 'blob',
        sha: b.sha,
      })),
    }),
  });

  const commit = await githubRequest('/repos/' + owner + '/' + repo + '/git/commits', token, {
    method: 'POST',
    body: JSON.stringify({
      message: commitMessage,
      tree: tree.sha,
      parents: [latestCommitSha],
    }),
  });

  await githubRequest('/repos/' + owner + '/' + repo + '/git/refs/heads/' + branch, token, {
    method: 'PATCH',
    body: JSON.stringify({ sha: commit.sha, force: false }),
  });

  return commit;
}

const secretPatterns = [
  { name: 'API Key', pattern: /api[_-]?key\s*[=:]\s*['"][a-zA-Z0-9_\-]{20,}['"]/gi },
  { name: 'Secret', pattern: /secret\s*[=:]\s*['"][a-zA-Z0-9_\-]{20,}['"]/gi },
  { name: 'Password', pattern: /password\s*[=:]\s*['"][^'"]{8,}['"]/gi },
  { name: 'Token', pattern: /token\s*[=:]\s*['"][a-zA-Z0-9_\-]{20,}['"]/gi },
  { name: 'Private Key', pattern: /private[_-]?key\s*[=:]\s*['"][a-zA-Z0-9_\-]{20,}['"]/gi },
  { name: 'Access Token', pattern: /access[_-]?token\s*[=:]\s*['"][a-zA-Z0-9_\-]{20,}['"]/gi },
  { name: 'Bearer', pattern: /bearer\s+[a-zA-Z0-9_\-]{20,}/gi },
  { name: 'Stripe Key', pattern: /sk_[a-zA-Z0-9]{20,}/g },
  { name: 'Supabase Key', pattern: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_\-]+\.[a-zA-Z0-9_\-]+/g },
  { name: 'Vercel Token', pattern: /vcp_[a-zA-Z0-9]{20,}/g },
  { name: 'GitHub Token', pattern: /github_pat_[a-zA-Z0-9_]{20,}/g },
];

async function scanForSecrets(files) {
  const foundSecrets = [];
  for (const file of files) {
    const lines = file.content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      for (const { name, pattern } of secretPatterns) {
        if (pattern.test(lines[i])) {
          foundSecrets.push({ file: file.path, pattern: name, line: i + 1 });
        }
      }
    }
  }
  return { hasSecrets: foundSecrets.length > 0, secrets: foundSecrets };
}

async function pushWebsite(subdir, outputDir, commitMessage) {
  const files = [];
  const excludeDirs = ['node_modules', '.next', '.git', '.vercel', 'out'];
  const excludeFiles = ['.DS_Store', 'tsconfig.tsbuildinfo'];
  
  function walk(dir, prefix = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (excludeDirs.includes(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);
      const relPath = path.join(prefix, entry.name).replace(/\\/g, '/');
      const finalPath = path.join(subdir, relPath).replace(/\\/g, '/');
      
      if (entry.isDirectory()) {
        walk(fullPath, path.join(prefix, entry.name));
      } else if (!excludeFiles.includes(entry.name)) {
        const content = fs.readFileSync(fullPath);
        files.push({ path: finalPath, content });
      }
    }
  }
  
  walk(outputDir);
  console.log(subdir + ': Collected ' + files.length + ' files');
  
  const secretScan = await scanForSecrets(files.map(f => ({ 
    path: f.path, 
    content: typeof f.content === 'string' ? f.content : new TextDecoder().decode(f.content) 
  })));
  
  if (secretScan.hasSecrets) {
    throw new Error('Secret scan failed: ' + secretScan.secrets.map(s => s.file + ':' + s.line).join(', '));
  }
  
  const user = await githubRequest('/user', GITHUB_TOKEN);
  const owner = user.login;
  const repoName = 'vasaw-ai';
  
  const commit = await pushFiles(GITHUB_TOKEN, owner, repoName, files, commitMessage, 'main');
  
  console.log(subdir + ': Pushed commit ' + commit.sha);
  return commit;
}

async function main() {
  const sites = [
    { subdir: 'nagerkovil-arya-bhavan-7e7a7d98', dir: 'generated-websites/nagerkovil-arya-bhavan-7e7a7d98', name: 'Nagerkovil Arya Bhavan' },
    { subdir: 'welcomcafe-kovai-beb1bf5f', dir: 'generated-websites/welcomcafe-kovai-beb1bf5f', name: 'Welcomcafe Kovai' },
    { subdir: 'kovai-kitchen-fac214d9', dir: 'generated-websites/kovai-kitchen-fac214d9', name: 'Kovai Kitchen' },
  ];
  
  for (const site of sites) {
    try {
      const commit = await pushWebsite(site.subdir, site.dir, 'Initial commit: VASAW AI generated website for ' + site.name);
      console.log(site.name + ' -> ' + commit.sha);
    } catch (e) {
      console.error(site.name + ' FAILED:', e.message);
    }
  }
}

main();