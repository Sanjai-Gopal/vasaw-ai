import { describe, it, expect } from "vitest";
import { sendEmail } from "@/lib/email/dispatcher";

describe("Email Automation & Dispatcher Engine", () => {
  it("should reject requests missing a valid recipient email", async () => {
    const result = await sendEmail({
      to: "invalid-email-address",
      subject: "Test Subject",
    });

    expect(result.ok).toBe(false);
    expect(result.status).toBe("error");
    expect(result.error).toContain("Invalid recipient email");
  });

  it("should format and dispatch automated email with delivery receipt", async () => {
    const result = await sendEmail({
      to: "founder@kovaibakery.com",
      from: "VASAW AI Growth <onboarding@resend.dev>",
      subject: "Private Website Preview for Kovai Artisanal Bakery",
      html: "<p>Hello! Check out your website preview: https://kovai-kitchen-fac214d9.vercel.app</p>",
      businessName: "Kovai Artisanal Bakery",
    });

    expect(result.ok).toBe(true);
    expect(result.messageId).toBeTruthy();
    expect(result.status).toBe("sent");
    expect(result.to).toBe("founder@kovaibakery.com");
    expect(result.subject).toBe("Private Website Preview for Kovai Artisanal Bakery");
    expect(result.deliveredAt).toBeTruthy();
  });
});
