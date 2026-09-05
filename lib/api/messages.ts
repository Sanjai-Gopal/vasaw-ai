import { apiClient } from "./client";
import type { Message } from "@/lib/types";

export interface GetMessagesResponse {
  ok: boolean;
  messages: Message[];
}

export async function fetchMessages(): Promise<Message[]> {
  const res = await apiClient<GetMessagesResponse>("/api/messages");
  return res.messages || [];
}

export async function sendOutreachMessage(payload: {
  leadId: string;
  phone: string;
  businessName: string;
  message: string;
  mode?: "mock" | "real";
}): Promise<{ ok: boolean; messageId?: string }> {
  return apiClient<{ ok: boolean; messageId?: string }>("/api/agents/whatsapp", {
    method: "POST",
    body: JSON.stringify({
      leadId: payload.leadId,
      phone: payload.phone,
      businessName: payload.businessName,
      message: { type: "text", body: payload.message },
      mode: payload.mode || "mock",
    }),
  });
}
