export interface GoogleSheetsConfig {
  serviceAccountEmail?: string;
  privateKey?: string;
  spreadsheetId?: string;
}

export interface SheetExportRequest<T = unknown> {
  data: T[];
  spreadsheetId?: string;
  sheetName?: string;
  mode?: "mock" | "real";
}

export interface SheetExportResult {
  success: boolean;
  spreadsheetId: string;
  sheetName: string;
  rowsWritten: number;
  updatedRange?: string;
  error?: string;
  syncedAt: string;
  mode: "mock" | "real";
  filename?: string;
}

export interface SheetSyncRequest {
  campaignId?: string;
  spreadsheetId?: string;
  includeLeads?: boolean;
  includeWebsites?: boolean;
  includeMessages?: boolean;
  includeCampaigns?: boolean;
  mode?: "mock" | "real";
}

export interface SheetSyncResult {
  success: boolean;
  spreadsheetId: string;
  summary: {
    leadsExported: number;
    websitesExported: number;
    messagesExported: number;
    campaignsExported: number;
    totalRows: number;
  };
  errors?: string[];
  syncedAt: string;
  mode: "mock" | "real";
}
