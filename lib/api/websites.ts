import { apiClient } from "./client";
import type { Website } from "@/lib/types";

export interface GetWebsitesResponse {
  ok: boolean;
  websites: Website[];
}

export async function fetchWebsites(): Promise<Website[]> {
  const res = await apiClient<GetWebsitesResponse>("/api/websites");
  return res.websites || [];
}

export async function deployWebsite(
  websiteId: string,
  mode: "mock" | "real" = "mock"
): Promise<{ ok: boolean; url?: string }> {
  return apiClient<{ ok: boolean; url?: string }>(`/api/websites/${websiteId}/deploy`, {
    method: "POST",
    body: JSON.stringify({ mode }),
  });
}

export async function rebuildWebsite(
  websiteId: string,
  mode: "mock" | "real" = "mock"
): Promise<{ ok: boolean; website?: Website }> {
  return apiClient<{ ok: boolean; website?: Website }>(`/api/websites/${websiteId}/rebuild`, {
    method: "POST",
    body: JSON.stringify({ mode }),
  });
}
