import type { Lead, Website, Message, Campaign } from "@/lib/types";
import type { GoogleSheetsProvider } from "./provider";
import type { GoogleSheetsConfig, SheetExportResult, SheetSyncRequest, SheetSyncResult } from "./types";
import { appendSheetValues, testSpreadsheetConnection } from "./client";

export class GoogleSheetsApiProvider implements GoogleSheetsProvider {
  private config: GoogleSheetsConfig;

  constructor(config?: GoogleSheetsConfig) {
    this.config = {
      serviceAccountEmail: config?.serviceAccountEmail || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      privateKey: config?.privateKey || process.env.GOOGLE_PRIVATE_KEY,
      spreadsheetId: config?.spreadsheetId || process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
    };
  }

  private isConfigured(): boolean {
    return !!(
      this.config.serviceAccountEmail &&
      this.config.privateKey &&
      this.config.spreadsheetId
    );
  }

  private getCredentials() {
    return {
      clientEmail: this.config.serviceAccountEmail || "",
      privateKey: this.config.privateKey || "",
    };
  }

  async exportLeads(leads: Lead[], spreadsheetId?: string): Promise<SheetExportResult> {
    const targetId = spreadsheetId || this.config.spreadsheetId;
    if (!targetId || !this.isConfigured()) {
      return {
        success: false,
        spreadsheetId: targetId || "unconfigured",
        sheetName: "Leads",
        rowsWritten: 0,
        error: "Google Sheets credentials not configured. Please set GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, and GOOGLE_SHEETS_SPREADSHEET_ID.",
        syncedAt: new Date().toISOString(),
        mode: "real",
      };
    }

    try {
      const rows = leads.map((l) => [
        l.id,
        l.businessName,
        l.category,
        l.location,
        l.rating,
        l.reviews,
        l.phone || "",
        l.website || "",
        l.email || "",
        l.aiScore,
        l.priority,
        l.status,
        l.createdAt,
      ]);

      const result = await appendSheetValues(this.getCredentials(), targetId, "Leads!A:M", rows);

      return {
        success: true,
        spreadsheetId: targetId,
        sheetName: "Leads",
        rowsWritten: result.updatedRows,
        updatedRange: result.updatedRange,
        syncedAt: new Date().toISOString(),
        mode: "real",
      };
    } catch (err) {
      return {
        success: false,
        spreadsheetId: targetId,
        sheetName: "Leads",
        rowsWritten: 0,
        error: err instanceof Error ? err.message : "Failed to export leads to Google Sheets",
        syncedAt: new Date().toISOString(),
        mode: "real",
      };
    }
  }

  async exportWebsites(websites: Website[], spreadsheetId?: string): Promise<SheetExportResult> {
    const targetId = spreadsheetId || this.config.spreadsheetId;
    if (!targetId || !this.isConfigured()) {
      return {
        success: false,
        spreadsheetId: targetId || "unconfigured",
        sheetName: "Websites",
        rowsWritten: 0,
        error: "Google Sheets credentials not configured.",
        syncedAt: new Date().toISOString(),
        mode: "real",
      };
    }

    try {
      const rows = websites.map((w) => [
        w.id,
        w.leadId,
        w.businessName,
        w.template,
        w.status,
        w.previewUrl || w.liveUrl || "",
        w.deploymentId || "",
        w.theme?.primaryColor || "",
        w.generatedAt || w.builtAt || w.createdAt || new Date().toISOString(),
      ]);

      const result = await appendSheetValues(this.getCredentials(), targetId, "Websites!A:I", rows);

      return {
        success: true,
        spreadsheetId: targetId,
        sheetName: "Websites",
        rowsWritten: result.updatedRows,
        updatedRange: result.updatedRange,
        syncedAt: new Date().toISOString(),
        mode: "real",
      };
    } catch (err) {
      return {
        success: false,
        spreadsheetId: targetId,
        sheetName: "Websites",
        rowsWritten: 0,
        error: err instanceof Error ? err.message : "Failed to export websites to Google Sheets",
        syncedAt: new Date().toISOString(),
        mode: "real",
      };
    }
  }

