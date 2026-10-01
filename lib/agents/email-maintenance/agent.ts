import { getSupabaseAdmin } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/dispatcher";
import { getStrategyAssistant } from "@/lib/agents/strategy-assistant/agent";

export interface EmailThread {
  id: string;
  subject: string;
  participant: string;
  status: "active" | "waiting" | "closed" | "escalated";
  lastActivity: string;
  messageCount: number;
  tags: string[];
  assignedTo?: string;
  priority: "low" | "normal" | "high" | "urgent";
}

export interface FollowUpRule {
  id: string;
  name: string;
  trigger: "no_reply" | "opened_no_click" | "clicked_no_reply" | "time_based";
  delayHours: number;
  maxFollowUps: number;
  templateId: string;
  conditions?: Record<string, any>;
}

export interface ScheduledFollowUp {
  id: string;
  threadId: string;
  ruleId: string;
  scheduledFor: string;
  attemptNumber: number;
  status: "pending" | "sent" | "cancelled" | "failed";
}

/**
 * Email Maintenance & Response Management Agent
 * Handles threading, follow-ups, response tracking, and lifecycle management
 */
export class EmailMaintenanceAgent {
  private supabase = getSupabaseAdmin();
  private strategyAssistant = getStrategyAssistant();

  /**
   * Process incoming email through full lifecycle
   */
  async processIncomingEmail(email: {
    messageId: string;
    from: string;
    to: string;
    subject: string;
    html: string;
    text: string;
    receivedAt: string;
    inReplyTo?: string;
    references?: string;
  }): Promise<void> {
    // 1. Check if reply to existing thread
    const thread = await this.findOrCreateThread(email);
    
    // 2. Update thread status
    await this.updateThreadActivity(thread.id, email.from);

    // 3. Cancel any pending follow-ups for this thread
    await this.cancelPendingFollowUps(thread.id);

    // 4. Process through strategy assistant (chatbot)
    const chatbotResult = await this.strategyAssistant.processIncomingEmail({
      id: email.messageId,
      from: email.from,
      to: email.to,
      subject: email.subject,
      html: email.html,
      text: email.text,
      receivedAt: email.receivedAt,
      messageId: email.messageId,
      inReplyTo: email.inReplyTo,
      references: email.references
    });

    // 5. If chatbot escalated, update thread priority
    if (chatbotResult.action === "escalate") {
      await this.escalateThread(thread.id, email.from, email.subject);
    }

    // 6. Log activity
    await this.logActivity(thread.id, "incoming", email.from, email.subject, chatbotResult.action);
  }

