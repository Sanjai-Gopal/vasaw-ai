import { apiClient } from "./client";
import type { SheetExportResult, SheetSyncResult } from "@/lib/integrations/google-sheets/types";

export async function exportLeadsToSheets(spreadsheetId?: string, mode: "mock" | "real" = "mock"): Promise<SheetExportResult> {
  return apiClient<SheetExportResult>("/api/sheets/export/leads", {
    method: "POST",
    body: JSON.stringify({ spreadsheetId, mode }),
  });
}

export async function exportWebsitesToSheets(spreadsheetId?: string, mode: "mock" | "real" = "mock"): Promise<SheetExportResult> {
  return apiClient<SheetExportResult>("/api/sheets/export/websites", {
    method: "POST",
    body: JSON.stringify({ spreadsheetId, mode }),
  });
}

export async function exportMessagesToSheets(spreadsheetId?: string, mode: "mock" | "real" = "mock"): Promise<SheetExportResult> {
  return apiClient<SheetExportResult>("/api/sheets/export/messages", {
    method: "POST",
    body: JSON.stringify({ spreadsheetId, mode }),
  });
}

export async function exportCampaignsToSheets(spreadsheetId?: string, mode: "mock" | "real" = "mock"): Promise<SheetExportResult> {
  return apiClient<SheetExportResult>("/api/sheets/export/campaigns", {
    method: "POST",
    body: JSON.stringify({ spreadsheetId, mode }),
  });
}

export async function syncAllToSheets(options?: {
  spreadsheetId?: string;
  includeLeads?: boolean;
  includeWebsites?: boolean;
  includeMessages?: boolean;
  includeCampaigns?: boolean;
  mode?: "mock" | "real";
}): Promise<SheetSyncResult> {
  return apiClient<SheetSyncResult>("/api/sheets/sync", {
    method: "POST",
    body: JSON.stringify(options || {}),
  });
}
