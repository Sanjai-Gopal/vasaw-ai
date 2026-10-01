import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/dispatcher";
import { getVoiceCallAgent } from "@/lib/agents/voice-call/agent";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, time, business, preview_url, source } = body;

    if (!name || !email || !phone) {
      return NextResponse.json(
        { ok: false, error: "Name, email, and phone are required" },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdmin();

    const { data: booking, error } = await admin
      .from("call_bookings")
      .insert({
        name,
        email,
        phone,
        preferred_time: time,
        business_name: business,
        preview_url,
        source: source || "website_widget",
        status: "pending",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    await sendEmail({
      to: "team@vasawdigital.com",
      from: "VASAW Digital <alerts@vasawdigital.com>",
      subject: `[CALL BOOKING] ${name} — ${business}`,
      text: `New strategy call booking:\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nPreferred Time: ${time}\nBusiness: ${business}\nPreview: ${preview_url}\nSource: ${source}\n\nCall them within 2 hours.`,
      businessName: "VASAW Digital Alerts",
    });

    await sendEmail({
      to: email,
      from: "VASAW Digital <strategy@vasawdigital.com>",
      subject: `Your strategy call is booked — ${business}`,
      text: `Hi ${name},\n\nThank you for booking a free strategy call with VASAW Digital.\n\nWe will call you at ${phone} during your preferred time: ${time}.\n\nIf you need to reschedule, just reply to this email.\n\nLooking forward to speaking with you.\n\nBest regards,\nSarah Chen\nSenior Digital Strategist\nVASAW Digital\n+1 (415) 555-0147`,
      businessName: business,
    });

    if (phone) {
      const voiceAgent = getVoiceCallAgent();
      await voiceAgent.notifyTeamOfResponse(email, phone);
    }

    return NextResponse.json({ ok: true, booking });
  } catch (err) {
    console.error("[API] /api/book-call error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}