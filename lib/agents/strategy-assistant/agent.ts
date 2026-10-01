import { getSupabaseAdmin } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/dispatcher";

export interface ChatbotResponse {
  success: boolean;
  message: string;
  action?: "reply" | "escalate" | "schedule_call" | "none";
  responseContent?: string;
}

export interface IncomingEmail {
  id: string;
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  receivedAt: string;
  messageId: string;
  inReplyTo?: string;
  references?: string;
}

/**
 * Strategy Assistant Chatbot Agent
 * Handles incoming emails to strategy@vasawdigital.com
 * Provides intelligent responses based on context and business rules
 */
export class StrategyAssistantAgent {
  private supabase = getSupabaseAdmin();
  private knowledgeBase: Map<string, string> = new Map();

  constructor() {
    this.initializeKnowledgeBase();
  }

  private initializeKnowledgeBase() {
    this.knowledgeBase.set("pricing", `
Our website strategy packages:
- Starter: $2,999 — 5-page site, mobile-first, SEO foundation, 30-day support
- Professional: $5,999 — 10-page site, CMS, analytics, review integration, 90-day support
- Enterprise: $12,999+ — Custom pages, integrations, A/B testing, dedicated strategist, 1-year support

All packages include: custom domain setup, SSL, Google Analytics, Search Console, monthly performance reports.
    `);

    this.knowledgeBase.set("timeline", `
Typical timeline from approval to launch:
- Starter: 5-7 business days
- Professional: 10-14 business days
- Enterprise: 3-6 weeks (depends on complexity)

Revision cycles: 2 rounds included in all packages. Additional rounds at $500/round.
    `);

    this.knowledgeBase.set("revisions", `
We include 2 rounds of revisions in every package. 
Revision requests can be submitted via:
1. Reply to any email from our team
2. Email strategy@vasawdigital.com with specific changes
3. Annotated screenshots via our feedback portal (link provided after approval)

Typical revision turnaround: 1-2 business days.
    `);

    this.knowledgeBase.set("domain", `
Domain services included:
- New domain registration (first year free)
- Existing domain connection (DNS configuration)
- SSL certificate (automatic renewal)
- Email forwarding setup (up to 5 addresses)
- DNS management for 1 year
    `);

    this.knowledgeBase.set("maintenance", `
Ongoing maintenance plans:
- Essential: $199/mo — Updates, security monitoring, backups, uptime monitoring
- Growth: $499/mo — Essential + content updates (4hrs/mo), performance optimization, quarterly strategy review
- Scale: $1,299/mo — Growth + unlimited content updates, A/B testing, conversion optimization, priority support

All plans include 99.9% uptime SLA and 24/7 security monitoring.
    `);

    this.knowledgeBase.set("contact", `
VASAW Digital
450 Townsend St, San Francisco, CA 94107
Phone: +1 (415) 555-0147
Email: strategy@vasawdigital.com
Business Hours: Mon-Fri 9am-6pm PST
    `);

    this.knowledgeBase.set("portfolio", `
View our portfolio at: https://vasawdigital.com/portfolio
Recent projects include restaurants, professional services, e-commerce, and SaaS companies across 12+ industries.
    `);
  }

  /**
   * Process incoming email and generate appropriate response
   */
  async processIncomingEmail(email: IncomingEmail): Promise<ChatbotResponse> {
    try {
      // Store incoming email
      await this.storeIncomingEmail(email);

      // Analyze intent
      const intent = this.analyzeIntent(email);
      
      // Check if this is a reply to our thread
      const isReply = !!email.inReplyTo || !!email.references;
      const threadId = await this.getOrCreateThread(email);

      // Generate response based on intent
      const response = await this.generateResponse(email, intent, isReply, threadId);

      // If response needed, send it
      if (response.action === "reply" && response.responseContent) {
        await this.sendResponse(email, response.responseContent, threadId);
      }

      // If escalation needed, notify team
      if (response.action === "escalate") {
        await this.escalateToTeam(email, intent);
      }

      // If call scheduling needed
      if (response.action === "schedule_call") {
        await this.scheduleCall(email, threadId);
      }

      return response;
    } catch (error) {
      console.error("[StrategyAssistant] Error processing email:", error);
      return {
        success: false,
        message: `Processing error: ${error instanceof Error ? error.message : "Unknown error"}`,
        action: "escalate"
      };
    }
  }

