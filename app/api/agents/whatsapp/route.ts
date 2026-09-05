import { NextRequest, NextResponse } from "next/server";
import { runWhatsAppAgent, validateWhatsAppRequest } from "@/lib/agents/whatsapp";

export const dynamic = "force-dynamic";

/**
 * POST /api/agents/whatsapp
 * Agent 6 API endpoint for sending transactional WhatsApp messages to leads.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        {
          success: false,
          agent: "whatsapp",
          error: "Invalid JSON body. Expected a SendWhatsAppRequest object.",
        },
        { status: 400 }
      );
    }

    const validation = validateWhatsAppRequest(body);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          agent: "whatsapp",
          error: validation.errors.join("; "),
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    const response = await runWhatsAppAgent(body);

    if (!response.success) {
      return NextResponse.json(response, { status: 502 });
    }

    return NextResponse.json(response, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      {
        success: false,
        agent: "whatsapp",
        error: message,
      },
      { status: 500 }
    );
  }
}
