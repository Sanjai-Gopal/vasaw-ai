import type { Lead, Website, Message, Campaign } from "@/lib/types";

export function escapeCsvValue(val: unknown): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes('"') || str.includes(",") || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function generateCsv(headers: string[], rows: unknown[][]): string {
  const headerLine = headers.map(escapeCsvValue).join(",");
  const dataLines = rows.map((row) => row.map(escapeCsvValue).join(","));
  return "\uFEFF" + [headerLine, ...dataLines].join("\r\n");
}

export function generateLeadsCsv(leads: Lead[]): string {
  const headers = [
    "Lead ID",
    "Business Name",
    "Category",
    "Location",
    "Rating",
    "Reviews",
    "Phone",
    "Website",
    "Email",
    "AI Score",
    "Priority",
    "Status",
    "Created At",
  ];

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

  return generateCsv(headers, rows);
}

export function generateWebsitesCsv(websites: Website[]): string {
  const headers = [
    "Website ID",
    "Lead ID",
    "Business Name",
    "Category",
    "Location",
    "Status",
    "Template",
    "Pages",
    "Sections",
    "Build Progress",
    "Preview URL",
    "Live URL",
    "Created At",
    "Built At",
  ];

  const rows = websites.map((site) => [
    site.id,
    site.leadId,
    site.businessName,
    site.category,
    site.location,
    site.status,
    site.template,
    site.pages,
    site.sections,
    site.buildProgress,
    site.previewUrl || "",
    site.liveUrl || "",
    site.createdAt,
    site.builtAt || "",
  ]);

  return generateCsv(headers, rows);
}

export function generateMessagesCsv(messages: Message[]): string {
  const headers = [
    "Message ID",
    "Lead ID",
    "Business Name",
    "Direction",
    "Channel",
    "Content",
    "Status",
    "Sent At",
    "Created At",
  ];

  const rows = messages.map((msg) => [
    msg.id,
    msg.leadId,
    msg.businessName,
    msg.direction,
    msg.channel,
    msg.content,
    msg.status,
    msg.sentAt || "",
    msg.createdAt,
  ]);

  return generateCsv(headers, rows);
}

export function generateCampaignsCsv(campaigns: Campaign[]): string {
  const headers = [
    "Campaign ID",
    "Name",
    "Category",
    "Location",
    "Lead Target",
    "Status",
    "Progress",
    "Leads Collected",
    "Leads Qualified",
    "Websites Built",
    "Websites Deployed",
    "Messages Sent",
    "Created At",
  ];

  const rows = campaigns.map((camp) => [
    camp.id,
    camp.name,
    camp.category,
    camp.location,
    camp.leadTarget,
    camp.status,
    camp.progress,
    camp.leadsCollected,
    camp.leadsQualified,
    camp.websitesBuilt,
    camp.websitesDeployed,
    camp.messagesSent,
    camp.createdAt,
  ]);

  return generateCsv(headers, rows);
}
