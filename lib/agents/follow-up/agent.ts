import { getSupabaseAdmin } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/dispatcher";
import { getVoiceCallAgent } from "@/lib/agents/voice-call/agent";

export interface FollowUpStep {
  id: string;
  sequence: number;
  delayHours: number;
  channel: "email" | "voice" | "whatsapp";
  template: string;
  condition?: string;
}

export interface FollowUpSequence {
  id: string;
  name: string;
  trigger: "preview_sent" | "preview_viewed" | "call_completed" | "no_response";
  steps: FollowUpStep[];
  active: boolean;
}

export interface ScheduledFollowUp {
  id: string;
  sequenceId: string;
  leadId: string;
  stepId: string;
  scheduledFor: string;
  status: "pending" | "sent" | "skipped" | "failed";
  sentAt?: string;
}

const DEFAULT_SEQUENCES: FollowUpSequence[] = [
  {
    id: "seq_preview_sent",
    name: "Preview Sent Follow-Up",
    trigger: "preview_sent",
    active: true,
    steps: [
      {
        id: "step_1",
        sequence: 1,
        delayHours: 24,
        channel: "email",
        template: "preview_reminder_24h",
      },
      {
        id: "step_2",
        sequence: 2,
        delayHours: 48,
        channel: "voice",
        template: "preview_call_48h",
      },
      {
        id: "step_3",
        sequence: 3,
        delayHours: 72,
        channel: "email",
        template: "preview_urgency_72h",
      },
      {
        id: "step_4",
        sequence: 4,
        delayHours: 96,
        channel: "voice",
        template: "preview_final_call_96h",
      },
    ],
  },
  {
    id: "seq_no_response",
    name: "No Response Recovery",
    trigger: "no_response",
    active: true,
    steps: [
      {
        id: "step_1",
        sequence: 1,
        delayHours: 12,
        channel: "email",
        template: "gentle_reminder_12h",
      },
      {
        id: "step_2",
        sequence: 2,
        delayHours: 36,
        channel: "voice",
        template: "personal_call_36h",
      },
      {
        id: "step_3",
        sequence: 3,
        delayHours: 60,
        channel: "email",
        template: "breakup_email_60h",
      },
    ],
  },
  {
    id: "seq_call_completed",
    name: "Post-Call Follow-Up",
    trigger: "call_completed",
    active: true,
    steps: [
      {
        id: "step_1",
        sequence: 1,
        delayHours: 2,
        channel: "email",
        template: "call_summary_2h",
      },
      {
        id: "step_2",
        sequence: 2,
        delayHours: 24,
        channel: "email",
        template: "proposal_24h",
      },
      {
        id: "step_3",
        sequence: 3,
        delayHours: 72,
        channel: "voice",
        template: "proposal_followup_72h",
      },
    ],
  },
];

export class FollowUpAgent {
  private supabase = getSupabaseAdmin();
  private voiceAgent = getVoiceCallAgent();

