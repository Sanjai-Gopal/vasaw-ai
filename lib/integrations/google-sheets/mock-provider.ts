import type { Lead, Website, Message, Campaign } from "@/lib/types";
import type { GoogleSheetsProvider } from "./provider";
import type { SheetExportResult, SheetSyncRequest, SheetSyncResult } from "./types";

export class MockGoogleSheetsProvider implements GoogleSheetsProvider {
  private inMemorySheets: Map<string, Array<Record<string, unknown>>> = new Map();

  async exportLeads(leads: Lead[], spreadsheetId = "mock-spreadsheet-leads"): Promise<SheetExportResult> {
    const sheetName = "Leads";
    const existing = this.inMemorySheets.get(`${spreadsheetId}:${sheetName}`) || [];

    // Idempotent upsert by lead.id
    const leadMap = new Map<string, Record<string, unknown>>();
    for (const row of existing) {
      if (row.leadId) leadMap.set(String(row.leadId), row);
    }

    for (const lead of leads) {
      leadMap.set(lead.id, {
        leadId: lead.id,
        businessName: lead.businessName,
        category: lead.category,
        location: lead.location,
        rating: lead.rating,
        reviews: lead.reviews,
        website: lead.website || "",
        phone: lead.phone,
        aiScore: lead.aiScore,
        priority: lead.priority,
        status: lead.status,
        createdAt: lead.createdAt,
      });
    }

    const rows = Array.from(leadMap.values());
    this.inMemorySheets.set(`${spreadsheetId}:${sheetName}`, rows);

    return {
      success: true,
      spreadsheetId,
      sheetName,
      rowsWritten: leads.length,
      updatedRange: `${sheetName}!A2:L${rows.length + 1}`,
      syncedAt: new Date().toISOString(),
      mode: "mock",
    };
  }

  async exportWebsites(websites: Website[], spreadsheetId = "mock-spreadsheet-websites"): Promise<SheetExportResult> {
    const sheetName = "Websites";
    const existing = this.inMemorySheets.get(`${spreadsheetId}:${sheetName}`) || [];

    const siteMap = new Map<string, Record<string, unknown>>();
    for (const row of existing) {
      if (row.websiteId) siteMap.set(String(row.websiteId), row);
    }

    for (const site of websites) {
      siteMap.set(site.id, {
        websiteId: site.id,
        leadId: site.leadId,
        businessName: site.businessName,
        category: site.category,
        location: site.location,
        status: site.status,
        template: site.template,
        pages: site.pages,
        sections: site.sections,
        buildProgress: site.buildProgress,
        previewUrl: site.previewUrl || "",
        liveUrl: site.liveUrl || "",
        createdAt: site.createdAt,
        builtAt: site.builtAt || "",
      });
    }

    const rows = Array.from(siteMap.values());
    this.inMemorySheets.set(`${spreadsheetId}:${sheetName}`, rows);

    return {
      success: true,
      spreadsheetId,
      sheetName,
      rowsWritten: websites.length,
      updatedRange: `${sheetName}!A2:N${rows.length + 1}`,
      syncedAt: new Date().toISOString(),
      mode: "mock",
    };
  }

  async exportMessages(messages: Message[], spreadsheetId = "mock-spreadsheet-messages"): Promise<SheetExportResult> {
    const sheetName = "Outreach";
    const existing = this.inMemorySheets.get(`${spreadsheetId}:${sheetName}`) || [];

    const msgMap = new Map<string, Record<string, unknown>>();
    for (const row of existing) {
      if (row.messageId) msgMap.set(String(row.messageId), row);
    }

    for (const msg of messages) {
      msgMap.set(msg.id, {
        messageId: msg.id,
        leadId: msg.leadId,
        businessName: msg.businessName,
        direction: msg.direction,
        channel: msg.channel,
        content: msg.content,
        status: msg.status,
        sentAt: msg.sentAt || "",
        createdAt: msg.createdAt,
      });
    }

    const rows = Array.from(msgMap.values());
    this.inMemorySheets.set(`${spreadsheetId}:${sheetName}`, rows);

    return {
      success: true,
      spreadsheetId,
      sheetName,
      rowsWritten: messages.length,
      updatedRange: `${sheetName}!A2:J${rows.length + 1}`,
      syncedAt: new Date().toISOString(),
      mode: "mock",
    };
  }

  async exportCampaigns(campaigns: Campaign[], spreadsheetId = "mock-spreadsheet-campaigns"): Promise<SheetExportResult> {
    const sheetName = "Campaigns";
    const existing = this.inMemorySheets.get(`${spreadsheetId}:${sheetName}`) || [];

    const campMap = new Map<string, Record<string, unknown>>();
    for (const row of existing) {
      if (row.campaignId) campMap.set(String(row.campaignId), row);
    }

    for (const camp of campaigns) {
      campMap.set(camp.id, {
        campaignId: camp.id,
        name: camp.name,
        category: camp.category,
        location: camp.location,
        leadTarget: camp.leadTarget,
        status: camp.status,
        progress: camp.progress,
        leadsCollected: camp.leadsCollected,
        leadsQualified: camp.leadsQualified,
        websitesBuilt: camp.websitesBuilt,
        websitesDeployed: camp.websitesDeployed,
        messagesSent: camp.messagesSent,
        createdAt: camp.createdAt,
      });
    }

    const rows = Array.from(campMap.values());
    this.inMemorySheets.set(`${spreadsheetId}:${sheetName}`, rows);

    return {
      success: true,
      spreadsheetId,
      sheetName,
      rowsWritten: campaigns.length,
      updatedRange: `${sheetName}!A2:M${rows.length + 1}`,
      syncedAt: new Date().toISOString(),
      mode: "mock",
    };
  }

  async syncAll(request: SheetSyncRequest): Promise<SheetSyncResult> {
    const spreadsheetId = request.spreadsheetId || "mock-spreadsheet-vasaw";

    return {
      success: true,
      spreadsheetId,
      summary: {
        leadsExported: request.includeLeads ? 10 : 0,
        websitesExported: request.includeWebsites ? 5 : 0,
        messagesExported: request.includeMessages ? 3 : 0,
        campaignsExported: request.includeCampaigns ? 1 : 0,
        totalRows: (request.includeLeads ? 10 : 0) +
          (request.includeWebsites ? 5 : 0) +
          (request.includeMessages ? 3 : 0) +
          (request.includeCampaigns ? 1 : 0),
      },
      syncedAt: new Date().toISOString(),
      mode: "mock",
    };
  }
}
