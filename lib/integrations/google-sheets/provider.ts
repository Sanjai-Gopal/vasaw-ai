import type { Lead, Website, Message, Campaign } from "@/lib/types";
import type { SheetExportResult, SheetSyncRequest, SheetSyncResult } from "./types";

export interface GoogleSheetsProvider {
  exportLeads(leads: Lead[], spreadsheetId?: string): Promise<SheetExportResult>;
  exportWebsites(websites: Website[], spreadsheetId?: string): Promise<SheetExportResult>;
  exportMessages(messages: Message[], spreadsheetId?: string): Promise<SheetExportResult>;
  exportCampaigns(campaigns: Campaign[], spreadsheetId?: string): Promise<SheetExportResult>;
  syncAll(request: SheetSyncRequest): Promise<SheetSyncResult>;
}
