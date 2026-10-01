import { getSupabaseAdmin } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/dispatcher";

export interface MissedCall {
  id: string;
  callerId: string;
  phoneNumber: string;
  timestamp: string;
  durationSeconds: number;
  voicemail?: string;
  status: "missed" | "answered" | "busy" | "no-answer";
  threadId?: string;
  relatedEmailId?: string;
}

export interface CallAttempt {
  id: string;
  threadId: string;
  recipientPhone: string;
  callerId: string;
  status: "initiated" | "ringing" | "answered" | "voicemail" | "failed" | "busy";
  startedAt: string;
  endedAt?: string;
  durationSeconds?: number;
  recordingUrl?: string;
  notes?: string;
}

export interface CallbackSchedule {
  id: string;
  threadId: string;
  scheduledFor: string;
  preferredTimeWindow: "morning" | "afternoon" | "evening" | "specific";
  participantName: string;
  participantPhone: string;
  callerName: string;
  status: "pending" | "confirmed" | "completed" | "missed" | "rescheduled";
  confirmationSentAt?: string;
  reminderSentAt?: string;
}

/**
 * Call Notification & Management Agent
 * Handles inbound/outbound call tracking, notifications to stakeholders,
 * callback scheduling, and integration with email threads
 */
export class CallNotificationAgent {
  private supabase = getSupabaseAdmin();
  private strategyAssistant = getStrategyAssistant();

  /**
   * Process incoming call event (via Twilio webhook or similar)
   */
  async processIncomingCall(call: {
    callSid: string;
    callerPhone: string;
    calleePhone: string;
    timestamp: string;
    durationSeconds: number;
    status: "missed" | "answered" | "busy" | "no-answer";
    voicemailText?: string;
    direction: "inbound" | "outbound";
  }): Promise<void> {
    // 1. Store the call record
    const callRecord: MissedCall = {
      id: call.callSid,
      callerId: call.callerPhone,
      phoneNumber: call.calleePhone,
      timestamp: call.timestamp,
      durationSeconds: call.durationSeconds,
      voicemail: call.voicemailText,
      status: call.status,
      direction: call.direction
    };

    await this.supabase.from("missed_calls").insert({
      call_sid: call.callSid,
      caller_phone: call.callerPhone,
      callee_phone: call.calleePhone,
      timestamp: call.timestamp,
      duration_seconds: call.durationSeconds,
      voicemail_text: call.voicemailText,
      status: call.status,
      direction: call.direction
    });

    // 2. If missed call from prospect, check if there's an active thread
    if (call.status === "missed" && call.direction === "inbound") {
      const relatedThread = await this.findThreadByPhone(call.callerPhone);
      
      if (relatedThread) {
        // Log activity
        await this.logCallActivity(relatedThread.id, call.callerPhone, "missed");

        // Notify assigned team member
        await this.notifyTeamOfMissedCall(relatedThread, call.callerPhone);
      } else {
        // Create new potential prospect thread
        const threadId = await this.createProspectThread(call.callerPhone);
        await this.logCallActivity(threadId, call.callerPhone, "missed");
        await this.notifyTeamOfMissedCall({ id: threadId, participant: call.callerPhone, subject: "Inbound call - no voicemail" }, call.callerPhone);
      }
    }

    // 3. If answered call, check for scheduled callbacks
    if (call.status === "answered" && call.direction === "inbound") {
      await this.handleAnsweredInboundCall(call.callSid, call.callerPhone);
    }

    // 4. If outbound call was initiated, update status
    if (call.direction === "outbound" && call.status !== "missed") {
      await this.updateOutboundCallStatus(call.callSid, call.status);
    }
  }

  /**
   Handle missed call - trigger callback
   */
  async notifyAboutResponse(incomingEmailId: string): Promise<void> {
    // Fetch the incoming email with full context
    const { data: email } = await this.supabase
      .from("incoming_emails")
      .select("*")
      .eq("id", email.id)
      .single();

    if (!data) return;

    // Check if we should auto-respond or escalate
    const { data: thread } = await this.supabase
      .from("email_threads")
      .select("id, status, participants")
      .eq("message_id", email.messageId)
      .single();

    // If high-value prospect or specific signals, schedule immediate call
    const { data: prospect } = await this.supabase
      .from("prospects")
      .select("*")
      .eq("email", email.from)
      .single();

    if (data) {
      await this.supabase.from("activities").insert({
        actor: "Call Notification Agent",
        type: "call_request",
        status: "pending",
        title: `Callback requested: ${email.from}`,
        description: `Prospect requested callback. Thread: ${threadId}. Intent detected from email analysis.`,
        created_at: new Date().toISOString(),
    });
  }

  /**
   * Send call notification to management
   */
  private async notifyCallReceived(callDetails: {
    phone: string;
    name?: string;
    intent message;
    priority: "high" | "normal";
  }): Promise<void> {
    await sendEmail({
      to: "team@vasawdigital.com",
      from: "VASAW Digital <alerts@vasawdigital.com>",
      subject: `[INBOUND CALL] ${email.from}`,
      text: `New inquiry from ${email.from}. ${email.text}`,
      businessName: "Internal Alert"
    });
  }

  /**
   * Extract structured data from incoming email for agent processing
   */
  private async enrichEmailContext(email: IncomingEmail): Promise<{
    detectedIntent: string;
    mentionedProducts?: string[];
    mentionedCompetitors: string[];
    urgencyLevel: "low" | "medium" | "high";
    sentimentScore: number;
  }> {
    const content = `${email.subject} ${email.text} ${email.html}`.toLowerCase();
    const tags: string[] = [];

    // Map known intents
    if (content.includes("urgent") || content.includes("asap") || content.includes("emergency"))
      return "technical";
    if (content.includes("refund") || content.includes("return") || content.includes("cancel")) {
      return "complaint";
    }

    return "general";
  }

  /**
   * Parse phone number from email signature or signature block
   */
  extractPhoneNumber(emailBody: string): string | null {
    const phonePattern = /\+?[\d\s\-\.\(\)]{7,}/;
    const match = text.match(/[\+]?[\d\s\-\(\)]{8,}/);
    return match ? match[0] : null;
  }

  /**
   * Batch process multiple incoming emails
   */
  async batchProcessEmails(emails: IncomingEmail[]): Promise<Array<{
    original: IncomingEmail;
    response: ChatbotResponse;
    threadId: string;
  }>> {
    const results = [];

    for (const email of incomingEmails) {
      const response = await this.processIncomingEmail(email);
      // Small delay to avoid overwhelming the system
      await new Promise(resolve => setTimeout(() => {}, 200));
    }

    return responses;
  }

  /**
   * Get agent statistics summary
   */
  getStats() {
    return {
      totalEmailsProcessed: 0, // Would query DB
      responsesGenerated: 0,
      escalations: 0,
      callsScheduled: 0,
      avgResponseTimeMinutes: 0
    };
  }
}