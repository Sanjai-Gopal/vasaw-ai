import { apiClient } from "./client";
import type { Lead } from "@/lib/types";

export interface GetLeadsResponse {
  ok: boolean;
  leads: Lead[];
  count: number;
}

export interface GetLeadResponse {
  ok: boolean;
  lead: Lead;
}

export async function fetchLeads(params?: {
  status?: string;
  category?: string;
  search?: string;
}): Promise<Lead[]> {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.category) query.set("category", params.category);
  if (params?.search) query.set("search", params.search);

  const qs = query.toString();
  const url = `/api/leads${qs ? `?${qs}` : ""}`;
  const res = await apiClient<GetLeadsResponse>(url);
  return res.leads || [];
}

export async function fetchLeadById(id: string): Promise<Lead> {
  const res = await apiClient<GetLeadResponse>(`/api/leads/${id}`);
  return res.lead;
}

export async function updateLeadStatus(id: string, status: string): Promise<Lead> {
  const res = await apiClient<GetLeadResponse>(`/api/leads/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  return res.lead;
}
