import { randomUUID } from "crypto";

const GITHUB_API = "https://api.github.com";

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  clone_url: string;
  default_branch: string;
  owner: {
    login: string;
  };
}

export interface GitHubCommit {
  sha: string;
  html_url: string;
}

export interface SecretScanResult {
  hasSecrets: boolean;
  secrets: Array<{ file: string; pattern: string; line: number }>;
}

export interface GitHubUser {
  login: string;
  id: number;
}

async function githubRequest<T>(endpoint: string, token: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${GITHUB_API}${endpoint}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(options?.headers as Record<string, string>),
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`GitHub API error ${response.status}: ${text}`);
  }
  return response.json();
}

export async function getAuthenticatedUser(token: string): Promise<GitHubUser> {
  return githubRequest<GitHubUser>("/user", token);
}

export async function createRepository(
  token: string,
  name: string,
  description: string,
  privateRepo = true
): Promise<GitHubRepo> {
  return githubRequest<GitHubRepo>("/user/repos", token, {
    method: "POST",
    body: JSON.stringify({
      name,
      description,
      private: privateRepo,
      auto_init: false,
    }),
  });
}

export async function getRepository(token: string, owner: string, repo: string): Promise<GitHubRepo | null> {
  try {
    return await githubRequest<GitHubRepo>(`/repos/${owner}/${repo}`, token);
  } catch {
    return null;
  }
}

export async function pushFiles(
  token: string,
  owner: string,
  repo: string,
  files: Array<{ path: string; content: string | Uint8Array }>,
  commitMessage: string,
  branch = "main"
): Promise<GitHubCommit> {
  // Get the current branch reference
  const ref = await githubRequest<{ object: { sha: string } }>(`/repos/${owner}/${repo}/git/ref/heads/${branch}`, token);
  const latestCommitSha = ref.object.sha;

  // Create blobs for each file
  const blobs = await Promise.all(
    files.map(async (file) => {
      const content = typeof file.content === "string" ? file.content : new TextDecoder().decode(file.content);
      const blob = await githubRequest<{ sha: string }>(`/repos/${owner}/${repo}/git/blobs`, token, {
        method: "POST",
        body: JSON.stringify({
          content,
          encoding: "utf-8",
        }),
      });
      return { path: file.path, sha: blob.sha };
    })
  );

  // Create tree
  const tree = await githubRequest<{ sha: string }>(`/repos/${owner}/${repo}/git/trees`, token, {
    method: "POST",
    body: JSON.stringify({
      base_tree: latestCommitSha,
      tree: blobs.map((b) => ({
        path: b.path,
        mode: "100644",
        type: "blob",
        sha: b.sha,
      })),
    }),
  });

  // Create commit
  const commit = await githubRequest<GitHubCommit>(`/repos/${owner}/${repo}/git/commits`, token, {
    method: "POST",
    body: JSON.stringify({
      message: commitMessage,
      tree: tree.sha,
      parents: [latestCommitSha],
    }),
  });

  // Update branch reference
  await githubRequest(`/repos/${owner}/${repo}/git/refs/heads/${branch}`, token, {
    method: "PATCH",
    body: JSON.stringify({
      sha: commit.sha,
      force: false,
    }),
  });

  return commit;
}

export async function scanForSecrets(
  files: Array<{ path: string; content: string }>
): Promise<SecretScanResult> {
  const secretPatterns = [
    { name: "API Key", pattern: /api[_-]?key\s*[=:]\s*['"][a-zA-Z0-9_\-]{20,}['"]/gi },
    { name: "Secret", pattern: /secret\s*[=:]\s*['"][a-zA-Z0-9_\-]{20,}['"]/gi },
    { name: "Password", pattern: /password\s*[=:]\s*['"][^'"]{8,}['"]/gi },
    { name: "Token", pattern: /token\s*[=:]\s*['"][a-zA-Z0-9_\-]{20,}['"]/gi },
    { name: "Private Key", pattern: /private[_-]?key\s*[=:]\s*['"][a-zA-Z0-9_\-]{20,}['"]/gi },
    { name: "Access Token", pattern: /access[_-]?token\s*[=:]\s*['"][a-zA-Z0-9_\-]{20,}['"]/gi },
    { name: "Bearer", pattern: /bearer\s+[a-zA-Z0-9_\-]{20,}/gi },
    { name: "Stripe Key", pattern: /sk_[a-zA-Z0-9]{20,}/g },
    { name: "Supabase Key", pattern: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_\-]+\.[a-zA-Z0-9_\-]+/g },
    { name: "Vercel Token", pattern: /vcp_[a-zA-Z0-9]{20,}/g },
    { name: "GitHub Token", pattern: /github_pat_[a-zA-Z0-9_]{20,}/g },
  ];

  const foundSecrets: Array<{ file: string; pattern: string; line: number }> = [];

  for (const file of files) {
    const lines = file.content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      for (const { name, pattern } of secretPatterns) {
        if (pattern.test(lines[i])) {
          foundSecrets.push({ file: file.path, pattern: name, line: i + 1 });
        }
      }
    }
  }

  return {
    hasSecrets: foundSecrets.length > 0,
    secrets: foundSecrets,
  };
}

export async function createOrGetRepository(
  token: string,
  name: string,
  description: string
): Promise<GitHubRepo> {
  const user = await getAuthenticatedUser(token);
  const existing = await getRepository(token, user.login, name);
  if (existing) {
    return existing;
  }
  return createRepository(token, name, description, true);
}