  /**
   * Analyze email intent using keyword matching and context
   */
  private analyzeIntent(email: IncomingEmail): string {
    const content = `${email.subject} ${email.text} ${email.html}`.toLowerCase();
    
    const intentPatterns = {
      pricing: ["price", "cost", "budget", "quote", "pricing", "how much", "fee"],
      timeline: ["timeline", "when", "how long", "launch", "ready", "deadline", "schedule"],
      revisions: ["change", "modify", "update", "revision", "edit", "adjust", "tweak"],
      domain: ["domain", "url", "website address", "custom domain", "ssl", "https"],
      maintenance: ["maintain", "support", "ongoing", "monthly", "hosting", "updates", "backup"],
      portfolio: ["portfolio", "example", "sample", "previous work", "case study", "show me"],
      meeting: ["call", "meeting", "schedule", "talk", "discuss", "phone", "zoom", "calendar"],
      approval: ["approve", "approve", "go ahead", "launch it", "looks good", "ready to launch"],
      complaint: ["disappointed", "unhappy", "issue", "problem", "wrong", "mistake", "refund"],
      technical: ["error", "bug", "broken", "not working", "mobile", "responsive", "speed"]
    };

    for (const [intent, keywords] of Object.entries(intentPatterns)) {
      if (keywords.some(kw => content.includes(kw))) {
        return intent;
      }
    }

    return "general";
  }

  /**
   * Generate contextual response
   */
  private async generateResponse(
    email: IncomingEmail, 
    intent: string, 
    isReply: boolean,
    threadId: string
  ): Promise<ChatbotResponse> {
    
    const knowledge = this.knowledgeBase.get(intent) || this.knowledgeBase.get("general") || "";
    const senderName = this.extractName(email.from);

    let responseContent = "";
    let action: ChatbotResponse["action"] = "none";

    switch (intent) {
      case "pricing":
        responseContent = this.buildPricingResponse(senderName, isReply);
        action = "reply";
        break;
      case "timeline":
        responseContent = this.buildTimelineResponse(senderName, isReply);
        action = "reply";
        break;
      case "revisions":
        responseContent = this.buildRevisionsResponse(senderName, isReply);
        action = "reply";
        break;
      case "domain":
        responseContent = this.buildDomainResponse(senderName, isReply);
        action = "reply";
        break;
      case "maintenance":
        responseContent = this.buildMaintenanceResponse(senderName, isReply);
        action = "reply";
        break;
      case "portfolio":
        responseContent = this.buildPortfolioResponse(senderName, isReply);
        action = "reply";
        break;
      case "meeting":
        responseContent = this.buildMeetingResponse(senderName, isReply);
        action = "schedule_call";
        break;
      case "approval":
        responseContent = this.buildApprovalResponse(senderName, isReply);
        action = "reply";
        break;
      case "complaint":
        action = "escalate";
        break;
      case "technical":
        action = "escalate";
        break;
      default:
        responseContent = this.buildGeneralResponse(senderName, isReply);
        action = "reply";
    }

    // Store response in thread
    await this.storeOutgoingResponse(threadId, email.from, responseContent, intent);

    return {
      success: true,
      message: `Processed ${intent} intent`,
      action,
      responseContent
    };
  }

  private buildPricingResponse(name: string, isReply: boolean): string {
    return `${isReply ? "Thank you for your follow-up." : `Hi ${name},`}

Thank you for asking about our pricing. Here's a clear breakdown:

${this.knowledgeBase.get("pricing")}

Would you like me to prepare a detailed proposal for your specific needs? I can also schedule a brief call with our strategy team to walk through options.

Best regards,
Strategy Assistant
VASAW Digital | strategy@vasawdigital.com
    `.trim();
  }