  async exportMessages(messages: Message[], spreadsheetId?: string): Promise<SheetExportResult> {
    const targetId = spreadsheetId || this.config.spreadsheetId;
    if (!targetId || !this.isConfigured()) {
      return {
        success: false,
        spreadsheetId: targetId || "unconfigured",
        sheetName: "Outreach",
        rowsWritten: 0,
        error: "Google Sheets credentials not configured.",
        syncedAt: new Date().toISOString(),
        mode: "real",
      };
    }

    try {
      const rows = messages.map((m) => [
        m.id,
        m.leadId,
        m.businessName,
        m.direction,
        m.channel,
        m.content,
        m.status,
        m.replyClassification || "",
        m.sentAt || "",
        m.createdAt,
      ]);

      const result = await appendSheetValues(this.getCredentials(), targetId, "Outreach!A:J", rows);

      return {
        success: true,
        spreadsheetId: targetId,
        sheetName: "Outreach",
        rowsWritten: result.updatedRows,
        updatedRange: result.updatedRange,
        syncedAt: new Date().toISOString(),
        mode: "real",
      };
    } catch (err) {
      return {
        success: false,
        spreadsheetId: targetId,
        sheetName: "Outreach",
        rowsWritten: 0,
        error: err instanceof Error ? err.message : "Failed to export messages to Google Sheets",
        syncedAt: new Date().toISOString(),
        mode: "real",
      };
    }
  }

  async exportCampaigns(campaigns: Campaign[], spreadsheetId?: string): Promise<SheetExportResult> {
    const targetId = spreadsheetId || this.config.spreadsheetId;
    if (!targetId || !this.isConfigured()) {
      return {
        success: false,
        spreadsheetId: targetId || "unconfigured",
        sheetName: "Campaigns",
        rowsWritten: 0,
        error: "Google Sheets credentials not configured.",
        syncedAt: new Date().toISOString(),
        mode: "real",
      };
    }

    try {
      const rows = campaigns.map((c) => [
        c.id,
        c.name,
        c.category,
        c.location,
        c.leadTarget,
        c.status,
        c.progress,
        c.leadsCollected,
        c.leadsQualified,
        c.websitesBuilt,
        c.websitesDeployed,
        c.messagesSent,
        c.createdAt,
      ]);

      const result = await appendSheetValues(this.getCredentials(), targetId, "Campaigns!A:M", rows);

      return {
        success: true,
        spreadsheetId: targetId,
        sheetName: "Campaigns",
        rowsWritten: result.updatedRows,
        updatedRange: result.updatedRange,
        syncedAt: new Date().toISOString(),
        mode: "real",
      };
    } catch (err) {
      return {
        success: false,
        spreadsheetId: targetId,
        sheetName: "Campaigns",
        rowsWritten: 0,
        error: err instanceof Error ? err.message : "Failed to export campaigns to Google Sheets",
        syncedAt: new Date().toISOString(),
        mode: "real",
      };
    }
  }

  async syncAll(request: SheetSyncRequest): Promise<SheetSyncResult> {
    const targetId = request.spreadsheetId || this.config.spreadsheetId;
    if (!targetId || !this.isConfigured()) {
      return {
        success: false,
        spreadsheetId: targetId || "unconfigured",
        summary: {
          leadsExported: 0,
          websitesExported: 0,
          messagesExported: 0,
          campaignsExported: 0,
          totalRows: 0,
        },
        errors: ["Google Sheets credentials not configured."],
        syncedAt: new Date().toISOString(),
        mode: "real",
      };
    }

    const errors: string[] = [];
    const leadsExported = 0;
    const websitesExported = 0;
    const messagesExported = 0;
    const campaignsExported = 0;

    const testConn = await testSpreadsheetConnection(this.getCredentials(), targetId);
    if (!testConn.success) {
      return {
        success: false,
        spreadsheetId: targetId,
        summary: {
          leadsExported: 0,
          websitesExported: 0,
          messagesExported: 0,
          campaignsExported: 0,
          totalRows: 0,
        },
        errors: [testConn.error || "Failed to connect to Google Sheets"],
        syncedAt: new Date().toISOString(),
        mode: "real",
      };
    }

    return {
      success: errors.length === 0,
      spreadsheetId: targetId,
      summary: {
        leadsExported,
        websitesExported,
        messagesExported,
        campaignsExported,
        totalRows: leadsExported + websitesExported + messagesExported + campaignsExported,
      },
      errors,
      syncedAt: new Date().toISOString(),
      mode: "real",
    };
  }
}
