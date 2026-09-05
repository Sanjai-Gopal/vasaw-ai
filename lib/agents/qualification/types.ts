import { Lead } from "@/lib/agents/scraping/types";

export interface QualificationFactors {
  hasWebsite: boolean;
  websiteQuality: number;
  rating: number;
  reviewCount: number;
  category: string;
  socialPresence: boolean;
  businessTypeNeedsWebsite: boolean;
}

export interface QualificationResult {
  leadId: string;
  score: number;
  priority: "high" | "medium" | "low";
  websiteOpportunity: boolean;
  reason: string;
  confidence: number;
  factors: QualificationFactors;
  evidence: string[];
}

export interface QualificationRequest {
  leads: Lead[];
  mode: "mock" | "ai";
}

export interface QualificationResponse {
  success: boolean;
  agent: "qualification";
  mode: "mock" | "ai";
  count: number;
  results: QualificationResult[];
  error?: string;
}

export interface QualificationProvider {
  qualify(request: QualificationRequest): Promise<QualificationResult[]>;
}