  private buildTimelineResponse(name: string, isReply: boolean): string {
    return `${isReply ? "Thanks for the question." : `Hi ${name},`}

Regarding timeline, here's what you can expect:

${this.knowledgeBase.get("timeline")}

Once you approve the preview, we'll send a project kickoff email with exact milestones and a shared timeline tracker.

Best regards,
Strategy Assistant
VASAW Digital | strategy@vasawdigital.com
    `.trim();
  }

  private buildRevisionsResponse(name: string, isReply: boolean): string {
    return `${isReply ? "Understood." : `Hi ${name},`}

${this.knowledgeBase.get("revisions")}

Simply reply to this email with your specific changes, and our design team will implement them within 1-2 business days.

Best regards,
Strategy Assistant
VASAW Digital | strategy@vasawdigital.com
    `.trim();
  }

  private buildDomainResponse(name: string, isReply: boolean): string {
    return `${isReply ? "Good question." : `Hi ${name},`}

${this.knowledgeBase.get("domain")}

If you have an existing domain, we'll need access to your DNS provider (GoDaddy, Cloudflare, Namecheap, etc.) or you can add our nameservers. For new domains, we handle registration and configuration entirely.

Best regards,
Strategy Assistant
VASAW Digital | strategy@vasawdigital.com
    `.trim();
  }

  private buildMaintenanceResponse(name: string, isReply: boolean): string {
    return `${isReply ? "Thanks for asking." : `Hi ${name},`}

${this.knowledgeBase.get("maintenance")}

The Essential plan covers most small business needs. Growth and Scale are ideal if you're actively updating content or optimizing for conversions.

Best regards,
Strategy Assistant
VASAW Digital | strategy@vasawdigital.com
    `.trim();
  }

  private buildPortfolioResponse(name: string, isReply: boolean): string {
    return `${isReply ? "Here you go." : `Hi ${name},`}

${this.knowledgeBase.get("portfolio")}

I can also filter by industry if you'd like to see examples relevant to your business type.

Best regards,
Strategy Assistant
VASAW Digital | strategy@vasawdigital.com
    `.trim();
  }

  private buildMeetingResponse(name: string, isReply: boolean): string {
    return `${isReply ? "Great, let's set that up." : `Hi ${name},`}

I'd be happy to schedule a call with our strategy team. Our available slots this week:

- Tuesday: 10am, 2pm PST
- Wednesday: 9am, 3pm PST  
- Thursday: 11am, 1pm PST
- Friday: 10am, 2pm PST

Please reply with your preferred time (and timezone), or book directly at: https://calendly.com/vasawdigital/strategy-call

Calls are 30 minutes with a senior strategist — no sales pressure, just strategy.

Best regards,
Strategy Assistant
VASAW Digital | strategy@vasawdigital.com
    `.trim();
  }

  private buildApprovalResponse(name: string, isReply: boolean): string {
    return `${isReply ? "Excellent." : `Hi ${name},`}

Perfect — thank you for the approval! I'm initiating the launch sequence now. You'll receive:

1. Project kickoff email within 1 hour with your dedicated project manager
2. DNS configuration guide (if using existing domain)
3. Access to your project dashboard with real-time progress
4. Launch date confirmation within 24 hours

Your dedicated strategist will be your single point of contact throughout.

Welcome to VASAW Digital!

Best regards,
Strategy Assistant
VASAW Digital | strategy@vasawdigital.com
    `.trim();
  }

  private buildGeneralResponse(name: string, isReply: boolean): string {
    return `${isReply ? "Thank you for your message." : `Hi ${name},`}

Thank you for reaching out to VASAW Digital. I've received your message and want to make sure you get the right information quickly.

Based on your email, I can help with:
• Pricing and package details
• Project timeline and launch process
• Revision requests and feedback
• Domain setup and SSL
• Ongoing maintenance plans
• Portfolio examples
• Scheduling a strategy call

Could you let me know which area you'd like to explore? Or feel free to ask any specific question — I'm here to help.

Best regards,
Strategy Assistant
VASAW Digital | strategy@vasawdigital.com
    `.trim();
  }

  private extractName(email: string): string {
    const match = email.match(/^([^<]+)</);
    if (match) return match[1].trim().split(" ")[0];
    const localPart = email.split("@")[0];
    return localPart.split(".")[0].charAt(0).toUpperCase() + localPart.split(".")[0].slice(1);
  }

