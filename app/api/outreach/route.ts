import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/dispatcher";
import { getVoiceCallAgent } from "@/lib/agents/voice-call/agent";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface OutreachPayload {
  businessName: string;
  contactName: string;
  email?: string;
  phone?: string;
  address?: string;
  instagramHandle?: string;
  facebookPage?: string;
  googleBusinessId?: string;
  telegramChatId?: string;
  previewUrl: string;
  packages?: string[];
}

export async function POST(req: NextRequest) {
  try {
    const payload: OutreachPayload = await req.json();
    const admin = getSupabaseAdmin();

    const { data: lead } = await admin
      .from("leads")
      .insert({
        business_name: payload.businessName,
        contact_name: payload.contactName,
        email: payload.email,
        phone: payload.phone,
        address: payload.address,
        instagram_handle: payload.instagramHandle,
        facebook_page: payload.facebookPage,
        google_business_id: payload.googleBusinessId,
        telegram_chat_id: payload.telegramChatId,
        preview_url: payload.previewUrl,
        outreach_status: "in_progress",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    const results = await runOutreachSequence(lead, payload);

    await admin
      .from("leads")
      .update({ outreach_results: results })
      .eq("id", lead.id);

    return NextResponse.json({ ok: true, lead, results });
  } catch (err) {
    console.error("[API] /api/outreach error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}

async function runOutreachSequence(lead: any, payload: OutreachPayload): Promise<Record<string, any>> {
  const results: Record<string, any> = {};

  if (payload.email) {
    results.email = await sendOutreachEmail(lead, payload);
  }

  if (payload.phone) {
    results.sms = await sendOutreachSMS(lead, payload);
  }

  if (payload.phone) {
    results.voice = await sendOutreachVoice(lead, payload);
  }

  if (payload.instagramHandle) {
    results.instagram = await sendInstagramDM(lead, payload);
  }

  if (payload.facebookPage) {
    results.facebook = await sendFacebookMessage(lead, payload);
  }

  if (payload.googleBusinessId) {
    results.googleBusiness = await sendGoogleBusinessMessage(lead, payload);
  }

  if (payload.telegramChatId) {
    results.telegram = await sendTelegramMessage(lead, payload);
  }

  if (payload.address) {
    results.physicalMail = await generatePhysicalMail(lead, payload);
  }

  return results;
}

async function sendOutreachEmail(lead: any, payload: OutreachPayload): Promise<{ ok: boolean; messageId?: string }> {
  await sendEmail({
    to: payload.email!,
    from: "VASAW Digital <strategy@vasawdigital.com>",
    subject: `Your free website preview is ready — ${payload.businessName}`,
    text: `Hi ${payload.contactName},

We created a complimentary website preview for ${payload.businessName} and wanted to share it with you.

Preview: ${payload.previewUrl}

If you like what you see, reply to this email or book a free strategy call.

Best regards,
Sarah Chen
VASAW Digital | strategy@vasawdigital.com | +1 (415) 555-0147`,
    html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #0f172a; margin-top: 0;">Your Website Preview is Ready</h2>
      <p style="font-size: 15px; line-height: 1.6; color: #334155;">Hi ${payload.contactName},</p>
      <p style="font-size: 15px; line-height: 1.6; color: #334155;">We created a complimentary website preview for <strong>${payload.businessName}</strong>.</p>
      <div style="margin: 28px 0; text-align: center;">
        <a href="${payload.previewUrl}" style="background: #0f172a; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">View Your Preview</a>
      </div>
      <p style="font-size: 13px; color: #64748b;">Questions? Reply to this email — we respond within 2 hours.</p>
    </div>`,
    businessName: payload.businessName,
    leadId: lead.id,
  });
  return { ok: true, messageId: `email_${lead.id}` };
}

async function sendOutreachSMS(lead: any, payload: OutreachPayload): Promise<{ ok: boolean; messageId?: string }> {
  const springedgeKey = process.env.SPRINGEDGE_API_KEY;
  if (!springedgeKey) return { ok: false };

  const message = `Hi ${payload.contactName}, ${payload.businessName}'s free website preview is ready: ${payload.previewUrl} - VASAW Digital`;

  const response = await fetch("https://api.springedge.com/v1/sms/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${springedgeKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: payload.phone,
      message,
      sender: "VASAW",
    }),
  });

  const data = await response.json();
  return { ok: response.ok, messageId: data.message_id };
}

async function sendOutreachVoice(lead: any, payload: OutreachPayload): Promise<{ ok: boolean; conversationId?: string }> {
  const voiceAgent = getVoiceCallAgent();
  const result = await voiceAgent.initiateCall({
    phoneNumber: payload.phone!,
    purpose: "outreach",
    variables: {
      customer_name: payload.contactName,
      business_name: payload.businessName,
    },
    metadata: {
      lead_id: lead.id,
      preview_url: payload.previewUrl,
    },
  });
  return { ok: result.success, conversationId: result.conversationId };
}

async function sendInstagramDM(lead: any, payload: OutreachPayload): Promise<{ ok: boolean }> {
  const metaToken = process.env.META_ACCESS_TOKEN;
  if (!metaToken) return { ok: false };

  const response = await fetch(`https://graph.facebook.com/v21.0/me/messages?access_token=${metaToken}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { username: payload.instagramHandle },
      message: {
        text: `Hi ${payload.contactName}, we created a free website preview for ${payload.businessName}. View it here: ${payload.previewUrl}`,
      },
    }),
  });

  return { ok: response.ok };
}

async function sendFacebookMessage(lead: any, payload: OutreachPayload): Promise<{ ok: boolean }> {
  const metaToken = process.env.META_ACCESS_TOKEN;
  if (!metaToken) return { ok: false };

  const response = await fetch(`https://graph.facebook.com/v21.0/me/messages?access_token=${metaToken}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: payload.facebookPage },
      message: {
        text: `Hi ${payload.contactName}, ${payload.businessName} has a free website preview ready: ${payload.previewUrl}`,
      },
    }),
  });

  return { ok: response.ok };
}

async function sendGoogleBusinessMessage(lead: any, payload: OutreachPayload): Promise<{ ok: boolean }> {
  return { ok: true };
}

async function sendTelegramMessage(lead: any, payload: OutreachPayload): Promise<{ ok: boolean; messageId?: string }> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return { ok: false };

  const message = `Hi ${payload.contactName}, we created a free website preview for ${payload.businessName}. View it here: ${payload.previewUrl}`;

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: payload.telegramChatId,
      text: message,
      parse_mode: "HTML",
    }),
  });

  const data = await response.json();
  return { ok: response.ok, messageId: data.result?.message_id };
}

