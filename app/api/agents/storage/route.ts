import { NextRequest, NextResponse } from "next/server";
import {
  saveLeads,
  getLeads,
  getLead,
  saveQualification,
  updateLeadStatus,
  saveCampaign,
  getCampaigns,
  getCampaign,
  recordAgentRun,
  getAgentRuns,
} from "@/lib/agents/storage";
import type { GetLeadsRequest } from "@/lib/agents/storage/types";

export const dynamic = "force-dynamic";

// POST /api/agents/storage/leads - Save leads
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action;

    switch (action) {
      case "saveLeads": {
        if (!body.campaignId || !body.leads || !Array.isArray(body.leads)) {
          return NextResponse.json(
            { success: false, error: "campaignId and leads array are required" },
            { status: 400 }
          );
        }
        const result = await saveLeads({
          campaignId: body.campaignId,
          leads: body.leads,
          apifyRunId: body.apifyRunId,
          apifyDatasetId: body.apifyDatasetId,
        });
        return NextResponse.json(result);
      }

      case "saveQualification": {
        if (!body.campaignId || !body.results || !Array.isArray(body.results)) {
          return NextResponse.json(
            { success: false, error: "campaignId and results array are required" },
            { status: 400 }
          );
        }
        const result = await saveQualification({
          campaignId: body.campaignId,
          results: body.results,
        });
        return NextResponse.json(result);
      }

      case "updateLeadStatus": {
        if (!body.leadId || !body.status) {
          return NextResponse.json(
            { success: false, error: "leadId and status are required" },
            { status: 400 }
          );
        }
        const result = await updateLeadStatus({
          leadId: body.leadId,
          status: body.status,
        });
        return NextResponse.json(result);
      }

      case "saveCampaign": {
        if (!body.name || !body.category || !body.location) {
          return NextResponse.json(
            { success: false, error: "name, category, and location are required" },
            { status: 400 }
          );
        }
        const result = await saveCampaign({
          name: body.name,
          category: body.category,
          location: body.location,
          leadTarget: body.leadTarget ?? 100,
          status: body.status ?? "draft",
          progress: body.progress ?? 0,
          leadsCollected: body.leadsCollected ?? 0,
          leadsQualified: body.leadsQualified ?? 0,
          websitesBuilt: body.websitesBuilt ?? 0,
          websitesDeployed: body.websitesDeployed ?? 0,
          messagesSent: body.messagesSent ?? 0,
          minimumRating: body.minimumRating ?? 4.0,
          minimumReviews: body.minimumReviews ?? 25,
          websiteOpportunityRequirement: body.websiteOpportunityRequirement ?? true,
          socialPresenceRequirement: body.socialPresenceRequirement ?? false,
          automationMode: body.automationMode ?? "semi-automatic",
        });
        return NextResponse.json({ success: true, campaign: result });
      }

      case "recordAgentRun": {
        if (!body.agentId || !body.status) {
          return NextResponse.json(
            { success: false, error: "agentId and status are required" },
            { status: 400 }
          );
        }
        const result = await recordAgentRun({
          agentId: body.agentId,
          status: body.status,
          startedAt: body.startedAt,
          completedAt: body.completedAt,
          durationMs: body.durationMs,
          success: body.success,
          error: body.error,
          detail: body.detail,
          metadata: body.metadata,
        });
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[API] Storage agent error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/agents/storage/leads - Get leads
// GET /api/agents/storage/campaigns - Get campaigns
// GET /api/agents/storage/agent-runs - Get agent runs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    switch (type) {
      case "leads": {
        const campaignId = searchParams.get("campaignId") || undefined;
        const status = searchParams.get("status") as GetLeadsRequest["status"] | undefined;
        const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined;
        const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!, 10) : undefined;
        const result = await getLeads({ campaignId, status, limit, offset });
        return NextResponse.json(result);
      }

      case "lead": {
        const id = searchParams.get("id");
        if (!id) {
          return NextResponse.json({ success: false, error: "id is required" }, { status: 400 });
        }
        const lead = await getLead(id);
        return NextResponse.json({ success: true, lead });
      }

      case "campaigns": {
        const result = await getCampaigns();
        return NextResponse.json({ success: true, campaigns: result });
      }

      case "campaign": {
        const id = searchParams.get("id");
        if (!id) {
          return NextResponse.json({ success: false, error: "id is required" }, { status: 400 });
        }
        const campaign = await getCampaign(id);
        return NextResponse.json({ success: true, campaign });
      }

      case "agent-runs": {
        const agentId = searchParams.get("agentId") || undefined;
        const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 50;
        const runs = await getAgentRuns(agentId, limit);
        return NextResponse.json({ success: true, runs });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown type: ${type}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[API] Storage agent error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}