  async startSequence(sequenceId: string, leadId: string): Promise<void> {
    const sequence = DEFAULT_SEQUENCES.find((s) => s.id === sequenceId);
    if (!sequence) return;

    for (const step of sequence.steps) {
      const scheduledFor = new Date(
        Date.now() + step.delayHours * 60 * 60 * 1000
      ).toISOString();

      await this.supabase.from("scheduled_followups").insert({
        id: `fu_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        sequence_id: sequenceId,
        lead_id: leadId,
        step_id: step.id,
        scheduled_for: scheduledFor,
        status: "pending",
        created_at: new Date().toISOString(),
      });
    }
  }

  async processDueFollowUps(): Promise<number> {
    const now = new Date().toISOString();

    const { data: dueFollowUps } = await this.supabase
      .from("scheduled_followups")
      .select(`
        *,
        leads!inner(*)
      `)
      .eq("status", "pending")
      .lte("scheduled_for", now)
      .limit(20);

    if (!dueFollowUps || dueFollowUps.length === 0) {
      return 0;
    }

    let sent = 0;

    for (const followUp of dueFollowUps) {
      try {
        const lead = followUp.leads;
        const step = this.getStepById(followUp.step_id);

        if (!step || !lead) {
          await this.skipFollowUp(followUp.id);
          continue;
        }

        if (step.channel === "email") {
          await this.sendEmailFollowUp(lead, step.template);
        } else if (step.channel === "voice") {
          await this.sendVoiceFollowUp(lead, step.template);
        }

        await this.supabase
          .from("scheduled_followups")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
          })
          .eq("id", followUp.id);

        sent++;
      } catch (error) {
        console.error("[FollowUpAgent] Error:", error);
        await this.supabase
          .from("scheduled_followups")
          .update({ status: "failed" })
          .eq("id", followUp.id);
      }
    }

    return sent;
  }

  private async sendEmailFollowUp(lead: any, template: string): Promise<void> {
    const templates: Record<string, { subject: string; text: string }> = {
      preview_reminder_24h: {
        subject: `Your website preview is waiting — ${lead.business_name}`,
        text: `Hi ${lead.contact_name || "there"},

Just a friendly reminder that your free website preview for ${lead.business_name} is ready to view.

Preview URL: ${lead.preview_url || "https://vasawdigital.com/preview"}

If you have any questions, simply reply to this email.

Best regards,
VASAW Digital Team`,
      },
      preview_urgency_72h: {
        subject: `Your preview expires soon — ${lead.business_name}`,
        text: `Hi ${lead.contact_name || "there"},

Your free website preview for ${lead.business_name} expires in 24 hours.

After expiration, you'll need to book a new strategy session to access it.

Claim your preview: ${lead.preview_url || "https://vasawdigital.com/preview"}

Best regards,
VASAW Digital Team`,
      },
      gentle_reminder_12h: {
        subject: `Following up — ${lead.business_name}`,
        text: `Hi ${lead.contact_name || "there"},

I wanted to follow up on the website strategy we sent over. I understand you're busy, so I'll keep this short.

Would a quick 10-minute call this week work for you? I can walk you through the preview and answer any questions.

Best regards,
VASAW Digital Team`,
      },
      breakup_email_60h: {
        subject: `Should I close your file? — ${lead.business_name}`,
        text: `Hi ${lead.contact_name || "there"},

I haven't heard back regarding the website strategy for ${lead.business_name}, so I wanted to check in one last time.

If the timing isn't right, no problem at all — I'll close your file for now. If you'd like to revisit this later, just reply to this email and I'll reach out next quarter.

If you're still interested, here's your preview: ${lead.preview_url || "https://vasawdigital.com/preview"}

Either way, I wish you and ${lead.business_name} all the best.

Best regards,
VASAW Digital Team`,
      },
      call_summary_2h: {
        subject: `Great speaking with you — ${lead.business_name}`,
        text: `Hi ${lead.contact_name || "there"},

Thank you for taking the time to speak with me today about ${lead.business_name}'s digital strategy.

As discussed, I'll send over a detailed proposal within 24 hours. In the meantime, feel free to review your preview: ${lead.preview_url || "https://vasawdigital.com/preview"}

Looking forward to working together.

Best regards,
Sarah Chen
VASAW Digital`,
      },
      proposal_24h: {
        subject: `Your custom proposal — ${lead.business_name}`,
        text: `Hi ${lead.contact_name || "there"},

As promised, here's your custom proposal for ${lead.business_name}:

[Proposal will be attached or linked]

The proposal includes:
- Recommended package based on our discussion
- Timeline and deliverables
- Investment options (including payment plans)
- Next steps to get started

If you have any questions or would like to discuss further, just reply to this email or book a call: https://calendly.com/vasawdigital/strategy-call

Best regards,
Sarah Chen
VASAW Digital`,
      },
    };

    const content = templates[template];
    if (!content) return;

    await sendEmail({
      to: lead.email,
      from: "VASAW Digital <strategy@vasawdigital.com>",
      subject: content.subject,
      text: content.text,
      businessName: lead.business_name,
      leadId: lead.id,
    });
  }

  private async sendVoiceFollowUp(lead: any, template: string): Promise<void> {
    if (!lead.phone) return;

    const result = await this.voiceAgent.initiateCall({
      phoneNumber: lead.phone,
      purpose: "follow_up",
      metadata: {
        template,
        lead_id: lead.id,
      },
      variables: {
        customer_name: lead.contact_name || "there",
        business_name: lead.business_name,
      },
    });

    if (!result.success) {
      throw new Error(result.error || "Voice call failed");
    }
  }

  private getStepById(stepId: string): FollowUpStep | undefined {
    for (const seq of DEFAULT_SEQUENCES) {
      const step = seq.steps.find((s) => s.id === stepId);
      if (step) return step;
    }
    return undefined;
  }

  private async skipFollowUp(id: string): Promise<void> {
    await this.supabase
      .from("scheduled_followups")
      .update({ status: "skipped" })
      .eq("id", id);
  }

  async getSequenceForTrigger(trigger: string): Promise<FollowUpSequence | undefined> {
    return DEFAULT_SEQUENCES.find((s) => s.trigger === trigger && s.active);
  }
}

let followUpAgentInstance: FollowUpAgent | null = null;

export function getFollowUpAgent(): FollowUpAgent {
  if (!followUpAgentInstance) {
    followUpAgentInstance = new FollowUpAgent();
  }
  return followUpAgentInstance;
}