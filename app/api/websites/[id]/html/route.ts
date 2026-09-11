import { NextRequest, NextResponse } from "next/server";
import { getWebsitePreviewHtml } from "@/lib/preview/html-generator";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return new NextResponse("Website identifier missing", { status: 400 });
    }

    const html = await getWebsitePreviewHtml(id);

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=60, s-maxage=300",
        // Allow iframe embedding within our own application
        "X-Frame-Options": "SAMEORIGIN",
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new NextResponse(`Failed to render website preview: ${msg}`, { status: 500 });
  }
}
