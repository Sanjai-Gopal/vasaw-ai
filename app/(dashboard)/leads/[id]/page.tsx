import { notFound } from "next/navigation";
import { getLeadById } from "@/lib/data/leads";
import { getWebsitesByLead } from "@/lib/data/websites";
import { getDeploymentsByLead } from "@/lib/data/websites";
import { getMessagesByLead } from "@/lib/data/messages";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await getLeadById(id);
  if (!lead) return { title: "Lead Not Found" };
  return { title: lead.businessName };
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [lead, websites, deployments, messages] = await Promise.all([
    getLeadById(id),
    getWebsitesByLead(id),
    getDeploymentsByLead(id),
    getMessagesByLead(id),
  ]);

  if (!lead) notFound();

  const priorityVariant: Record<string, "destructive" | "warning" | "muted"> = {
    high: "destructive",
    medium: "warning",
    low: "muted",
  };

  const website = websites[0];
  const deployment = deployments[0];
  const latestMessage = messages[0];

  return (
    <html>
      <head>
        <title>{lead.businessName}</title>
      </head>
      <body>
        <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
          <h1>{lead.businessName}</h1>
          <p>Category: {lead.category}</p>
          <p>Location: {lead.location}</p>
          <p>Rating: {lead.rating}/5 ({lead.reviews} reviews)</p>
          <p>Phone: {lead.phone}</p>
          <p>AI Score: {lead.aiScore}</p>
          <p>Status: {lead.status}</p>
          {website && (
            <div>
              <h2>Website</h2>
              <p>Status: {website.status}</p>
              <p>Template: {website.template}</p>
              {website.liveUrl && <p>Live URL: {website.liveUrl}</p>}
            </div>
          )}
          {deployment && (
            <div>
              <h2>Deployment</h2>
              <p>Status: {deployment.status}</p>
              {deployment.liveUrl && <p>Live URL: {deployment.liveUrl}</p>}
            </div>
          )}
        </div>
      </body>
    </html>
  );
}