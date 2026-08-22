const VERCEL_API = "https://api.vercel.com";

export interface VercelProject {
  id: string;
  name: string;
  framework: string;
  gitRepository?: {
    type: string;
    repo: string;
  };
}

export interface VercelDeployment {
  id: string;
  url: string;
  readyState: "READY" | "BUILDING" | "ERROR" | "CANCELED" | "QUEUED";
  meta: {
    githubCommitSha: string;
  };
  createdAt: number;
}

export interface CreateProjectOptions {
  name: string;
  framework?: string;
  gitRepository?: {
    type: "github";
    repo: string;
  };
  teamId?: string;
}

export interface CreateDeploymentOptions {
  name: string;
  projectId: string;
  gitSource?: {
    type: "github";
    repo: string;
    ref: string;
    sha: string;
  };
  target?: "production" | "preview";
  teamId?: string;
}

async function vercelRequest<T>(endpoint: string, token: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${VERCEL_API}${endpoint}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options?.headers as Record<string, string>),
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Vercel API error ${response.status}: ${text}`);
  }
  return response.json();
}

export async function createProject(token: string, options: CreateProjectOptions): Promise<VercelProject> {
  const body: Record<string, unknown> = {
    name: options.name,
    framework: options.framework || "nextjs",
  };

  if (options.gitRepository) {
    body.gitRepository = options.gitRepository;
  }

  if (options.teamId) {
    body.teamId = options.teamId;
  }

  return vercelRequest<VercelProject>("/v9/projects", token, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getProject(token: string, projectIdOrName: string, teamId?: string): Promise<VercelProject | null> {
  try {
    const params = teamId ? `?teamId=${teamId}` : "";
    return await vercelRequest<VercelProject>(`/v9/projects/${projectIdOrName}${params}`, token);
  } catch {
    return null;
  }
}

export async function createDeployment(token: string, options: CreateDeploymentOptions): Promise<VercelDeployment> {
  const body: Record<string, unknown> = {
    name: options.name,
    project: options.projectId,
    target: options.target || "production",
  };

  if (options.gitSource) {
    body.gitSource = options.gitSource;
  }

  if (options.teamId) {
    body.teamId = options.teamId;
  }

  return vercelRequest<VercelDeployment>("/v13/deployments", token, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getDeployment(token: string, deploymentId: string, teamId?: string): Promise<VercelDeployment> {
  const params = teamId ? `?teamId=${teamId}` : "";
  return vercelRequest<VercelDeployment>(`/v13/deployments/${deploymentId}${params}`, token);
}

export async function waitForDeployment(
  token: string,
  deploymentId: string,
  options?: { teamId?: string; maxWaitMs?: number; pollIntervalMs?: number }
): Promise<VercelDeployment> {
  const maxWaitMs = options?.maxWaitMs ?? 300000;
  const pollIntervalMs = options?.pollIntervalMs ?? 10000;
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const deployment = await getDeployment(token, deploymentId, options?.teamId);

    if (deployment.readyState === "READY" || deployment.readyState === "ERROR" || deployment.readyState === "CANCELED") {
      return deployment;
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(`Vercel deployment timed out after ${maxWaitMs}ms`);
}

export async function deployFromFiles(
  token: string,
  projectId: string,
  files: Array<{ path: string; content: string | Uint8Array }>,
  options?: { teamId?: string; target?: "production" | "preview" }
): Promise<VercelDeployment> {
  // Create a form data for file upload
  const formData = new FormData();

  for (const file of files) {
    const content = typeof file.content === "string" ? file.content : new TextDecoder().decode(file.content);
    const blob = new Blob([content]);
    formData.append("files[]", blob, file.path);
  }

  const deploymentConfig = {
    name: projectId,
    project: projectId,
    target: options?.target || "production",
  };
  formData.append("deployment", JSON.stringify(deploymentConfig));

  const response = await fetch(`${VERCEL_API}/v13/deployments`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Vercel deployment creation failed ${response.status}: ${text}`);
  }

  const deployment = await response.json() as VercelDeployment;
  return waitForDeployment(token, deployment.id, { teamId: options?.teamId });
}