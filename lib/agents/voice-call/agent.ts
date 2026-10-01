import { getSupabaseAdmin } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/dispatcher";
import { placeEdesyCall, isEdesyConfigured, getEdesyWorkspaceId } from "@/lib/voice/edesy";

export interface VoiceCallRequest {
  phoneNumber: string;
  agentId?: string;
  purpose: "follow_up" | "response_notification" | "meeting_reminder" | "general";
  metadata?: Record<string, string>;
  variables?: Record<string, string>;
}

export interface VoiceCallResult {
  success: boolean;
  conversationId?: string;
  error?: string;
}

export interface CallNotification {
  id: string;
  phoneNumber: string;
  status: "initiated" | "ringing" | "answered" | "completed" | "failed";
  purpose: string;
  agentId: string;
  conversationId: string;
  createdAt: string;
  completedAt?: string;
  duration?: number;
  transcript?: string;
  summary?: string;
}

const DEFAULT_AGENT_PROMPT = `You are Sarah Chen, Senior Digital Strategist at VASAW Digital.

Your role is to:
1. Greet the caller professionally
2. Reference their recent email inquiry about our website strategy services
3. Offer to answer questions or schedule a strategy call
4. If they're ready to proceed, collect their preferred timeline
5. Thank them for their interest

Key information to share if asked:
- Starter package: $2,999 (5-page site, 5-7 day delivery)
- Professional package: $5,999 (10-page site, CMS, 10-14 day delivery)
- Enterprise package: $12,999+ (custom, dedicated strategist)
- All packages include: custom domain, SSL, SEO, analytics, support

Tone: Professional, warm, consultative. Never pushy. Keep responses concise.`;

/**
 * Voice Call Agent — integrates with Edesy Voice API
 * Handles outbound call placement, notifications, and call tracking
 */
export class VoiceCallAgent {
  private supabase = getSupabaseAdmin();

  async initiateCall(request: VoiceCallRequest): Promise<VoiceCallResult> {
    if (!isEdesyConfigured()) {
      return { success: false, error: "Edesy API not configured" };
    }

    const agentId = request.agentId || process.env.EDESY_AGENT_ID || "";

    if (!agentId) {
      return { success: false, error: "No agent ID configured. Set EDESY_AGENT_ID in .env.local" };
    }

    const result = await placeEdesyCall({
      agentId,
      phoneNumber: request.phoneNumber,
      metadata: {
        purpose: request.purpose,
        workspace_id: getEdesyWorkspaceId(),
        ...request.metadata,
      },
      variables: request.variables,
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    await this.logCall({
      phone_number: request.phoneNumber,
      status: "initiated",
      purpose: request.purpose,
      agent_id: agentId,
      conversation_id: result.data!.conversationId,
      created_at: new Date().toISOString(),
    });

    return {
      success: true,
      conversationId: result.data!.conversationId,
    };
  }

  async notifyTeamOfResponse(prospectEmail: string, phoneNumber: string): Promise<void> {
    await sendEmail({
      to: "team@vasawdigital.com",
      from: "VASAW Digital <alerts@vasawdigital.com>",
      subject: `[CALL NEEDED] Response from ${prospectEmail}`,
      text: `A prospect has responded to our outreach and may need a call.\n\nEmail: ${prospectEmail}\nPhone: ${phoneNumber}\n\nPlease follow up within 2 hours.`,
      businessName: "VASAW Digital Alerts",
    });

    await this.supabase.from("activities").insert({
      actor: "Voice Call Agent",
      type: "call_requested",
      status: "pending",
      title: `Call requested: ${prospectEmail}`,
      description: `Prospect responded. Phone: ${phoneNumber}. Email: ${prospectEmail}`,
      created_at: new Date().toISOString(),
    });
  }

  async handleCallWebhook(webhookData: {
    conversationId: string;
    status: string;
    duration?: number;
    transcript?: string;
    summary?: string;
  }): Promise<void> {
    const updateData: Record<string, any> = {
      status: webhookData.status,
      completed_at: new Date().toISOString(),
    };

    if (webhookData.duration) updateData.duration = webhookData.duration;
    if (webhookData.transcript) updateData.transcript = webhookData.transcript;
    if (webhookData.summary) updateData.summary = webhookData.summary;

    await this.supabase
      .from("voice_calls")
      .update(updateData)
      .eq("conversation_id", webhookData.conversationId);

    if (webhookData.status === "completed" && webhookData.summary) {
      await this.supabase.from("activities").insert({
        actor: "Voice Call Agent",
        type: "call_completed",
        status: "success",
        title: `Call completed: ${webhookData.conversationId}`,
        description: webhookData.summary,
        created_at: new Date().toISOString(),
      });
    }
  }

  async getCallHistory(limit: number = 50): Promise<CallNotification[]> {
    const { data } = await this.supabase
      .from("voice_calls")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    return (data || []).map((row: any) => ({
      id: row.id,
      phoneNumber: row.phone_number,
      status: row.status,
      purpose: row.purpose,
      agentId: row.agent_id,
      conversationId: row.conversation_id,
      createdAt: row.created_at,
      completedAt: row.completed_at,
      duration: row.duration,
      transcript: row.transcript,
      summary: row.summary,
    }));
  }

  private async logCall(call: {
    phone_number: string;
    status: string;
    purpose: string;
    agent_id: string;
    conversation_id: string;
    created_at: string;
  }): Promise<void> {
    await this.supabase.from("voice_calls").insert(call);
  }
}

let voiceCallAgentInstance: VoiceCallAgent | null = null;

export function getVoiceCallAgent(): VoiceCallAgent {
  if (!voiceCallAgentInstance) {
    voiceCallAgentInstance = new VoiceCallAgent();
  }
  return voiceCallAgentInstance;
}