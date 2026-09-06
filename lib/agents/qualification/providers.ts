import { QualificationProvider, QualificationRequest, QualificationResult } from "./types";
import { calculateQualifications } from "./calculate";

export class MockProvider implements QualificationProvider {
  async qualify(request: QualificationRequest): Promise<QualificationResult[]> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return calculateQualifications(request.leads);
  }
}

export class AIProvider implements QualificationProvider {
  async qualify(request: QualificationRequest): Promise<QualificationResult[]> {
    const { routeRequest } = await import("@/lib/ai/router");

    const QUALIFICATION_PROMPT = `You are a business qualification analyst for VASAW AI.
Evaluate local business leads for website building services.

Evaluate ONLY the data provided. Do NOT invent or assume:
- Financial information
- Owner interviews or private business data
- Search volume or ad spend
- Information not explicitly in the data

Score factors (weight in parentheses):
1. Website existence (no website = +30, poor website = +15)
2. Website quality if exists (0-100 scale)
3. Rating: 4.5+ = +25, 4.0-4.4 = +15, 3.5-3.9 = +5, <3.5 = -10
4. Review count: 500+ = +20, 100-499 = +15, 50-99 = +10, 10-49 = +5, <10 = 0
5. Social presence (2+ platforms = +5)
6. Category needs website (restaurant, salon, gym, clinic, etc. = +10)

Output structured JSON only for EACH lead:
[
  {
    "leadId": "string",
    "score": 0-100,
    "priority": "high" | "medium" | "low",
    "websiteOpportunity": boolean,
    "reason": "One sentence summary",
    "confidence": 0.0-1.0,
    "factors": {
      "hasWebsite": boolean,
      "websiteQuality": 0-100,
      "rating": number,
      "reviewCount": number,
      "category": "string",
      "socialPresence": boolean,
      "businessTypeNeedsWebsite": boolean
    },
    "evidence": ["factor1", "factor2", ...]
  }
]`;

    const businessData = request.leads.map((lead) => ({
      leadId: lead.id,
      businessName: lead.businessName,
      category: lead.category,
      location: lead.city,
      rating: lead.rating,
      reviewCount: lead.reviewCount,
      website: lead.website,
      phone: lead.phone,
      socialLinks: lead.socialLinks,
    }));

    const response = await routeRequest({
      messages: [
        { role: "system", content: QUALIFICATION_PROMPT },
        { role: "user", content: JSON.stringify(businessData, null, 2) },
      ],
      task: "reasoning",
      temperature: 0.2,
      maxTokens: 2048,
    });

    if (!response.response.success || !response.response.content) {
      throw new Error(`AI qualification failed: ${response.response.errorMessage}`);
    }

    try {
      const rawContent = response.response.content.trim();
      const cleanJson = rawContent
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/, "")
        .trim();
      const results = JSON.parse(cleanJson) as QualificationResult[];
      return results.map((r) => ({
        ...r,
        factors: {
          hasWebsite: Boolean(r.factors?.hasWebsite),
          websiteQuality: Number(r.factors?.websiteQuality) || 0,
          rating: Number(r.factors?.rating) || 0,
          reviewCount: Number(r.factors?.reviewCount) || 0,
          category: String(r.factors?.category) || "",
          socialPresence: Boolean(r.factors?.socialPresence),
          businessTypeNeedsWebsite: Boolean(r.factors?.businessTypeNeedsWebsite),
        },
        evidence: Array.isArray(r.evidence) ? r.evidence : [],
      }));
    } catch {
      throw new Error("Failed to parse AI qualification response");
    }
  }
}

export function getProvider(mode: "mock" | "ai"): QualificationProvider {
  if (mode === "mock") {
    return new MockProvider();
  }
  return new AIProvider();
}