  /**
   * Send automated response
   */
  private async sendResponse(originalEmail: IncomingEmail, content: string, threadId: string): Promise<void> {
    const subject = originalEmail.subject.startsWith("Re:") 
      ? originalEmail.subject 
      : `Re: ${originalEmail.subject}`;

    await sendEmail({
      to: originalEmail.from,
      from: "VASAW Digital <strategy@vasawdigital.com>",
      subject,
      text: content,
      html: this.textToHtml(content),
      businessName: "VASAW Digital",
      leadId: threadId
    });
  }

  private textToHtml(text: string): string {
    return text
      .split("\n\n")
      .map(p => p.trim() ? `<p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #334155;">${p.replace(/\n/g, "<br>")}</p>` : "")
      .join("");
  }

  /**
   * Escalate to human team
   */
  private async escalateToTeam(email: IncomingEmail, intent: string): Promise<void> {
    await this.supabase.from("activities").insert({
      actor: "Strategy Assistant",
      type: "escalation",
      status: "pending",
      title: `Escalation: ${intent} inquiry from ${email.from}`,
      description: `Incoming email requires human review. Subject: ${email.subject}\nFrom: ${email.from}\nIntent: ${intent}`,
      created_at: new Date().toISOString(),
    });

    // Notify team via internal email
    await sendEmail({
      to: "team@vasawdigital.com",
      from: "VASAW Digital <alerts@vasawdigital.com>",
      subject: `[ESCALATION] ${intent.toUpperCase()} - ${email.from}`,
      text: `Escalation needed for ${intent} inquiry.\n\nFrom: ${email.from}\nSubject: ${email.subject}\n\n--- Original Message ---\n${email.text}`,
      businessName: "Internal Alert"
    });
  }

  /**
   * Schedule a call with the prospect
   */
  private async scheduleCall(email: IncomingEmail, threadId: string): Promise<void> {
    await this.supabase.from("activities").insert({
      actor: "Strategy Assistant",
      type: "call_scheduled",
      status: "pending",
      title: `Call Request: ${email.from}`,
      description: `Prospect requested a call. Thread: ${threadId}. Subject: ${email.subject}`,
      created_at: new Date().toISOString(),
    });
  }

  /**
   * Store incoming email
   */
  private async storeIncomingEmail(email: IncomingEmail): Promise<void> {
    await this.supabase.from("incoming_emails").insert({
      message_id: email.messageId,
      from_email: email.from,
      to_email: email.to,
      subject: email.subject,
      html_content: email.html,
      text_content: email.text,
      received_at: email.receivedAt,
      in_reply_to: email.inReplyTo,
      references: email.references,
      status: "received"
    });
  }

  /**
   * Get or create conversation thread
   */
  private async getOrCreateThread(email: IncomingEmail): Promise<string> {
    if (email.inReplyTo) {
      const { data } = await this.supabase
        .from("email_threads")
        .select("id")
        .eq("message_id", email.inReplyTo)
        .single();
      if (data) return data.id;
    }

    const threadId = `thread_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    await this.supabase.from("email_threads").insert({
      id: threadId,
      message_id: email.messageId,
      subject: email.subject,
      participant: email.from,
      status: "active",
      created_at: new Date().toISOString()
    });
    return threadId;
  }

  /**
   * Store outgoing response
   */
  private async storeOutgoingResponse(
    threadId: string, 
    to: string, 
    content: string, 
    intent: string
  ): Promise<void> {
    await this.supabase.from("outgoing_responses").insert({
      thread_id: threadId,
      to_email: to,
      content,
      intent,
      sent_at: new Date().toISOString(),
      status: "sent"
    });

    await this.supabase.from("email_threads")
      .update({ last_activity: new Date().toISOString(), status: "active" })
      .eq("id", threadId);
  }
}

/**
 * Singleton instance
 */
let strategyAssistantInstance: StrategyAssistantAgent | null = null;

export function getStrategyAssistant(): StrategyAssistantAgent {
  if (!strategyAssistantInstance) {
    strategyAssistantInstance = new StrategyAssistantAgent();
  }
  return strategyAssistantInstance;
}