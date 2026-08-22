import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { runWebsiteBuildingAgent, type TemplateType } from "@/lib/agents/website-building";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { forceTemplate } = body;
    
    const admin = getSupabaseAdmin();
    
    const { data: website } = await admin
      .from("websites")
      .select("*, leads(*)")
      .eq("id", id)
      .single();
    
    if (!website) {
      return NextResponse.json(
        { ok: false, error: "Website not found" },
        { status: 404 }
      );
    }
    
    const lead = website.leads as unknown as Record<string, unknown>;
    const qualification = (lead.qualification_json as Record<string, unknown>) ?? {};
    const opportunity = (lead.opportunity_json as Record<string, unknown>) ?? {};
    const scrapedData = (lead.qualification_json as Record<string, unknown>) ?? {};
    
    const result = await runWebsiteBuildingAgent({
      leadId: website.lead_id,
      businessName: website.business_name,
      category: website.category,
      location: website.location,
      rating: website.rating ?? 0,
      reviews: website.reviews ?? 0,
      phone: lead.phone as string,
      email: lead.email as string | undefined,
      website: lead.website as string | null,
      subCategory: lead.sub_category as string | undefined,
      scraped: {
        address: lead.address as string,
        phone: lead.phone as string,
        email: lead.email as string | undefined,
        rating: website.rating ?? 0,
        reviews: website.reviews ?? 0,
        category: website.category,
        subCategory: lead.sub_category as string | undefined,
        hours: lead.hours as string | undefined,
        services: (scrapedData.services as string[]) ?? [],
        source: "Google Maps",
        scrapedAt: lead.scraped_at as string,
      },
      qualification: {
        hasWebsite: qualification.hasWebsite as boolean,
        websiteQuality: qualification.websiteQuality as number,
        hasWhatsApp: qualification.hasWhatsApp as boolean,
        hasReviews: qualification.hasReviews as boolean,
        responseLikelihood: (() => {
          const v = qualification.responseLikelihood as string;
          return v === "high" || v === "medium" || v === "low" ? v : "medium";
        })(),
        notes: qualification.notes as string,
      },
      opportunity: {
        score: opportunity.score as number,
        priority: (() => {
          const v = opportunity.priority as string;
          return v === "high" || v === "medium" || v === "low" ? v : "medium";
        })(),
        reasons: (opportunity.factors as string[]) ?? [],
        estimatedValue: opportunity.estimatedValue as number,
      },
    }, { forceTemplate: forceTemplate as TemplateType | undefined });
    
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    console.error("[API] Website rebuild error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}