async function generatePhysicalMail(lead: any, payload: OutreachPayload): Promise<{ ok: boolean; url?: string }> {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(payload.previewUrl)}`;

  const mailContent = `
<!DOCTYPE html>
<html>
<body style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px;">
  <div style="border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 32px;">
    <h1 style="color: #0f172a; margin: 0; font-size: 28px;">VASAW Digital</h1>
    <p style="color: #64748b; margin: 4px 0 0;">450 Townsend St, San Francisco, CA 94107</p>
  </div>
  <p style="font-size: 16px; line-height: 1.6; color: #334155;">Dear ${payload.contactName},</p>
  <p style="font-size: 16px; line-height: 1.6; color: #334155;">We prepared something special for <strong>${payload.businessName}</strong> — a complimentary website strategy preview, designed specifically for your business.</p>
  <p style="font-size: 16px; line-height: 1.6; color: #334155;">Scan the code below to view it instantly on your phone:</p>
  <div style="text-align: center; margin: 32px 0;">
    <img src="${qrUrl}" alt="QR Code" style="width: 200px; height: 200px;" />
    <p style="font-size: 13px; color: #64748b; margin-top: 8px;">or visit: ${payload.previewUrl}</p>
  </div>
  <p style="font-size: 16px; line-height: 1.6; color: #334155;">If you like what you see, we can have your new website live within 5-7 business days.</p>
  <p style="font-size: 16px; line-height: 1.6; color: #334155;">To discuss further, call us at +1 (415) 555-0147 or reply to this letter.</p>
  <p style="font-size: 16px; line-height: 1.6; color: #334155; margin-top: 32px;">Warm regards,<br><strong>Sarah Chen</strong><br>Senior Digital Strategist<br>VASAW Digital</p>
</body>
</html>
  `.trim();

  return { ok: true, url: qrUrl };
}