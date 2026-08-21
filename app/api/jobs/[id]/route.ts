import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getJob, getJobsByStatus, getJobsByLead, getJobsByCampaign, type JobStatus } from "@/lib/queue/job-queue";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    
    // Single job by ID
    if (id !== "list") {
      const job = await getJob(id);
      if (!job) {
        return NextResponse.json(
          { ok: false, error: "Job not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ ok: true, job });
    }
    
    // List jobs with filters
    const status = searchParams.get("status");
    const leadId = searchParams.get("leadId");
    const campaignId = searchParams.get("campaignId");
    const limit = parseInt(searchParams.get("limit") ?? "50");
    
    let jobs;
    if (status) {
      jobs = await getJobsByStatus(status as JobStatus, limit);
    } else if (leadId) {
      jobs = await getJobsByLead(leadId);
    } else if (campaignId) {
      jobs = await getJobsByCampaign(campaignId);
    } else {
      // Default: recent jobs
      const admin = getSupabaseAdmin();
      const { data, error } = await admin
        .from("jobs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      jobs = data ?? [];
    }
    
    return NextResponse.json({ ok: true, jobs });
  } catch (err) {
    console.error("[API] Jobs error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}