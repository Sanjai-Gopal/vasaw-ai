import { apiClient } from "./client";
import type { SheetExportResult, SheetSyncResult } from "@/lib/integrations/google-sheets/types";

export async function downloadExportFile(
  type: "leads" | "websites" | "messages" | "campaigns",
  spreadsheetId?: string,
  mode: "mock" | "real" = "mock"
): Promise<SheetExportResult> {
  try {
    const res = await fetch(`/api/sheets/export/${type}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ spreadsheetId, mode }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return {
        success: false,
        spreadsheetId: spreadsheetId || "",
        sheetName: type,
        rowsWritten: 0,
        error: errorData.error || `Failed to export ${type} (Status ${res.status})`,
        syncedAt: new Date().toISOString(),
        mode,
      };
    }

    const disposition = res.headers.get("Content-Disposition") || "";
    let filename = `vasaw-${type}.csv`;
    const filenameMatch = disposition.match(/filename="?([^";]+)"?/);
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1].trim();
    }

    const rowsWritten = res.headers.get("X-Rows-Written")
      ? parseInt(res.headers.get("X-Rows-Written")!, 10)
      : 0;
    const sheetName = res.headers.get("X-Sheet-Name") || type;

    if (typeof window !== "undefined") {
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
        window.URL.revokeObjectURL(url);
      }, 200);
    }

    return {
      success: true,
      spreadsheetId: spreadsheetId || "",
      sheetName,
      rowsWritten,
      syncedAt: new Date().toISOString(),
      mode,
      filename,
    };
  } catch (err) {
    return {
      success: false,
      spreadsheetId: spreadsheetId || "",
      sheetName: type,
      rowsWritten: 0,
      error: err instanceof Error ? err.message : `Failed to export ${type}`,
      syncedAt: new Date().toISOString(),
      mode,
    };
  }
}

export async function exportLeadsToSheets(spreadsheetId?: string, mode: "mock" | "real" = "mock"): Promise<SheetExportResult> {
  return downloadExportFile("leads", spreadsheetId, mode);
}

export async function exportWebsitesToSheets(spreadsheetId?: string, mode: "mock" | "real" = "mock"): Promise<SheetExportResult> {
  return downloadExportFile("websites", spreadsheetId, mode);
}

export async function exportMessagesToSheets(spreadsheetId?: string, mode: "mock" | "real" = "mock"): Promise<SheetExportResult> {
  return downloadExportFile("messages", spreadsheetId, mode);
}

export async function exportCampaignsToSheets(spreadsheetId?: string, mode: "mock" | "real" = "mock"): Promise<SheetExportResult> {
  return downloadExportFile("campaigns", spreadsheetId, mode);
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