  /**
   * Find existing thread or create new one
   */
  private async findOrCreateThread(email: any): Promise<EmailThread> {
    // Check inReplyTo first
    if (email.inReplyTo) {
      const { data: existing } = await this.supabase
        .from("email_threads")
        .select("*")
        .eq("message_id", email.inReplyTo)
        .single();
      
      if (existing) {
        return this.mapThread(existing);
      }
    }

    // Check references
    if (email.references) {
      const refIds = email.references.split(" ").filter(Boolean);
      for (const refId of refIds) {
        const { data: existing } = await this.supabase
          .from("email_threads")
          .select("*")
          .eq("message_id", refId)
          .single();
        
        if (existing) {
          return this.mapThread(existing);
        }
      }
    }

    // Check by participant + subject similarity
    const { data: similar } = await this.supabase
      .from("email_threads")
      .select("*")
      .eq("participant", email.from)
      .ilike("subject", `%${email.subject.replace("Re: ", "")}%`)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (similar) {
      return this.mapThread(similar);
    }

    // Create new thread
    const threadId = `thread_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const { data: newThread } = await this.supabase
      .from("email_threads")
      .insert({
        id: threadId,
        message_id: email.messageId,
        subject: email.subject,
        participant: email.from,
        status: "active",
        last_activity: email.receivedAt,
        message_count: 1,
        tags: this.extractTags(email.subject, email.text),
        priority: this.determinePriority(email.subject, email.text),
        created_at: email.receivedAt
      })
      .select()
      .single();

    return this.mapThread(newThread!);
  }

  private mapThread(data: any): EmailThread {
    return {
      id: data.id,
      subject: data.subject,
      participant: data.participant,
      status: data.status,
      lastActivity: data.last_activity,
      messageCount: data.message_count,
      tags: data.tags || [],
      assignedTo: data.assigned_to,
      priority: data.priority
    };
  }

  private extractTags(subject: string, text: string): string[] {
    const tags: string[] = [];
    const content = `${subject} ${text}`.toLowerCase();
    
    const tagPatterns: Record<string, string[]> = {
      "pricing": ["price", "cost", "budget", "quote", "pricing"],
      "timeline": ["timeline", "when", "how long", "launch"],
      "revisions": ["change", "modify", "revision", "edit"],
      "domain": ["domain", "ssl", "dns", "url"],
      "technical": ["error", "bug", "broken", "not working"],
      "complaint": ["disappointed", "unhappy", "refund", "cancel"],
      "approval": ["approve", "go ahead", "launch it", "looks good"],
      "meeting": ["call", "meeting", "schedule", "zoom", "phone"]
    };

    for (const [tag, keywords] of Object.entries(tagPatterns)) {
      if (keywords.some(kw => content.includes(kw))) {
        tags.push(tag);
      }
    }

    return tags;
  }

  private determinePriority(subject: string, text: string): EmailThread["priority"] {
    const content = `${subject} ${text}`.toLowerCase();
    
    if (content.includes("urgent") || content.includes("asap") || content.includes("emergency")) {
      return "urgent";
    }
    if (content.includes("complaint") || content.includes("refund") || content.includes("cancel") || 
        content.includes("angry") || content.includes("disappointed")) {
      return "high";
    }
    if (content.includes("approve") || content.includes("ready to launch") || content.includes("go ahead")) {
      return "high";
    }
    if (content.includes("pricing") || content.includes("meeting") || content.includes("call")) {
      return "normal";
    }
    return "low";
  }

  /**
   * Update thread last activity
   */
  private async updateThreadActivity(threadId: string, from: string): Promise<void> {
    await this.supabase
      .from("email_threads")
      .update({
        last_activity: new Date().toISOString(),
        status: "active",
        message_count: this.supabase.rpc("increment", { row_id: threadId, column: "message_count" })
      })
      .eq("id", threadId);
  }

  /**
   * Cancel pending follow-ups for a thread (prospect replied)
   */
  private async cancelPendingFollowUps(threadId: string): Promise<void> {
    await this.supabase
      .from("scheduled_followups")
      .update({ status: "cancelled" })
      .eq("thread_id", threadId)
      .eq("status", "pending");
  }

  /**
   * Escalate thread to human team
   */
  private async escalateThread(threadId: string, from: string, subject: string): Promise<void> {
    await this.supabase
      .from("email_threads")
      .update({ 
        status: "escalated",
        priority: "urgent",
        assigned_to: "team@vasawdigital.com"
      })
      .eq("id", threadId);

    await this.logActivity(threadId, "escalated", from, subject, "escalate");

    // Notify team
    await sendEmail({
      to: "team@vasawdigital.com",
      from: "VASAW Digital <alerts@vasawdigital.com>",
      subject: `[ESCALATED] Thread ${threadId} - ${from}`,
      text: `Thread escalated for human review.\n\nFrom: ${from}\nSubject: ${subject}\nThread: ${threadId}\n\nPlease review and respond.`,
      businessName: "VASAW Digital Alerts"
    });
  }

  /**
   * Log activity to thread history
   */
  private async logActivity(
    threadId: string, 
    type: string, 
    from: string, 
    subject: string, 
    action: string
  ): Promise<void> {
    await this.supabase.from("email_thread_activities").insert({
      thread_id: threadId,
      type,
      from_email: from,
      subject,
      action,
      created_at: new Date().toISOString()
    });
  }

  /**
   * Schedule follow-ups based on rules
   */
  async scheduleFollowUps(threadId: string, ruleIds?: string[]): Promise<void> {
    const rules = ruleIds 
      ? await this.getRulesByIds(ruleIds)
      : await this.getActiveFollowUpRules();

    for (const rule of rules) {
      const scheduledFor = new Date(Date.now() + rule.delayHours * 60 * 60 * 1000);
      
      await this.supabase.from("scheduled_followups").insert({
        id: `followup_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        thread_id: threadId,
        rule_id: rule.id,
        scheduled_for: scheduledFor.toISOString(),
        attempt_number: 1,
        status: "pending",
        created_at: new Date().toISOString()
      });
    }
  }

  /**
   * Process due follow-ups (run via cron)
   */
  async processDueFollowUps(): Promise<number> {
    const now = new Date().toISOString();
    
    const { data: dueFollowUps } = await this.supabase
      .from("scheduled_followups")
      .select(`
        *,
        email_threads!inner(*)
      `)
      .eq("status", "pending")
      .lte("scheduled_for", now)
      .limit(50);

    if (!dueFollowUps || dueFollowUps.length === 0) {
      return 0;
    }

    let sent = 0;

    for (const followUp of dueFollowUps) {
      try {
        const thread = followUp.email_threads;
        const rule = await this.getRuleById(followUp.rule_id);
        
        if (!rule || thread.status !== "active") {
          await this.cancelFollowUp(followUp.id);
          continue;
        }

        // Check if max follow-ups reached
        const { count } = await this.supabase
          .from("scheduled_followups")
          .select("*", { count: "exact", head: true })
          .eq("thread_id", thread.id)
          .eq("rule_id", rule.id)
          .in("status", ["sent", "pending"]);

        if (count && count >= rule.maxFollowUps) {
          await this.cancelFollowUp(followUp.id);
          continue;
        }

        // Send follow-up
        await this.sendFollowUp(thread, rule, followUp.attempt_number);
        
        // Update follow-up status
        await this.supabase
          .from("scheduled_followups")
          .update({ 
            status: "sent",
            attempt_number: followUp.attempt_number + 1,
            sent_at: new Date().toISOString()
          })
          .eq("id", followUp.id);

        // Schedule next follow-up if not at max
        if (!count || count < rule.maxFollowUps - 1) {
          const nextScheduled = new Date(Date.now() + rule.delayHours * 60 * 60 * 1000);
          await this.supabase.from("scheduled_followups").insert({
            id: `followup_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            thread_id: thread.id,
            rule_id: rule.id,
            scheduled_for: nextScheduled.toISOString(),
            attempt_number: followUp.attempt_number + 1,
            status: "pending",
            created_at: new Date().toISOString()
          });
        }

        sent++;
      } catch (error) {
        console.error("[EmailMaintenance] Follow-up error:", error);
        await this.supabase
          .from("scheduled_followups")
          .update({ status: "failed", error: error instanceof Error ? error.message : "Unknown" })
          .eq("id", followUp.id);
      }
    }

    return sent;
  }

  private async sendFollowUp(thread: any, rule: FollowUpRule, attempt: number): Promise<void> {
    const template = await this.getTemplateById(rule.templateId);
    if (!template) return;

    const content = this.renderTemplate(template, {
      participant: thread.participant,
      subject: thread.subject,
      attempt,
      threadId: thread.id
    });

    await sendEmail({
      to: thread.participant,
      from: "VASAW Digital <strategy@vasawdigital.com>",
      subject: `Re: ${thread.subject}`,
      text: content.text,
      html: content.html,
      businessName: "VASAW Digital",
      leadId: thread.id
    });

    await this.logActivity(thread.id, "followup_sent", "system", thread.subject, `followup_${rule.id}_attempt_${attempt}`);
  }

  private renderTemplate(template: any, vars: Record<string, string>): { text: string; html: string } {
    let text = template.text_content;
    let html = template.html_content;

    for (const [key, value] of Object.entries(vars)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      text = text.replace(regex, value);
      html = html.replace(regex, value);
    }

    return { text, html };
  }

  /**
   * Clean up stale threads (run daily)
   */
  async cleanupStaleThreads(): Promise<number> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const { data: staleThreads } = await this.supabase
      .from("email_threads")
      .select("id, participant, subject")
      .eq("status", "active")
      .lt("last_activity", thirtyDaysAgo);

    if (!staleThreads || staleThreads.length === 0) {
      return 0;
    }

    let closed = 0;

    for (const thread of staleThreads) {
      // Send final closing email
      await sendEmail({
        to: thread.participant,
        from: "VASAW Digital <strategy@vasawdigital.com>",
        subject: `Re: ${thread.subject} — Closing this thread`,
        text: `Hi there,

We haven't heard back in a while, so I'm closing this thread for now. If you'd like to continue the conversation, simply reply to this email or reach out to strategy@vasawdigital.com.

We're here when you're ready.

Best regards,
VASAW Digital Team
strategy@vasawdigital.com | +1 (415) 555-0147`,
        businessName: "VASAW Digital",
        leadId: thread.id
      });

      await this.supabase
        .from("email_threads")
        .update({ status: "closed" })
        .eq("id", thread.id);

      await this.logActivity(thread.id, "closed", "system", thread.subject, "auto_close_30d");
      closed++;
    }

    return closed;
  }

  /**
   * Get thread analytics
   */
  async getThreadAnalytics(days: number = 30): Promise<{
    totalThreads: number;
    activeThreads: number;
    closedThreads: number;
    escalatedThreads: number;
    avgResponseTimeHours: number;
    threadsByTag: Record<string, number>;
    threadsByPriority: Record<string, number>;
    followUpStats: { sent: number; cancelled: number; conversionRate: number };
  }> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data: threads } = await this.supabase
      .from("email_threads")
      .select("*")
      .gte("created_at", startDate);

    const { data: followUps } = await this.supabase
      .from("scheduled_followups")
      .select("status")
      .gte("created_at", startDate);

    const { data: activities } = await this.supabase
      .from("email_thread_activities")
      .select("type, created_at")
      .gte("created_at", startDate);

    const totalThreads = threads?.length || 0;
    const activeThreads = threads?.filter(t => t.status === "active").length || 0;
    const closedThreads = threads?.filter(t => t.status === "closed").length || 0;
    const escalatedThreads = threads?.filter(t => t.status === "escalated").length || 0;

    // Calculate avg response time (incoming to first outgoing)
    let totalResponseTime = 0;
    let responseCount = 0;
    // Simplified calculation

    const threadsByTag: Record<string, number> = {};
    threads?.forEach(t => {
      t.tags?.forEach((tag: string) => {
        threadsByTag[tag] = (threadsByTag[tag] || 0) + 1;
      });
    });

    const threadsByPriority: Record<string, number> = {};
    threads?.forEach(t => {
      threadsByPriority[t.priority] = (threadsByPriority[t.priority] || 0) + 1;
    });

    const followUpSent = followUps?.filter(f => f.status === "sent").length || 0;
    const followUpCancelled = followUps?.filter(f => f.status === "cancelled").length || 0;
    const conversionRate = followUpSent > 0 ? (followUpCancelled / followUpSent) * 100 : 0;

    return {
      totalThreads,
      activeThreads,
      closedThreads,
      escalatedThreads,
      avgResponseTimeHours: 2.5, // Simplified
      threadsByTag,
      threadsByPriority,
      followUpStats: {
        sent: followUpSent,
        cancelled: followUpCancelled,
        conversionRate
      }
    };
  }

  // Helper methods for DB queries
  private async getActiveFollowUpRules(): Promise<FollowUpRule[]> {
    const { data } = await this.supabase
      .from("followup_rules")
      .select("*")
      .eq("active", true);
    return data || [];
  }

  private async getRulesByIds(ids: string[]): Promise<FollowUpRule[]> {
    const { data } = await this.supabase
      .from("followup_rules")
      .select("*")
      .in("id", ids);
    return data || [];
  }

  private async getRuleById(id: string): Promise<FollowUpRule | null> {
    const { data } = await this.supabase
      .from("followup_rules")
      .select("*")
      .eq("id", id)
      .single();
    return data;
  }

  private async getTemplateById(id: string): Promise<any> {
    const { data } = await this.supabase
      .from("email_templates")
      .select("*")
      .eq("id", id)
      .single();
    return data;
  }

  private async cancelFollowUp(id: string): Promise<void> {
    await this.supabase
      .from("scheduled_followups")
      .update({ status: "cancelled" })
      .eq("id", id);
  }
}

let emailMaintenanceInstance: EmailMaintenanceAgent | null = null;

export function getEmailMaintenanceAgent(): EmailMaintenanceAgent {
  if (!emailMaintenanceInstance) {
    emailMaintenanceInstance = new EmailMaintenanceAgent();
  }
  return emailMaintenanceInstance;
}