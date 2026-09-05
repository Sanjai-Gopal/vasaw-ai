import { apiClient } from "./client";
import type { Campaign } from "@/lib/types";

export interface GetCampaignsResponse {
  ok: boolean;
  campaigns: Campaign[];
}

export interface CreateCampaignPayload {
  name: string;
  category: string;
  location: string;
  leadTarget: number;
  automationMode?: "manual" | "semi-automatic" | "automatic";
  mode?: "mock" | "real";
}

export async function fetchCampaigns(): Promise<Campaign[]> {
  const res = await apiClient<GetCampaignsResponse>("/api/campaigns");
  return res.campaigns || [];
}

export async function createCampaign(payload: CreateCampaignPayload): Promise<Campaign> {
  const res = await apiClient<{ ok: boolean; campaign: Campaign }>("/api/campaigns", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.campaign;
}

export async function fetchCampaignById(campaignId: string): Promise<Campaign | null> {
  const res = await apiClient<{ ok: boolean; campaign: Campaign }>(`/api/campaigns/${campaignId}`);
  return res.campaign || null;
}

export async function updateCampaignStatus(
  campaignId: string,
  status: Campaign["status"]
): Promise<Campaign> {
  const res = await apiClient<{ ok: boolean; campaign: Campaign }>(`/api/campaigns/${campaignId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  return res.campaign;
}

export interface ExecuteCampaignResponse {
  ok: boolean;
  campaign?: Campaign;
  result?: unknown;
  batchStats?: {
    requested: number;
    processed: number;
    remaining: number;
    isComplete: boolean;
    isExhausted: boolean;
  };
  message?: string;
}

export async function executeCampaign(
  campaignId: string,
  options?: {
    mode?: "mock" | "real";
    locations?: string[];
    categories?: string[];
    maxItems?: number;
    offset?: number;
    force?: boolean;
  }
): Promise<ExecuteCampaignResponse> {
  return apiClient<ExecuteCampaignResponse>(`/api/campaigns/${campaignId}/execute`, {
    method: "POST",
    body: JSON.stringify(options || {}),
  });
}
