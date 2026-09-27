import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/dispatcher";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      to,
      from,
      subject,
      html,
      text,
      businessName,
      leadId,
      apiKey,
    } = body;

    if (!to) {
      return NextResponse.json(
        { ok: false, error: "Recipient email 'to' is required." },
        { status: 400 }
      );
    }

    const defaultSubject = subject || `Elevating ${businessName || "Your Business"}'s Online Presence`;
    const defaultHtml =
      html ||
      `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0;">
        <h2 style="color: #0f172a; margin-top: 0;">Hello from VASAW AI</h2>
        <p style="font-size: 15px; line-height: 1.6; color: #334155;">
          We reviewed <strong>${businessName || "your business"}</strong> and noticed your exceptional customer ratings. We automatically synthesized a high-performance website preview tailored to your brand.
        </p>
        <div style="margin: 28px 0; text-align: center;">
          <a href="https://kovai-kitchen-fac214d9.vercel.app" style="background: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">
            View Private Website Preview &rarr;
          </a>
        </div>
        <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
          This preview was synthesized autonomously by the VASAW AI Multi-Agent Pipeline.
        </p>
      </div>
      `;

    const result = await sendEmail({
      to,
      from,
      subject: defaultSubject,
      html: defaultHtml,
      text,
      businessName,
      leadId,
      apiKey,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[API] /api/email/send error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Internal error sending email" },
      { status: 500 }
    );
  }
}
